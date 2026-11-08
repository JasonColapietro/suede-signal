import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import { syncBuiltinESMExports } from 'node:module';

dns.lookup = async () => [{ address: '93.184.216.34', family: 4 }];
syncBuiltinESMExports();
const { runAudit } = await import('../lib/audit.ts');
const PAGE = '<title>Example</title><h1>Example</h1><p>Useful content.</p>';

async function audit({ robots = '', status = 200, unavailable = false, llms = true, path = '/' } = {}) {
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === '/robots.txt') {
      if (unavailable) throw new Error('connection reset');
      return new Response(robots, { status });
    }
    if (url.pathname === '/llms.txt') return new Response(llms ? '# Example' : '', { status: llms ? 200 : 404 });
    return new Response(PAGE, { status: 200 });
  };
  const report = await runAudit(`https://example.com${path}`);
  return { report, lane: report.lanes.find((lane) => lane.id === 'crawler-access') };
}

const allowed = (lane, bot) => lane.checks.find((check) => check.id === `bot-${bot}`).passed;

for (const [name, robots, bot, want, path = '/'] of [
  ['wildcard disallow', 'User-agent: *\nDisallow: /', 'OAI-SearchBot', false],
  ['consecutive user agents', 'User-agent: OAI-SearchBot\nUser-agent: Claude-SearchBot\nDisallow: /', 'OAI-SearchBot', false],
  ['specific group overrides wildcard', 'User-agent: *\nDisallow: /\nUser-agent: OAI-SearchBot\nAllow: /', 'OAI-SearchBot', true],
  ['unmatched bot uses wildcard', 'User-agent: *\nDisallow: /\nUser-agent: OAI-SearchBot\nAllow: /', 'Claude-SearchBot', false],
  ['repeated exact groups merge', 'User-agent: OAI-SearchBot\nDisallow: /\nUser-agent: OtherBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /public', 'OAI-SearchBot', true, '/public/guide'],
  ['specific allow wins longest match', 'User-agent: *\nDisallow: /private\nAllow: /private/public', 'OAI-SearchBot', true, '/private/public'],
  ['path disallow applies', 'User-agent: *\nDisallow: /private', 'OAI-SearchBot', false, '/private/guide'],
  ['allow wins tie independent of order', 'User-agent: OAI-SearchBot\nAllow: /\nDisallow: /', 'OAI-SearchBot', true],
  ['comments do not change token matching', 'User-agent: oAi-SeArChBoT # crawler\nDisallow: / # private', 'OAI-SearchBot', false],
  ['another token does not match', 'User-agent: OAI-SearchBot-News\nDisallow: /', 'OAI-SearchBot', true],
  ['wildcard and end anchor', 'User-agent: *\nDisallow: /*.pdf$', 'OAI-SearchBot', false, '/manual.pdf'],
  ['query survives end anchor', 'User-agent: *\nDisallow: /*.pdf$', 'OAI-SearchBot', true, '/manual.pdf?download=1'],
]) {
  test(name, async () => {
    const { lane } = await audit({ robots, path });
    assert.equal(allowed(lane, bot), want);
  });
}

for (const options of [{ status: 503 }, { status: 429 }, { status: 302 }, { unavailable: true }]) {
  test(`unavailable robots ${JSON.stringify(options)} is unknown evidence, not missing`, async () => {
    const { lane, report } = await audit(options);
    assert.equal(lane.score, 50);
    assert.equal(lane.checks[0].id, 'robots-unavailable');
    assert.equal(lane.checks[0].passed, false);
    assert.match(lane.checks[0].detail, /unknown/i);
    assert.doesNotMatch(lane.checks[0].detail, /allowed by default/);
    assert.equal(report.lanes.length, 5, 'other lanes remain available');
    const noGuide = await audit({ ...options, llms: false });
    assert.equal(noGuide.lane.score, 0);
  });
}

for (const status of [401, 403, 404, 410]) {
  test(`robots ${status} preserves unavailable-file rules`, async () => {
    const { lane } = await audit({ status });
    assert.equal(lane.checks[0].id, 'robots-missing');
    assert.equal(lane.checks[0].passed, true);
    assert.equal(lane.score, 100);
    assert.equal((await audit({ status, llms: false })).lane.score, 50);
  });
}

test('healthy and blocked rule scores preserve independent llms credit', async () => {
  assert.equal((await audit({ robots: 'User-agent: *\nAllow: /' })).lane.score, 100);
  assert.equal((await audit({ robots: 'User-agent: *\nAllow: /', llms: false })).lane.score, 83);
  assert.equal((await audit({ robots: 'User-agent: *\nDisallow: /' })).lane.score, 17);
  assert.equal((await audit({ robots: 'User-agent: *\nDisallow: /', llms: false })).lane.score, 0);
});

 test('training-only opt-outs do not reduce search-crawler eligibility', async () => {
  const { lane } = await audit({ robots: 'User-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: Google-Extended\nUser-agent: CCBot\nDisallow: /' });
  assert.equal(lane.score, 100);
  assert.deepEqual(lane.checks.filter(c => c.id.startsWith('bot-')).map(c => c.id), ['bot-Googlebot','bot-Bingbot','bot-OAI-SearchBot','bot-Claude-SearchBot','bot-PerplexityBot']);
  assert.ok(lane.checks.every(c => !c.fix));
});

test('redirected pages use the final origin robots and final path', async () => {
  const calls = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    calls.push(url.href);
    if (url.host === 'example.com') return new Response('', { status: 308, headers: { location: 'https://canonical.example/private?x=1' } });
    if (url.pathname === '/robots.txt') return new Response('User-agent: *\nDisallow: /private?x=1$');
    if (url.pathname === '/llms.txt') return new Response('# Example');
    return new Response(PAGE);
  };
  const report = await runAudit('https://example.com/');
  const lane = report.lanes.find(lane => lane.id === 'crawler-access');
  assert.equal(allowed(lane, 'OAI-SearchBot'), false);
  assert.ok(calls.includes('https://canonical.example/robots.txt'));
  assert.ok(calls.includes('https://canonical.example/llms.txt'));
});

test('robots redirect exhaustion is unavailable rather than a missing file', async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === '/robots.txt') return new Response('', { status: 302, headers: { location: '/robots.txt' } });
    return new Response(url.pathname === '/llms.txt' ? '# Example' : PAGE);
  };
  const report = await runAudit('https://example.com/');
  const lane = report.lanes.find(lane => lane.id === 'crawler-access');
  assert.equal(lane.checks[0].id, 'robots-unavailable');
  assert.equal(lane.score, 50);
});

test('longer matching patterns retain operator specificity like the Google matcher', async () => {
  for (const [robots, path] of [['User-agent: *\nAllow: /fish\nDisallow: /fish*', '/fish'], ['User-agent: *\nAllow: /\nDisallow: /*', '/'], ['User-agent: *\nAllow: /\nDisallow: /$', '/']]) {
    const { lane } = await audit({ robots, path });
    assert.equal(allowed(lane, 'OAI-SearchBot'), false);
  }
});

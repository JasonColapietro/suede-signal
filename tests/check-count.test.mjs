// Guard: every published audit check count matches the engine.
//
// The number of checks is repeated on the homepage, /docs, /docs/scoring,
// /docs/api, /docs/faq, the article CTA, llms.txt and /ai-instructions. It
// drifted once: the copy said 26 while lib/audit.ts ran 23. The count also
// depends on the target: with a reachable robots.txt the crawler lane runs one
// check per AI bot plus llms.txt, and without one a single "robots.txt
// reachable" check replaces the bot checks. This test runs the real engine
// offline (DNS and fetch are stubbed; nothing leaves the process) twice, once
// against a site that serves robots.txt and llms.txt and once against the same
// site with robots.txt returning 404, and compares the copy against both:
//
//   1. Every "N checks", "N deterministic checks" or "N-check" claim in the
//      served source is either "up to <max>" or the no-robots.txt total on a
//      line that names robots.txt. A bare "<max> checks" is rejected.
//   2. The /docs/scoring lane table lists each lane's real weight and maximum
//      check count, its rows add up to the maximum, and the page states the
//      no-robots.txt totals for the crawler lane and the whole audit.
//   3. The /articles lane cards ("Seven checks: ...") match each lane, and a
//      lane whose count depends on robots.txt says "Up to".

import { test } from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns/promises";
import { syncBuiltinESMExports } from "node:module";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// lib/audit.ts resolves every host before fetching (SSRF guard). Answer with a
// public address so the guard passes; the stubbed fetch below never connects.
dns.lookup = async () => [{ address: "93.184.216.34", family: 4 }];
syncBuiltinESMExports();

const PAGE = `<!doctype html><html><head><title>Example page</title></head>
<body><h1>Example</h1><p>Body text.</p></body></html>`;

let serveRobots = true;
globalThis.fetch = async (input) => {
  const { pathname } = new URL(String(input));
  if (pathname === "/robots.txt") {
    return serveRobots
      ? new Response("User-agent: *\nAllow: /\n", { status: 200 })
      : new Response("Not found", { status: 404 });
  }
  if (pathname === "/llms.txt") return new Response("# Example\n\n> An example site.\n", { status: 200 });
  return new Response(PAGE, { status: 200, headers: { "content-type": "text/html" } });
};

const { runAudit } = await import(join(ROOT, "lib", "audit.ts"));

async function laneCounts(withRobots) {
  serveRobots = withRobots;
  const report = await runAudit("https://example.com/");
  return new Map(report.lanes.map((l) => [l.title, { weight: l.weight, checks: l.checks.length }]));
}

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const toWord = (n) => Object.keys(WORDS).find((w) => WORDS[w] === n);

const total = (lanes) => [...lanes.values()].reduce((sum, l) => sum + l.checks, 0);

const LANES = await laneCounts(true);
const NO_ROBOTS_LANES = await laneCounts(false);
const TOTAL = total(LANES);
const NO_ROBOTS_TOTAL = total(NO_ROBOTS_LANES);

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      walk(full, exts, out);
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

test("the engine runs five lanes with checks in each", () => {
  assert.equal(LANES.size, 5);
  for (const [title, lane] of LANES) assert.ok(lane.checks > 0, `${title} has no checks`);
});

test("a missing robots.txt lowers the total from 23 to 18", () => {
  assert.equal(TOTAL, 23);
  assert.equal(NO_ROBOTS_TOTAL, 18);
  assert.deepEqual([...NO_ROBOTS_LANES.keys()], [...LANES.keys()]);
  for (const [title, lane] of NO_ROBOTS_LANES) {
    if (title === "AI Crawler Access") assert.equal(lane.checks, 2, "robots.txt reachable + llms.txt");
    else assert.equal(lane.checks, LANES.get(title).checks, `${title} does not depend on robots.txt`);
  }
});

test("every published check count is qualified to match both runs", () => {
  const files = [
    ...walk(join(ROOT, "app"), [".ts", ".tsx", ".md", ".mdx"]),
    // lib/audit.ts is the engine source, not published copy.
    ...walk(join(ROOT, "lib"), [".ts"]).filter((f) => f !== join(ROOT, "lib", "audit.ts")),
    ...walk(join(ROOT, "public"), [".html", ".txt"]),
    join(ROOT, "README.md"),
  ];
  const claim = /(\bup to\s+)?\b(\d+)(?:-check\b|\s+(?:deterministic\s+)?checks\b)/gi;
  let found = 0;
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (const line of lines) {
      for (const m of line.matchAll(claim)) {
        found += 1;
        const where = `${relative(ROOT, file)} says "${m[0]}"`;
        const n = Number(m[2]);
        if (n === TOTAL) {
          assert.ok(m[1], `${where}; a site without robots.txt gets ${NO_ROBOTS_TOTAL}, so say "up to ${TOTAL}"`);
        } else {
          assert.equal(n, NO_ROBOTS_TOTAL, `${where}; the audit runs up to ${TOTAL} (${NO_ROBOTS_TOTAL} without robots.txt)`);
          assert.ok(!m[1], `${where}; ${NO_ROBOTS_TOTAL} is the exact no-robots.txt total, not a maximum`);
          assert.match(line, /robots\.txt/, `${where} without naming the missing robots.txt case`);
        }
      }
    }
  }
  assert.ok(found > 0, "expected at least one published check count");
});

test("the /docs/scoring lane table matches the engine", () => {
  const source = readFileSync(join(ROOT, "app", "docs", "scoring", "page.tsx"), "utf8");
  const rows = [...source.matchAll(/^\| ([^|]+?) \| (\d+) \| (\d+) \|$/gm)];
  assert.equal(rows.length, LANES.size, "one table row per lane");
  let sum = 0;
  for (const [, title, weight, checks] of rows) {
    const lane = LANES.get(title.replace(/\\/g, ""));
    assert.ok(lane, `table lane "${title}" is not an audit lane`);
    assert.equal(Number(weight), lane.weight, `${title} weight`);
    assert.equal(Number(checks), lane.checks, `${title} check count`);
    sum += Number(checks);
  }
  assert.equal(sum, TOTAL);
  const crawler = NO_ROBOTS_LANES.get("AI Crawler Access").checks;
  assert.ok(source.includes(`Without one, that lane runs ${toWord(crawler)} checks.`), "state the no-robots.txt crawler lane count");
  assert.ok(source.includes(`the report holds ${NO_ROBOTS_TOTAL} checks`), "state the no-robots.txt audit total");
});

test("the /articles lane cards match the engine", () => {
  const source = readFileSync(join(ROOT, "app", "articles", "page.tsx"), "utf8");
  const cards = [...source.matchAll(/lane: "([^"]+)",\s*weight: (\d+),\s*checks:\s*"(Up to )?(\w+) checks:/gi)];
  assert.equal(cards.length, LANES.size, "one card per lane");
  for (const [, title, weight, upTo, word] of cards) {
    const lane = LANES.get(title);
    assert.ok(lane, `card lane "${title}" is not an audit lane`);
    assert.equal(Number(weight), lane.weight, `${title} weight`);
    assert.equal(WORDS[word.toLowerCase()], lane.checks, `${title} says "${word} checks"`);
    const varies = NO_ROBOTS_LANES.get(title).checks !== lane.checks;
    assert.equal(Boolean(upTo), varies, varies ? `${title} depends on robots.txt; say "Up to"` : `${title} is a fixed count`);
  }
});

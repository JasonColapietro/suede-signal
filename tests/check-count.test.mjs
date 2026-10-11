// Guard: every published audit check count matches the engine.
//
// The number of checks is repeated on the homepage, /docs, /docs/scoring,
// /docs/api, /docs/faq, the article CTA, llms.txt and /ai-instructions. It
// drifted once: the copy said 26 while lib/audit.ts ran 23. This test runs the
// real engine offline (DNS and fetch are stubbed; nothing leaves the process)
// against a site that serves a robots.txt and an llms.txt, counts the checks
// in each lane, and compares the copy against that count:
//
//   1. Every "N checks", "N deterministic checks" or "N-check" claim in the
//      served source equals the engine's total.
//   2. The /docs/scoring lane table lists each lane's real weight and check
//      count, and its rows add up to the total.
//   3. The /articles lane cards ("Seven checks: ...") match each lane.

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

globalThis.fetch = async (input) => {
  const { pathname } = new URL(String(input));
  if (pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /\n", { status: 200 });
  if (pathname === "/llms.txt") return new Response("# Example\n\n> An example site.\n", { status: 200 });
  return new Response(PAGE, { status: 200, headers: { "content-type": "text/html" } });
};

const { runAudit } = await import(join(ROOT, "lib", "audit.ts"));
const report = await runAudit("https://example.com/");
const LANES = new Map(report.lanes.map((l) => [l.title, { weight: l.weight, checks: l.checks.length }]));
const TOTAL = report.lanes.reduce((sum, l) => sum + l.checks.length, 0);

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
  assert.equal(report.lanes.length, 5);
  for (const [title, lane] of LANES) assert.ok(lane.checks > 0, `${title} has no checks`);
});

test("every published check count equals the engine's total", () => {
  const files = [
    ...walk(join(ROOT, "app"), [".ts", ".tsx", ".md", ".mdx"]),
    // lib/audit.ts is the engine source, not published copy.
    ...walk(join(ROOT, "lib"), [".ts"]).filter((f) => f !== join(ROOT, "lib", "audit.ts")),
    ...walk(join(ROOT, "public"), [".html", ".txt"]),
    join(ROOT, "README.md"),
  ];
  const claim = /\b(\d+)(?:-check\b|\s+(?:deterministic\s+)?checks\b)/gi;
  let found = 0;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(claim)) {
      found += 1;
      assert.equal(Number(m[1]), TOTAL, `${relative(ROOT, file)} says "${m[0]}"; the audit runs ${TOTAL}`);
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
});

test("the /articles lane cards match the engine", () => {
  const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const source = readFileSync(join(ROOT, "app", "articles", "page.tsx"), "utf8");
  const cards = [...source.matchAll(/lane: "([^"]+)",\s*weight: (\d+),\s*checks:\s*"(\w+) checks:/g)];
  assert.equal(cards.length, LANES.size, "one card per lane");
  for (const [, title, weight, word] of cards) {
    const lane = LANES.get(title);
    assert.ok(lane, `card lane "${title}" is not an audit lane`);
    assert.equal(Number(weight), lane.weight, `${title} weight`);
    assert.equal(WORDS[word.toLowerCase()], lane.checks, `${title} says "${word} checks"`);
  }
});

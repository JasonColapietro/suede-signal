// Guard: the sitewide "Related Suede tools" links.
//
// Every entry must be a followed https link to a live, indexable Suede host.
// Three hosts are excluded by the 2026-10-11 fleet backlink audit:
// ip.suedeai.ai (noindex demo; the IP Registry is registry.suedeai.ai),
// producer.suedeai.ai (answers 401) and webmcp.suedeai.ai.
// llms.txt carries the same list, so the two must not drift.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { RELATED_SUEDE_TOOLS } = await import(join(ROOT, "lib", "relatedTools.ts"));

const EXCLUDED_HOSTS = new Set(["ip.suedeai.ai", "producer.suedeai.ai", "webmcp.suedeai.ai"]);

test("related tools are https links to allowed Suede hosts", () => {
  assert.ok(RELATED_SUEDE_TOOLS.length > 0);
  const hosts = new Set();
  for (const tool of RELATED_SUEDE_TOOLS) {
    const url = new URL(tool.href);
    assert.equal(url.protocol, "https:", `${tool.href} must be https`);
    assert.ok(url.hostname.endsWith(".suedeai.ai"), `${tool.href} is not a Suede host`);
    assert.ok(!EXCLUDED_HOSTS.has(url.hostname), `${tool.href} is an excluded host`);
    assert.ok(url.hostname !== "signal.suedeai.ai", "do not list this site as a related tool");
    assert.ok(!url.search, `${tool.href} must not carry query or tracking parameters`);
    assert.ok(!hosts.has(url.hostname), `${url.hostname} is listed twice`);
    hosts.add(url.hostname);
    assert.ok(tool.name.trim() && tool.description.trim(), `${tool.href} needs a name and description`);
  }
});

test("the sitewide footer renders the related tools as followed links", () => {
  const footer = readFileSync(join(ROOT, "app", "components", "SiteFooter.tsx"), "utf8");
  assert.match(footer, /RELATED_SUEDE_TOOLS\.map/);
  assert.doesNotMatch(footer, /nofollow/);
});

test("llms.txt lists every related tool", () => {
  const llms = readFileSync(join(ROOT, "public", "llms.txt"), "utf8");
  for (const tool of RELATED_SUEDE_TOOLS) {
    assert.ok(llms.includes(`[${tool.name}](${tool.href})`), `llms.txt is missing ${tool.name}`);
  }
});

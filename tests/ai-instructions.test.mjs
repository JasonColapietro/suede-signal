import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// /ai-instructions is a static page served by a vercel.json rewrite, so no
// framework metadata reaches it. This test holds it to the same share and
// schema standard as the rest of the site.
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const html = read("public/ai-instructions.html");
const meta = (key) => {
  const re = new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`);
  return html.match(re)?.[1];
};
const decode = (s) => s.replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&quot;", '"');

test("ai-instructions carries complete Open Graph and Twitter metadata", () => {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical?.endsWith("/ai-instructions"));
  assert.equal(meta("og:url"), canonical);
  assert.match(meta("og:image") ?? "", /^https:\/\//);
  assert.equal(meta("twitter:card"), "summary_large_image");
  assert.equal(meta("twitter:title"), meta("og:title"));
  assert.equal(meta("twitter:description"), meta("og:description"));
  assert.equal(meta("twitter:image"), meta("og:image"));
  assert.ok((meta("description") ?? "").length >= 110, "description should say what the page offers");
});

test("ai-instructions JSON-LD parses and describes the visible page", () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  assert.equal(blocks.length, 1);
  const graph = JSON.parse(blocks[0][1])["@graph"];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
  const page = graph.find((node) => node["@type"] === "WebPage");
  assert.equal(page["@id"], `${canonical}#webpage`);
  assert.equal(page.url, canonical);
  assert.equal(page.name, decode(html.match(/<title>([^<]+)<\/title>/)[1]));
  assert.equal(page.description, decode(meta("description")));
  assert.equal(page.primaryImageOfPage.url, meta("og:image"));
  const ids = new Set(graph.map((node) => node["@id"]));
  assert.ok(ids.has(page.isPartOf["@id"]) && ids.has(page.breadcrumb["@id"]), "references resolve in the graph");
  // The footer date and the schema date are the same fact.
  const updated = html.match(/Updated (\w+ \d{1,2}, \d{4})\./)?.[1];
  assert.ok(updated, "footer states the update date");
  assert.equal(new Date(`${updated} UTC`).toISOString().slice(0, 10), page.dateModified);
  assert.ok(read("public/ai-instructions-sitemap.xml").includes(`<lastmod>${page.dateModified}</lastmod>`));
});

test("ai-instructions copy states facts without hedging", () => {
  assert.doesNotMatch(html, /not guaranteed|does not guarantee|is not evidence|is not proof/i);
});

test("the .html twin 308s to the clean URL", () => {
  const config = JSON.parse(read("vercel.json"));
  assert.ok(
    config.redirects?.some(
      (r) => r.source === "/ai-instructions.html" && r.destination === "/ai-instructions" && r.permanent === true,
    ),
  );
  assert.ok(config.rewrites?.some((r) => r.source === "/ai-instructions"));
});

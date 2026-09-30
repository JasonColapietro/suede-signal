// Guard: every indexable page emits <meta name="keywords">.
//
// Indexable pages are the sitemap routes (static list + one per article).
// Each must have a keyword map entry in lib/keywords.ts, and every page or
// layout that exports metadata must set `keywords` from that map (a child's
// keywords replace the parent's, so a page without its own list would fall
// back to the homepage terms). API routes and route handlers are skipped.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { INDEXABLE_ROUTES, BRAND_KEYWORDS, keywordsFor } = await import(
  join(ROOT, "lib", "keywords.ts")
);
const { articles } = await import(join(ROOT, "lib", "articles.ts"));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (full === join(ROOT, "app", "api")) continue;
      walk(full, out);
    } else if (entry === "page.tsx" || entry === "layout.tsx") {
      out.push(full);
    }
  }
  return out;
}

function sitemapRoutes() {
  const src = readFileSync(join(ROOT, "app", "sitemap.ts"), "utf8");
  const list = src.match(/const staticRoutes = \[([\s\S]*?)\]/);
  assert.ok(list, "could not find staticRoutes in app/sitemap.ts");
  const statics = [...list[1].matchAll(/"([^"]*)"/g)].map((m) => m[1] || "/");
  return [...statics, ...articles.map((a) => `/articles/${a.slug}`)];
}

test("every sitemap route has a keyword list with page and brand terms", () => {
  for (const route of sitemapRoutes()) {
    assert.ok(INDEXABLE_ROUTES.includes(route), `no keywords mapped for ${route}`);
    const kw = keywordsFor(route);
    assert.ok(kw.length > BRAND_KEYWORDS.length, `${route} has only brand keywords`);
    const lower = kw.map((k) => k.toLowerCase());
    for (const brand of BRAND_KEYWORDS) {
      assert.ok(lower.includes(brand.toLowerCase()), `${route} missing brand term ${brand}`);
    }
    assert.equal(new Set(lower).size, lower.length, `${route} has duplicate keywords`);
  }
});

test("keyword map has no stale routes outside the sitemap", () => {
  const routes = new Set(sitemapRoutes());
  for (const route of INDEXABLE_ROUTES) {
    assert.ok(routes.has(route), `${route} is mapped but not in the sitemap`);
  }
});

test("every page or layout that exports metadata sets keywords", () => {
  const files = walk(join(ROOT, "app"));
  let checked = 0;
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    if (!/export (const metadata|async function generateMetadata)/.test(src)) continue;
    checked++;
    assert.match(src, /keywords:\s*keywordsFor\(/, `${relative(ROOT, file)} metadata lacks keywords`);
  }
  assert.ok(checked >= 9, `expected at least 9 metadata files, found ${checked}`);
});

test("root layout sets default keywords", () => {
  const layout = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");
  assert.match(layout, /keywords:\s*keywordsFor\("\/"\)/);
});

test("Article JSON-LD carries keywords", () => {
  const src = readFileSync(join(ROOT, "app", "articles", "[slug]", "page.tsx"), "utf8");
  assert.match(src, /"@type": "Article"[\s\S]*?keywords:\s*keywordsFor\(/);
});

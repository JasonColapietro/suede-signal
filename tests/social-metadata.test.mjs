import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageSocialMetadata, OG_IMAGE, SITE_URL } from "../lib/site.ts";

const routes = ["/docs", "/docs/scoring", "/docs/fixes", "/docs/mention-watch", "/docs/api", "/docs/faq", "/articles"];

test("documentation and article-index previews identify the shared page", () => {
  for (const route of routes) {
    const source = readFileSync(new URL(`../app${route}/page.tsx`, import.meta.url), "utf8");
    const title = source.match(/const title = "([^"]+)";/)?.[1];
    const description = source.match(/const description =\s*"([^"]+)";/)?.[1];
    assert.ok(title && description, `${route} needs its own preview copy`);
    assert.ok(source.includes(`...pageSocialMetadata("${route}", title, description)`), `${route} must override inherited homepage previews`);
    const { openGraph, twitter } = pageSocialMetadata(route, title, description);
    assert.equal(openGraph.url, new URL(route, SITE_URL).href);
    assert.equal(openGraph.title, title);
    assert.equal(openGraph.description, description);
    assert.equal(openGraph.images[0].url, OG_IMAGE);
    assert.equal(twitter.title, title);
    assert.equal(twitter.description, description);
    assert.deepEqual(twitter.images, [OG_IMAGE]);
  }
});

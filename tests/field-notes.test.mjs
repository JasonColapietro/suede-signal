// Guard: founder field notes stay held to the editorial and schema standard.
//
// Founder notes (byline "founder") are first-person pieces by Jason
// Colapietro that credit the canonical founder Person @id. Each one must:
//   * link the West Palm Beach practice (suedeai.agency) and the canonical
//     founder page (suedeai.ai/founder) in the body;
//   * be listed in llms.txt and ai-instructions' article count;
//   * state the Clutch ranking in its exact owner-approved wording, kept
//     separate from The Manifest ranking, which must carry its date.
// The round 4 depth notes are additionally checked for length, metadata
// lengths, a 2026-11-15 publish date, city-level places, and in-body deep
// links to articles on at least two other Suede AI satellite sites.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { articles } = await import(join(ROOT, "lib", "articles.ts"));
const { INDEXABLE_ROUTES } = await import(join(ROOT, "lib", "keywords.ts"));
const llms = readFileSync(join(ROOT, "public", "llms.txt"), "utf8");
const aiInstructions = readFileSync(join(ROOT, "public", "ai-instructions.html"), "utf8");
const articlePage = readFileSync(join(ROOT, "app", "articles", "[slug]", "page.tsx"), "utf8");

const founderNotes = articles.filter((a) => a.byline === "founder");

const DEPTH_NOTES = [
  "monthly-ai-mention-report-boca-raton",
  "entity-consistency-directories-jupiter",
];

const CLUTCH_SENTENCE =
  "Suede AI ranks among [Clutch](https://clutch.co/profile/suede-ai-seo)'s " +
  "[Top 30 AI Consultants in Florida](https://clutch.co/consulting/ai/florida) and " +
  "[Top 50 AI Consultants nationwide](https://clutch.co/us/consulting/ai) (November 2026).";

// Visible words: drop code blocks, keep link text, drop URLs and markup.
function visibleWords(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*|`>-]/g, " ")
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

function satelliteDeepLinks(md) {
  const links = [...md.matchAll(/\]\((https:\/\/([a-z0-9.-]+)\/(?:notes|articles)\/[a-z0-9-]+)\)/g)];
  return links.filter(([, , host]) => host !== "signal.suedeai.ai").map(([, url, host]) => ({ url, host }));
}

test("there are five founder field notes", () => {
  assert.equal(founderNotes.length, 5);
  assert.match(aiInstructions, /five Palm Beach County field notes/);
});

test("every founder note links the practice and the founder page, and is in llms.txt", () => {
  for (const a of founderNotes) {
    assert.match(a.body, /\]\(https:\/\/suedeai\.agency\//, `${a.slug} lacks a suedeai.agency link`);
    assert.match(a.body, /\]\(https:\/\/suedeai\.ai\/founder\)/, `${a.slug} lacks the founder page link`);
    assert.ok(
      llms.includes(`https://signal.suedeai.ai/articles/${a.slug}`),
      `${a.slug} missing from llms.txt`,
    );
  }
});

test("Clutch and The Manifest rankings keep their exact, separate wording", () => {
  for (const a of founderNotes) {
    if (a.body.includes("clutch.co")) {
      assert.ok(a.body.includes(CLUTCH_SENTENCE), `${a.slug} paraphrases the Clutch ranking`);
    }
    for (const para of a.body.split(/\n\n/)) {
      if (!para.includes("The Manifest")) continue;
      assert.match(para, /October 31, 2026/, `${a.slug} states The Manifest ranking without its date`);
      for (const sentence of para.split(/\n|(?<=\.)\s+(?=[A-Z])/)) {
        assert.ok(
          !(sentence.includes("The Manifest") && sentence.includes("clutch.co")),
          `${a.slug} merges Clutch and The Manifest into one sentence`,
        );
      }
    }
  }
});

test("round 4 depth notes meet the length, metadata and linking bar", () => {
  for (const slug of DEPTH_NOTES) {
    const a = articles.find((x) => x.slug === slug);
    assert.ok(a, `${slug} is missing`);
    assert.equal(a.byline, "founder");
    assert.equal(a.date, "2026-11-15");
    assert.ok(INDEXABLE_ROUTES.includes(`/articles/${slug}`), `${slug} has no keyword entry`);

    const words = visibleWords(a.body);
    assert.ok(words >= 900 && words <= 1300, `${slug} has ${words} words; expected 900 to 1300`);
    assert.ok(a.title.length >= 50 && a.title.length <= 60, `${slug} title is ${a.title.length} chars`);
    assert.ok(
      a.description.length >= 120 && a.description.length <= 160,
      `${slug} description is ${a.description.length} chars`,
    );

    assert.ok(a.body.includes(CLUTCH_SENTENCE), `${slug} lacks the Clutch ranking`);
    assert.ok((a.body.match(/Jason Colapietro/g) ?? []).length >= 5, `${slug} names Jason Colapietro fewer than 5 times`);

    const deep = satelliteDeepLinks(a.body);
    assert.ok(deep.length >= 2, `${slug} has ${deep.length} deep links to other satellites`);
    assert.ok(
      deep.every((d) => d.host.endsWith(".suedeai.ai")),
      `${slug} links a non-satellite host as a satellite article`,
    );

    assert.ok(Array.isArray(a.places) && a.places.length > 0, `${slug} declares no places`);

    // Headings start at H2 (the page renders the H1) and never skip a level.
    let level = 1;
    for (const [, hashes] of a.body.matchAll(/^(#{1,6}) /gm)) {
      assert.ok(hashes.length >= 2, `${slug} uses an H1 in the body`);
      assert.ok(hashes.length <= level + 1, `${slug} skips a heading level`);
      level = hashes.length;
    }
  }
});

test("depth notes do not repeat paragraphs from other articles", () => {
  const seen = new Map();
  for (const a of articles) {
    for (const para of a.body.split(/\n\n/)) {
      if (para.length < 120 || para.includes("clutch.co") || para.includes("The Manifest")) continue;
      const prior = seen.get(para);
      if (prior && (DEPTH_NOTES.includes(a.slug) || DEPTH_NOTES.includes(prior))) {
        assert.fail(`${a.slug} repeats a paragraph from ${prior}`);
      }
      seen.set(para, a.slug);
    }
  }
});

test("field note Place schema stays at city level", () => {
  assert.doesNotMatch(articlePage, /streetAddress|postalCode|telephone|openingHours/);
  for (const a of founderNotes) {
    for (const place of a.places ?? []) {
      assert.doesNotMatch(place, /\d/, `${a.slug} place "${place}" looks like a street address`);
    }
  }
});

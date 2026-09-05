// Guard tests for the Suede Signal marketing surface.
//
// Four claims are asserted, per file, on the served source:
//
//   1. NO OUTCOME GUARANTEES. The site must not promise the reader an outcome
//      it cannot deliver — being recommended, ranked, or cited by an AI engine.
//      Suede Signal runs deterministic checks with "No LLM calls, no sampling"
//      (see /docs/scoring) and its own FAQ says to "be suspicious of any tool
//      that promises that". So the copy must describe what the tool CHECKS, not
//      a RESULT it produces.
//
//   2. CANONICAL ORG NAME. The organization is "Suede Labs AI" (estate canon),
//      never the bare "Suede Labs" — in JSON-LD, bylines, or prose.
//
//   3. NO EM DASHES. Estate copy voice bans the em dash in public copy. Use a
//      colon, a comma, a semicolon, or two sentences. The one allowance is a
//      lone em dash used as a numeric placeholder glyph (the gauge readout
//      before a score exists), which is a UI symbol rather than prose, so the
//      whole string literal "—" is exempt and nothing else is.
//
//   4. NO JUSTIFYING BECAUSE-TAIL. Estate copy voice bans a sentence that
//      starts with "Because" to justify the sentence before it. State the
//      fact directly instead. Mid-sentence "because" is ordinary English and
//      is left alone.
//
// Discipline (see fix brief):
//   * Assert on the CLAIM/defect class, not remembered strings.
//   * Scan PER FILE. Never concatenate files (joining invents adjacency).
//   * Strip JSX/HTML tags first, because Next.js splits rendered text across
//     tags (`Become the brand<br/><span>AI recommends</span>`), so an
//     outcome-promise is NOT a contiguous string in the .tsx source. Stripping
//     tags rejoins the visible words the way the browser renders them.
//   * The patterns target AFFIRMATIVE promises only, so the product's honest
//     disclaimers ("not a guarantee of citation", "nobody can guarantee",
//     "Does a high score guarantee ... ? No") are correctly left alone.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      walk(full, exts, out);
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

// Human-visible text as the browser renders it: drop JSX/HTML tags (which is
// what carries className/attributes and the tag boundaries that split copy),
// keep the text and plain JS string literals (page metadata lives in those),
// collapse whitespace, lowercase.
function visibleText(src) {
  return src
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Affirmative outcome-promises applied to the reader's brand. Each is a RESULT
// the tool cannot deliver (it never queries an engine). Negations and questions
// ("not a guarantee of citation", "guarantee AI engines will cite me? No") do
// not match, by construction.
const OUTCOME_PROMISE_PATTERNS = [
  { name: "become-the-brand-ai-recommends", re: /become the brand[^.]{0,40}ai recommends/ },
  { name: "how-ai-ranks-your-brand", re: /(?:how )?ai ranks your brand/ },
  { name: "who-ai-recommends", re: /who ai (?:actually )?recommends/ },
  { name: "predictive-what-theyll-cite", re: /what (?:they'?ll|they will|ai will) cite/ },
  {
    name: "affirmative-outcome-guarantee",
    re: /guarantee(?:s|d)? (?:you\b|your (?:brand|site|page|spot|ranking)|to (?:be|get) (?:cited|ranked|recommended))/,
  },
];

const marketingFiles = walk(join(ROOT, "app"), [".tsx", ".ts"]);
const orgFiles = [...walk(join(ROOT, "app"), [".tsx", ".ts"]), ...walk(join(ROOT, "lib"), [".ts"])];

test("marketing surface exists to scan", () => {
  assert.ok(marketingFiles.length > 0, "expected app/*.tsx source to scan");
});

test("no outcome-promise phrasing on any served page (per file, tag-stripped)", () => {
  for (const file of marketingFiles) {
    const text = visibleText(readFileSync(file, "utf8"));
    for (const { name, re } of OUTCOME_PROMISE_PATTERNS) {
      assert.ok(
        !re.test(text),
        `${relative(ROOT, file)} contains outcome-promise [${name}] matching ${re}`,
      );
    }
  }
});

test('organization is named "Suede Labs AI", never bare "Suede Labs"', () => {
  for (const file of orgFiles) {
    const src = readFileSync(file, "utf8");
    const bare = src.match(/Suede Labs(?! AI)/g);
    assert.ok(
      bare === null,
      `${relative(ROOT, file)} uses bare "Suede Labs" (${bare?.length}x); canonical name is "Suede Labs AI"`,
    );
  }
});

test("root JSON-LD Organization declares the canonical name", () => {
  const layout = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");
  assert.match(layout, /"@id":\s*"https:\/\/suedeai\.ai\/#organization"/);
  assert.match(layout, /name:\s*"Suede Labs AI"/);
});

// A lone em dash as an entire string literal is the gauge's "no score yet"
// placeholder glyph, not prose. Dropping those occurrences leaves every em
// dash that sits inside a sentence, which is the thing the rule bans.
const GLYPH_PLACEHOLDER = /"—"/g;

test("no em dash in served copy (per file)", () => {
  for (const file of orgFiles) {
    const src = readFileSync(file, "utf8").replace(GLYPH_PLACEHOLDER, '""');
    const hits = src.match(/—/g);
    assert.ok(
      hits === null,
      `${relative(ROOT, file)} uses an em dash (${hits?.length}x); use a colon, comma, semicolon, or two sentences`,
    );
  }
});

test("no justifying because-tail in served copy (per file, tag-stripped)", () => {
  // Sentence-initial "Because ...", i.e. a clause that exists to justify the
  // sentence before it. Escaped newlines in committed markdown bodies are
  // sentence boundaries too, so they are normalized to whitespace first.
  const BECAUSE_TAIL = /(?:^|[.!?]["')\]]?\s+)because\b/;
  for (const file of orgFiles) {
    const text = visibleText(readFileSync(file, "utf8").replace(/\\n/g, " "));
    assert.ok(
      !BECAUSE_TAIL.test(text),
      `${relative(ROOT, file)} starts a sentence with "Because"; state the fact directly instead`,
    );
  }
});

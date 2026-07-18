import type { Metadata } from "next";
import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Scoring & lanes — Suede Signal Docs",
  description:
    "The full methodology: five weighted lanes, all 26 deterministic checks, how lane scores roll up to the 0–100 score, and the A–F grade bands.",
  alternates: { canonical: "/docs/scoring" },
};

const BODY = `
Every audit runs the same 26 deterministic checks against three fetches: the page you submit, the origin's \`robots.txt\`, and the origin's \`llms.txt\`. No LLM calls, no sampling — the same page state always scores the same.

## How is the score computed?

Each lane's score is simply the percentage of its checks that pass. The overall score is the weighted average of the five lanes:

| Lane | Weight | Checks |
|---|---|---|
| AI Crawler Access | 25 | 7 |
| Citability | 25 | 5 |
| Metadata & Sharing | 20 | 5 |
| Structured Data | 20 | 3 |
| Trust Signals | 10 | 3 |

Worked example: if you score 100 on everything except Structured Data at 33 (one of three checks passing), the overall is (25·100 + 25·100 + 20·100 + 20·33 + 10·100) / 100 ≈ **87 → grade B**.

## What are the grade bands?

- **A** — 90 to 100
- **B** — 80 to 89
- **C** — 65 to 79
- **D** — 50 to 64
- **F** — below 50

## Lane 1 — AI Crawler Access (weight 25)

Whether AI engines are allowed to read you at all. If \`robots.txt\` is missing entirely, all crawlers are allowed by default and the lane treats that as open access.

- **GPTBot allowed** — OpenAI's crawler (training and, increasingly, retrieval for answers).
- **ClaudeBot allowed** — Anthropic's crawler.
- **Claude-Web allowed** — Anthropic's on-demand fetcher.
- **PerplexityBot allowed** — Perplexity's index crawler.
- **Google-Extended allowed** — controls Gemini training use of your content.
- **CCBot allowed** — Common Crawl, an upstream corpus for many models.
- **llms.txt present** — a curated markdown map of your site for AI consumers, served at \`/llms.txt\`. The check requires a non-empty file that isn't an HTML error page.

A bot counts as blocked when a \`User-agent\` section naming it contains \`Disallow: /\` (a later \`Allow: /\` in the same section unblocks it). Note the parser matches sections that name the bot explicitly — a blanket \`User-agent: *\` block is a broader problem an engine-specific check doesn't flag.

## Lane 2 — Metadata & Sharing (weight 20)

What engines and link previews see before reading a word of your content.

- **Title tag** — present and 15–70 characters.
- **Meta description** — present and 50–160 characters. Answer engines frequently lift these verbatim.
- **Canonical URL** — a \`<link rel="canonical">\` so citations consolidate to one URL.
- **Open Graph tags** — both \`og:title\` and \`og:image\` present.
- **HTTPS** — the final URL after redirects resolves over HTTPS.

## Lane 3 — Structured Data (weight 20)

JSON-LD is how engines verify who you are rather than guessing from prose.

- **JSON-LD structured data** — at least one valid \`application/ld+json\` block declaring a type.
- **Entity schema** — an \`Organization\`, \`Person\`, or \`LocalBusiness\` node.
- **FAQ schema** — a \`FAQPage\` node; question-answer pairs are the most directly extractable format for AI answers.

## Lane 4 — Citability (weight 25)

Whether there's a clean passage for an engine to quote.

- **Single clear H1** — exactly one \`<h1>\` on the page.
- **Section structure** — at least two \`<h2>\` headings; passages need boundaries.
- **Content depth** — at least 300 words of visible text after stripping markup.
- **Lists or tables** — at least one \`<ul>\`, \`<ol>\`, or table-like structure.
- **Question-form headings** — at least one H2/H3 phrased as a question (contains "?", or starts with how/what/why/when/which).

## Lane 5 — Trust Signals (weight 10)

Cheap-to-fake signals are weighted low, but their absence still costs citations.

- **About page linked** — a link whose href contains \`/about\`.
- **Contact method visible** — a \`/contact\` link or a \`mailto:\` address.
- **Dates / freshness signals** — \`<time>\` elements, \`datetime\` attributes, or \`datePublished\`/\`dateModified\` markup.

## How are the "fix these first" items ranked?

Every failed check carries a suggested fix. Fixes are sorted by their lane's weight (heaviest lanes first) and the top five become your priority list. Fixing in that order moves the score fastest.

## Limits worth knowing

- The audit inspects **the URL you submit**, not your whole site. Run it on your homepage and your key landing pages separately.
- Fetches follow up to 5 redirects, time out at 10 seconds per resource, and cap responses at 4 MB.
- Server-side rendering matters: checks read the HTML your server returns. Content that only appears after client-side JavaScript runs is invisible to the auditor — and to most crawlers.
`;

export default function ScoringPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Scoring &amp; lanes</h1>
      <p className="mt-3 text-muted">
        The full methodology behind the grade — every check, every weight, no black box.
      </p>
      <div
        className="prose-suede mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(BODY) }}
      />
      <p className="mt-10 rounded-2xl border border-accent/30 bg-accent/[0.06] px-5 py-4 text-sm">
        Failing a check? Every fix has a copy-pasteable example in the{" "}
        <Link href="/docs/fixes" className="font-semibold text-accent-strong underline underline-offset-2">
          Fix guide
        </Link>
        .
      </p>
    </article>
  );
}

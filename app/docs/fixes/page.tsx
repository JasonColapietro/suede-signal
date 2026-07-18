import type { Metadata } from "next";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Fix guide — Suede Signal Docs",
  description:
    "Copy-pasteable fixes for every Suede Signal check: robots.txt rules for AI crawlers, llms.txt templates, JSON-LD schema, metadata, and citable structure.",
  alternates: { canonical: "/docs/fixes" },
};

const BODY = `
Every check in the audit has a concrete fix. This page collects all of them with copy-pasteable examples, ordered by lane weight — start at the top and the score moves fastest.

## How do I unblock AI crawlers? (lane weight 25)

Open \`robots.txt\` at your site root and look for \`Disallow: /\` under a \`User-agent\` naming an AI bot. To allow the engines the audit checks:

\`\`\`text
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /
\`\`\`

If you have no robots.txt at all, that's fine — everything is allowed by default. Only add rules when you want to *restrict* something. And remember robots.txt is a request, not enforcement: it keeps honest crawlers out, nothing more.

**llms.txt** — serve a markdown file at \`/llms.txt\` that maps your key pages:

\`\`\`markdown
# Your Company

> One-sentence description of what you do and for whom.

## Product

- [Pricing](https://example.com/pricing): plans and what each includes
- [Docs](https://example.com/docs): setup and API reference

## Company

- [About](https://example.com/about): team, history, contact
\`\`\`

Keep it short and curated — it's a reading guide for machines, not a sitemap dump.

## How do I make a page citable? (lane weight 25)

- **Exactly one H1.** State the page's answer in plain language. Multiple H1s blur what the page is about; zero leaves engines guessing.
- **At least two H2 sections.** Engines cite passages, and passages need boundaries. Each H2 should mark a self-contained chunk.
- **300+ words of real text.** Thin pages don't get cited. This is visible text — not markup, not alt attributes.
- **Use lists.** Bulleted steps and comparison tables are the formats AI answers extract most often.
- **Ask the question, then answer it.** At least one heading phrased the way users ask ("How much does X cost?") followed by a direct 1–2 sentence answer before any elaboration.

One structural warning: the auditor (like most crawlers) reads the HTML your server returns. If your content only renders client-side, it doesn't exist for this lane. Server-render anything you want quoted.

## How do I fix metadata? (lane weight 20)

\`\`\`html
<title>Plain-language product name and who it's for (15–70 chars)</title>
<meta name="description" content="A 50–160 character answer to the query this page targets. Engines lift these verbatim, so write it as the answer." />
<link rel="canonical" href="https://example.com/this-page" />
<meta property="og:title" content="Same title, social-ready" />
<meta property="og:image" content="https://example.com/og.png" />
\`\`\`

And serve everything over HTTPS — engines deprioritize insecure sources, and some fetchers refuse them outright.

## What structured data do I need? (lane weight 20)

Minimum viable JSON-LD — an entity block so engines can verify who you are:

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Your Company",
      "url": "https://example.com",
      "logo": "https://example.com/logo.png",
      "sameAs": [
        "https://github.com/yourcompany",
        "https://www.linkedin.com/company/yourcompany"
      ]
    },
    { "@type": "WebSite", "name": "Your Company", "url": "https://example.com" }
  ]
}
</script>
\`\`\`

Then add FAQ schema for your top 3–5 real questions — the highest-yield format for AI answers:

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How does pricing work?",
    "acceptedAnswer": { "@type": "Answer", "text": "Direct, complete answer here." }
  }]
}
</script>
\`\`\`

Only mark up content that's visibly on the page. Schema describing things the page doesn't say is the fastest way to get structured data ignored.

## How do I fix trust signals? (lane weight 10)

- Link an **About page** (\`/about\`) from the audited page — entity verification is a core trust signal.
- Show a **contact route**: a \`/contact\` link or a visible \`mailto:\` address.
- Add **freshness markup**: a \`<time datetime="2026-07-18">\` on visible dates, or \`datePublished\`/\`dateModified\` in your JSON-LD.

## In what order should I fix things?

The audit already ranks your top five by lane weight, but the general order is: unblock crawlers (nothing else matters if engines can't read you) → make the page citable → metadata → schema → trust signals. Re-run the audit after each change; scans from the same browser keep a local history so you can watch the score move.
`;

export default function FixesPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Fix guide</h1>
      <p className="mt-3 text-muted">
        Copy-pasteable fixes for every check in the audit, heaviest lanes first.
      </p>
      <div
        className="prose-suede mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(BODY) }}
      />
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Documentation — Suede Signal",
  description:
    "How Suede Signal works: a free, instant AI-visibility audit with 26 deterministic checks across five weighted lanes. No signup, nothing stored.",
  alternates: { canonical: "/docs" },
};

const BODY = `
Suede Signal answers one question: **when someone asks ChatGPT, Claude, Perplexity, or Gemini a question your site should be the answer to, can the engine actually find, read, and quote you?**

Paste a URL on the [home page](/) and you get a 0–100 score, an A–F grade, five lane scores, every individual check with a pass/fail and a suggested fix, and a ranked "fix these first" list. The whole audit runs in a few seconds.

## What the audit is (and isn't)

- **Deterministic.** Every check is a concrete inspection of your live page, your \`robots.txt\`, and your \`llms.txt\`. No LLM is involved in scoring, so the same page state always produces the same score.
- **Read-only.** The auditor fetches public pages the way a crawler would. It never logs in, submits forms, or mutates anything.
- **Stateless.** Nothing is stored server-side. Your scan history lives in your own browser (localStorage) so you can track score changes across visits from the same device.
- **Free, no signup.** Run it as often as you like, on any public site, including competitors.

It is **not** a rank tracker, a guarantee of citation, or a crawl of your whole site — it audits the specific URL you give it. Engines change their behavior; the audit checks the durable fundamentals that make citation *possible*.

## How a scan works

1. You submit a URL (up to three: yours plus two competitors).
2. The server fetches the page, \`robots.txt\`, and \`llms.txt\` from the site's origin, following up to 5 redirects, with a 4&nbsp;MB response cap.
3. 26 checks run across five weighted lanes: AI Crawler Access (25), Metadata & Sharing (20), Structured Data (20), Citability (25), and Trust Signals (10).
4. Lane scores are the percentage of passed checks in the lane; the overall score is the weight-adjusted average, mapped to a grade.
5. Failed checks with fixes are ranked by lane weight into the "fix these first" list.

The full check list, weights, and grade bands are documented in [Scoring & lanes](/docs/scoring), and every fix is explained with copy-pasteable examples in the [Fix guide](/docs/fixes).

## What else is on the site?

- **Competitor comparison** — add up to two competitor URLs to the scan and you get a lane-by-lane head-to-head table showing exactly where you lead and where you're losing the answer.
- **[Mention Watch](/docs/mention-watch)** — scan Reddit and Hacker News for live threads about your brand or topic, ranked by impact, with a disclosed reply draft one click away.
- **[API](/docs/api)** — both features are plain HTTP endpoints you can call yourself.
- **[Articles](/articles)** — practitioner guides on llms.txt, AI crawler policy, structured data, citable writing, and where AI engines learn about brands.

## Who builds this?

Suede Signal is a free tool by [Suede Labs](https://suedeai.ai), the studio behind [Suede Agent Studio](https://agents.suedeai.ai) — a visual builder that turns workflows like the Mention Watch loop into scheduled agents with human approval gates.
`;

export default function DocsOverview() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Documentation</h1>
      <p className="mt-3 text-muted">
        Everything Suede Signal checks, how the score is computed, and how to use the API.
      </p>
      <div
        className="prose-suede mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(BODY) }}
      />
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {[
          { href: "/docs/scoring", title: "Scoring & lanes", desc: "All 26 checks, weights, and grade bands." },
          { href: "/docs/fixes", title: "Fix guide", desc: "Copy-pasteable fixes for every failing check." },
          { href: "/docs/mention-watch", title: "Mention Watch", desc: "Find and join the threads AI learns from." },
          { href: "/docs/api", title: "API reference", desc: "POST /api/audit and GET /api/mentions." },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent"
          >
            <p className="font-semibold text-foreground">{c.title}</p>
            <p className="mt-1 text-sm text-muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}

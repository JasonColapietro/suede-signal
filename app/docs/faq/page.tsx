import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Suede Signal Docs",
  description:
    "Answers about the Suede Signal AI-visibility audit: what it checks, how scoring works, privacy, competitor comparison, and Mention Watch.",
  alternates: { canonical: "/docs/faq" },
};

const FAQS = [
  {
    q: "What does Suede Signal actually check?",
    a: "26 deterministic checks across five lanes: whether AI crawlers (GPTBot, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, CCBot) can read your site, whether llms.txt exists, metadata and Open Graph quality, JSON-LD structured data, passage-level citability, and trust signals like about pages and freshness markup.",
  },
  {
    q: "Why does AI visibility matter?",
    a: "A growing share of product discovery now starts in ChatGPT, Claude, Perplexity, and Google AI Overviews instead of a search results page. If the engines can't read your site, or can't find a citable passage on it, you don't exist in the answer.",
  },
  {
    q: "Is my data stored?",
    a: "No. Every audit runs read-only against your public pages at request time and nothing is saved server-side. Your scan history lives only in your own browser's localStorage.",
  },
  {
    q: "How is this different from an SEO audit?",
    a: "Classic SEO optimizes for ranked links. AI visibility optimizes for being quoted in an answer: crawler permissions, entity schema, question-shaped headings, and direct extractable passages. Some checks overlap; the intent doesn't.",
  },
  {
    q: "Does a high score guarantee AI engines will cite me?",
    a: "No, and be suspicious of any tool that promises that. The audit checks the durable fundamentals that make citation possible: readability by crawlers, verifiable identity, and extractable passages. Engines weigh many other signals, including third-party mentions, and their behavior changes.",
  },
  {
    q: "Why does my score differ from what I see in a browser?",
    a: "The auditor reads the HTML your server returns, like a crawler does. Content rendered only by client-side JavaScript, geo-gated pages, and bot walls all change what the auditor (and real AI crawlers) can see.",
  },
  {
    q: "Can I compare against competitors?",
    a: "Yes. Add up to two competitor URLs on the home page and you get a lane-by-lane comparison table showing exactly where you lead and where you're losing the answer.",
  },
  {
    q: "Does the audit crawl my whole site?",
    a: "No, it audits the exact URL you submit plus the origin's robots.txt and llms.txt. Run separate audits for your homepage and key landing pages.",
  },
  {
    q: "Is there an API?",
    a: "Yes. POST /api/audit runs the full audit and GET /api/mentions runs a community mention scan. Both are free, unauthenticated, and documented on the API reference page.",
  },
  {
    q: "What is Mention Watch?",
    a: "A scan of Reddit and Hacker News for live threads about your brand or topic, ranked by impact, with a disclosure-first reply draft you edit and post yourself. Nothing is posted on your behalf.",
  },
  {
    q: "Can I automate Mention Watch instead of doing it by hand?",
    a: "Yes. Suede Agent Studio, our visual agent builder, runs the same scan-draft-approve loop on a schedule across Reddit, X, LinkedIn, and Discord, drafting in your brand voice and queueing every reply for your approval before anything posts.",
  },
  {
    q: "How often should I re-audit?",
    a: "After every change you ship from the fix list, and roughly monthly otherwise. Scans from the same browser keep a local history, so you'll see the score trend between runs.",
  },
];

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Frequently asked questions
      </h1>
      <p className="mt-3 text-muted">
        Short answers first; the rest of the docs go deeper.
      </p>
      <div className="mt-6 space-y-2">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none">
              <span className="mr-2 inline-block text-muted transition group-open:rotate-90">
                ▸
              </span>
              {f.q}
            </summary>
            <p className="mt-3 pl-6 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        Something missing? Check the{" "}
        <Link href="/docs/scoring" className="text-accent-strong underline underline-offset-2">
          scoring methodology
        </Link>{" "}
        or email{" "}
        <a href="mailto:hello@suedeai.ai" className="text-accent-strong underline underline-offset-2">
          hello@suedeai.ai
        </a>
        .
      </p>
    </article>
  );
}

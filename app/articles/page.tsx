import { pageSocialMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { keywordsFor } from "@/lib/keywords";
import Link from "next/link";
import { articles, getArticle, type Article } from "@/lib/articles";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";

const title = "AI Visibility Guides and Articles | Suede Signal";
const description =
  "Six AI visibility guides: llms.txt, AI crawler policy, JSON-LD, citable writing, SEO overlap and community mentions, with a map to the Suede Signal audit lanes.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata("/articles", title, description),
  alternates: { canonical: "/articles" },
  keywords: keywordsFor("/articles"),
};

type DocLink = { href: string; label: string };

type LaneGuide = {
  lane: string;
  weight: number;
  checks: string;
  guides: string[];
  docs: DocLink[];
};

// Lane names, weights and check lists mirror lib/audit.ts and /docs/scoring.
const LANE_GUIDES: LaneGuide[] = [
  {
    lane: "AI Crawler Access",
    weight: 25,
    checks:
      "Up to seven checks: robots.txt rules for GPTBot, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended and CCBot, plus a non-empty llms.txt file.",
    guides: ["which-ai-crawlers-to-allow", "what-is-llms-txt"],
    docs: [],
  },
  {
    lane: "Citability",
    weight: 25,
    checks:
      "Five checks: a single H1, two or more H2 sections, 300+ words of visible text, lists or tables, and question-form headings.",
    guides: ["citable-passages"],
    docs: [],
  },
  {
    lane: "Metadata & Sharing",
    weight: 20,
    checks:
      "Five checks: title length, meta description length, canonical URL, Open Graph tags, and HTTPS.",
    guides: [],
    docs: [{ href: "/docs/fixes", label: "Fix guide: the metadata block to copy" }],
  },
  {
    lane: "Structured Data",
    weight: 20,
    checks:
      "Three checks: JSON-LD present, an Organization or Person entity, and FAQ schema.",
    guides: ["json-ld-for-ai-visibility"],
    docs: [],
  },
  {
    lane: "Trust Signals",
    weight: 10,
    checks:
      "Three checks: a linked About page, a visible contact route, and date or freshness markup.",
    guides: [],
    docs: [{ href: "/docs/fixes", label: "Fix guide: About, contact and freshness markup" }],
  },
];

const BEYOND_THE_PAGE: { slug: string; summary: string }[] = [
  {
    slug: "ai-visibility-vs-seo",
    summary:
      "Which SEO fundamentals carry over to answer engines, where the two conflict, and what to measure now.",
  },
  {
    slug: "where-ai-engines-learn-about-brands",
    summary:
      "Which queries pull community threads into AI answers, how to monitor brand mentions, and how to take part with disclosure.",
  },
];

function resolve(slugs: string[]): Article[] {
  return slugs
    .map((slug) => getArticle(slug))
    .filter((a): a is Article => a !== undefined);
}

const inlineLink = "text-accent-strong underline-offset-4 hover:underline";

export default function ArticlesIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24">
      <SiteHeader />
      <section className="mt-14">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          AI visibility guides
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Six practitioner guides. Four map to what the audit checks (AI crawler
          access, llms.txt, structured data, citable writing); two cover where SEO
          carries over and the community threads AI engines learn from. Each guide
          includes an example you can adapt to your own site.
        </p>
      </section>
      <section className="mt-8 space-y-3">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/articles/${a.slug}`}
            className="block rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold text-foreground">{a.title}</h2>
              <span className="shrink-0 text-xs text-muted">{a.readingMinutes} min</span>
            </div>
            <p className="mt-2 text-sm text-muted">{a.description}</p>
            <p className="mt-3 text-xs text-muted">
              <time dateTime={a.date}>
                {new Date(`${a.date}T00:00:00Z`).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Which guide matches each audit lane?
        </h2>
        <p className="mt-3 text-muted">
          The{" "}
          <Link href="/" className={inlineLink}>
            free audit
          </Link>{" "}
          scores a page across five weighted lanes. When a check fails, read the guide
          for its lane, then apply the exact change from the{" "}
          <Link href="/docs/fixes" className={inlineLink}>
            fix guide
          </Link>
          . Every check, weight and grade band is listed in{" "}
          <Link href="/docs/scoring" className={inlineLink}>
            Scoring &amp; lanes
          </Link>
          .
        </p>
        <ul className="mt-6 space-y-3">
          {LANE_GUIDES.map((g) => (
            <li key={g.lane} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="font-semibold text-foreground">
                {g.lane} <span className="text-xs font-normal text-muted">weight {g.weight}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{g.checks}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {resolve(g.guides).map((a) => (
                  <li key={a.slug}>
                    <Link href={`/articles/${a.slug}`} className={`font-medium ${inlineLink}`}>
                      {a.title}
                    </Link>
                  </li>
                ))}
                {g.docs.map((d) => (
                  <li key={d.label}>
                    <Link href={d.href} className={`font-medium ${inlineLink}`}>
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          What do the other two guides cover?
        </h2>
        <p className="mt-3 text-muted">
          Two guides look past the single page the audit scores.
        </p>
        <ul className="mt-6 space-y-3">
          {resolve(BEYOND_THE_PAGE.map((b) => b.slug)).map((a) => (
            <li key={a.slug} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <Link href={`/articles/${a.slug}`} className={`font-semibold ${inlineLink}`}>
                {a.title}
              </Link>
              <p className="mt-1 text-sm text-muted">
                {BEYOND_THE_PAGE.find((b) => b.slug === a.slug)?.summary}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          To find the threads about your own brand, run{" "}
          <Link href="/docs/mention-watch" className={inlineLink}>
            Mention Watch
          </Link>
          : a free Reddit and Hacker News scan with a disclosure-first reply draft.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}

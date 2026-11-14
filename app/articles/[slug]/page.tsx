import type { Metadata } from "next";
import { keywordsFor } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle, type Article } from "@/lib/articles";
import { renderMarkdown } from "@/lib/markdown";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { OG_IMAGE, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

// The next `count` articles after this one, wrapping to the start, so every
// article is linked from other articles rather than only from the index.
function nextArticles(slug: string, count: number): Article[] {
  const i = articles.findIndex((a) => a.slug === slug);
  return Array.from(
    { length: Math.min(count, articles.length - 1) },
    (_, k) => articles[(i + 1 + k) % articles.length],
  );
}

const TITLE_SUFFIX = " | Suede Signal";

// Where founder field notes are written for. Places only: no address, phone
// or hours, and no new Organization or Person nodes.
const FIELD_NOTE_PLACES = [
  "West Palm Beach",
  "Jupiter",
  "Palm Beach Gardens",
  "Palm Beach County",
].map((name) => ({
  "@type": "Place",
  name: `${name}, Florida`,
  address: { "@type": "PostalAddress", addressRegion: "FL", addressCountry: "US" },
}));

// Keep rendered <title> within 60 characters: drop the brand suffix when
// the article title plus suffix would run over.
function articleTitle(title: string): Metadata["title"] {
  return title.length + TITLE_SUFFIX.length <= 60
    ? `${title}${TITLE_SUFFIX}`
    : { absolute: title };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: articleTitle(article.title),
    description: article.description,
    alternates: { canonical: `/articles/${article.slug}` },
    keywords: keywordsFor(`/articles/${article.slug}`),
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url: `${SITE_URL}/articles/${article.slug}`,
      publishedTime: article.date,
      ...(article.byline === "founder" ? { authors: ["https://suedeai.ai/founder"] } : {}),
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Suede Signal: AI-readiness audit for answer engines",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [OG_IMAGE],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const pageUrl = `${SITE_URL}/articles/${article.slug}`;
  const isFounderNote = article.byline === "founder";
  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: article.title,
        description: article.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        primaryImageOfPage: { "@id": `${pageUrl}#primaryimage` },
        mainEntity: { "@id": `${pageUrl}#article` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Suede Signal", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` },
          { "@type": "ListItem", position: 3, name: article.title, item: pageUrl },
        ],
      },
      {
        "@type": "ImageObject",
        "@id": `${pageUrl}#primaryimage`,
        url: OG_IMAGE,
        contentUrl: OG_IMAGE,
        width: 1200,
        height: 630,
      },
      {
        "@type": "Article",
        // Founder field notes are blog posts by a named person; the rest are
        // organization guides. Both reference canonical @ids only.
        ...(isFounderNote ? { "@type": "BlogPosting" } : {}),
        "@id": `${pageUrl}#article`,
        headline: article.title,
        description: article.description,
        image: OG_IMAGE,
        datePublished: article.date,
        dateModified: article.date,
        mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
        author: {
          "@id": isFounderNote
            ? "https://suedeai.ai/founder#person"
            : "https://suedeai.ai/#organization",
        },
        publisher: { "@id": "https://suedeai.ai/#organization" },
        ...(isFounderNote ? { about: FIELD_NOTE_PLACES, spatialCoverage: FIELD_NOTE_PLACES } : {}),
        keywords: keywordsFor(`/articles/${article.slug}`).join(", "),
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <SiteHeader />
      <article className="mt-14">
        <p className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
          <Link href="/articles" className="transition hover:text-accent">
            Articles
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          <time dateTime={article.date}>
            {new Date(`${article.date}T00:00:00Z`).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>{" "}
          · {article.readingMinutes} min read ·{" "}
          {isFounderNote ? (
            <a href="https://suedeai.ai/founder" className="transition hover:text-foreground">
              Jason Colapietro, Suede AI
            </a>
          ) : (
            "Suede AI"
          )}
        </p>
        <div
          className="prose-suede mt-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
        />
        {isFounderNote && (
          <aside
            aria-label="About the author"
            className="mt-12 rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              About the author
            </p>
            <p className="mt-2 font-semibold text-foreground">
              <a href="https://suedeai.ai/founder" className="transition hover:text-accent-strong">
                Jason Colapietro
              </a>
            </p>
            <p className="text-sm text-muted">Founder and CEO, Suede AI · West Palm Beach, Florida</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Jason founded Suede AI in 2024 as an agentic platform company, with AI search
              visibility as a service line. Read the{" "}
              <a href="https://suedeai.ai/founder" className="text-accent-strong underline-offset-4 hover:underline">
                founder page
              </a>
              , his personal site at{" "}
              <a href="https://jasoncolapietro.com/" className="text-accent-strong underline-offset-4 hover:underline">
                jasoncolapietro.com
              </a>
              , or the{" "}
              <a href="https://seo.suedeai.ai/evidence" className="text-accent-strong underline-offset-4 hover:underline">
                evidence page
              </a>{" "}
              that backs every claim.
            </p>
          </aside>
        )}
      </article>

      <section className="mt-16 rounded-3xl border border-accent/30 bg-accent/[0.06] p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">
          How visible is your site to AI engines?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Run the free audit: up to 22 checks, graded in seconds, nothing stored.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-accent px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-accent-strong"
        >
          Run your free audit
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
          More articles
        </h2>
        <div className="mt-4 space-y-2">
          {nextArticles(article.slug, 3).map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="block rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm transition hover:border-accent"
            >
              <span className="font-medium text-foreground">{a.title}</span>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

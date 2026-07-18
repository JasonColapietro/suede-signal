import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle } from "@/lib/articles";
import { renderMarkdown } from "@/lib/markdown";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Suede Signal`,
    description: article.description,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
    author: { "@type": "Organization", name: "Suede Labs", url: "https://suedeai.ai" },
    publisher: { "@type": "Organization", name: "Suede Labs", url: "https://suedeai.ai" },
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
          · {article.readingMinutes} min read · Suede Labs
        </p>
        <div
          className="prose-suede mt-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
        />
      </article>

      <section className="mt-16 rounded-3xl border border-accent/30 bg-accent/[0.06] p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">
          How visible is your site to AI engines?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Run the free audit — 26 checks, graded in seconds, nothing stored.
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
          {articles
            .filter((a) => a.slug !== article.slug)
            .slice(0, 3)
            .map((a) => (
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

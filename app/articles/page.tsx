import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/lib/articles";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";

export const metadata: Metadata = {
  title: "Articles — Suede Signal",
  description:
    "Practitioner guides to AI visibility: llms.txt, AI crawler policy, JSON-LD, citable writing, and where AI engines learn about brands.",
  alternates: { canonical: "/articles" },
};

export default function ArticlesIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24">
      <SiteHeader />
      <section className="mt-14">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Articles</h1>
        <p className="mt-3 max-w-xl text-muted">
          Practitioner guides to becoming the brand AI recommends — no hype, working
          examples, honest about what nobody can guarantee.
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
      <SiteFooter />
    </main>
  );
}

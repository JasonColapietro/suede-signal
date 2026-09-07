import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";

// This page fully replaces the root layout's metadata (title, description,
// openGraph, twitter, alternates) rather than layering on top of it, so a
// 404 response carries exactly one <title> and one robots meta tag instead
// of both this page's and the inherited homepage values.
// Next.js automatically injects a noindex robots meta tag for any response
// that returns a 404 status, so this metadata does not set `robots` itself:
// doing so would add a second, redundant <meta name="robots"> tag.
export const metadata: Metadata = {
  title: "Page not found | Suede Signal",
  description: "This page does not exist on Suede Signal. Run a free AI-readiness audit or return to the home page.",
};

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24">
      <SiteHeader />
      <div className="mt-16 text-center">
        <p className="text-sm font-medium text-muted">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          This page does not exist on Suede Signal. It may have moved or the link may be out of date.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-accent"
        >
          Run a free audit
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}

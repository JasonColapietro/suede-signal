import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border pt-6 pb-2 text-xs text-muted">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href="/" className="transition hover:text-foreground">
          Audit
        </Link>
        <Link href="/docs" className="transition hover:text-foreground">
          Docs
        </Link>
        <Link href="/docs/api" className="transition hover:text-foreground">
          API
        </Link>
        <Link href="/articles" className="transition hover:text-foreground">
          Articles
        </Link>
        <Link href="/docs/faq" className="transition hover:text-foreground">
          FAQ
        </Link>
        <a href="mailto:hello@suedeai.ai" className="transition hover:text-foreground">
          Contact
        </a>
      </nav>
      <p className="mt-4 text-center">
        Suede Signal runs read-only checks against your public pages. Nothing is stored.
      </p>
    </footer>
  );
}

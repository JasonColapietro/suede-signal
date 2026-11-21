import Link from "next/link";
import { RELATED_SUEDE_TOOLS } from "@/lib/relatedTools";

const footerLink = "underline-offset-4 transition hover:text-foreground hover:underline";

// Sibling Suede sites, each live (HTTP 200) when added on 2026-11-14.
const MORE_FROM_SUEDE = [
  { name: "Agentix agent grader", href: "https://agentix.suedeai.ai/" },
  { name: "Suede developer docs", href: "https://docs.suedeai.ai/" },
  { name: "Suede podcast", href: "https://podcast.suedeai.ai/" },
  { name: "Proof and evidence", href: "https://seo.suedeai.ai/evidence" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border pt-6 pb-2 text-xs text-muted">
      <section aria-labelledby="related-suede-tools" className="mb-8">
        <h2
          id="related-suede-tools"
          className="text-center text-xs font-semibold tracking-wide text-muted uppercase"
        >
          Related Suede tools
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {RELATED_SUEDE_TOOLS.map((tool) => (
            <li
              key={tool.href}
              className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm"
            >
              <a
                href={tool.href}
                className="text-sm font-semibold text-foreground transition hover:text-accent-strong"
              >
                {tool.name}
              </a>
              <p className="mt-1 leading-relaxed">{tool.description}</p>
            </li>
          ))}
        </ul>
      </section>
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
        <a
          href="https://suedeai.ai/privacy"
          className="transition hover:text-foreground"
        >
          Privacy
        </a>
        <a
          href="https://suedeai.ai/terms"
          className="transition hover:text-foreground"
        >
          Terms
        </a>
        <a href="mailto:hello@suedeai.ai" className="transition hover:text-foreground">
          Contact
        </a>
      </nav>
      <p className="mt-4 text-center">
        Suede Signal runs read-only checks against your public pages. Nothing is stored.
      </p>
      <section
        aria-labelledby="built-by-suede-ai"
        className="mx-auto mt-6 max-w-xl text-center leading-relaxed"
      >
        <h2
          id="built-by-suede-ai"
          className="text-xs font-semibold tracking-wide text-muted uppercase"
        >
          Built by Suede in West Palm Beach, Florida
        </h2>
        <p className="mt-2">
          Built by{" "}
          <a href="https://suedeai.ai/founder" className={footerLink}>
            Jason Colapietro
          </a>
          , founder of{" "}
          <a href="https://suedeai.ai/" className={footerLink}>
            Suede
          </a>
          . The{" "}
          <a href="https://suedeai.agency/" className={footerLink}>
            Suede SEO, GEO and web development practice
          </a>{" "}
          serves West Palm Beach, Jupiter and Palm Beach County. More from Jason at{" "}
          <a href="https://jasoncolapietro.com/" className={footerLink}>
            jasoncolapietro.com
          </a>{" "}
          and in{" "}
          <a href="https://jupitersocialfl.com/" className={footerLink}>
            Jupiter Social
          </a>
          , the Jupiter, Florida magazine published with Suede.
        </p>
        <p className="mt-2">
          Suede ranks among{" "}
          <a href="https://clutch.co/profile/suede-ai-seo" className={footerLink}>
            Clutch
          </a>
          &apos;s{" "}
          <a href="https://clutch.co/consulting/ai/florida" className={footerLink}>
            Top 30 AI Consultants in Florida
          </a>{" "}
          and{" "}
          <a href="https://clutch.co/us/consulting/ai" className={footerLink}>
            Top 50 AI Consultants nationwide
          </a>{" "}
          (November 2026).
        </p>
        <p className="mt-2">
          More from Suede:{" "}
          {MORE_FROM_SUEDE.map((site, i) => (
            <span key={site.href}>
              {i > 0 && " · "}
              <a href={site.href} className={footerLink}>
                {site.name}
              </a>
            </span>
          ))}
        </p>
      </section>
    </footer>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";

const NAV = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/scoring", label: "Scoring & lanes" },
  { href: "/docs/fixes", label: "Fix guide" },
  { href: "/docs/mention-watch", label: "Mention Watch" },
  { href: "/docs/api", label: "API reference" },
  { href: "/docs/faq", label: "FAQ" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 pb-24">
      <SiteHeader />
      <div className="mt-10 flex flex-col gap-10 md:flex-row">
        <aside className="md:w-48 md:shrink-0">
          <nav className="sticky top-6 flex flex-row flex-wrap gap-2 md:flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted shadow-sm transition hover:border-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
}

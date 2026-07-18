import Link from "next/link";
import { AGENT_STUDIO_URL } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="mt-6 flex items-center justify-between rounded-full border border-border bg-surface px-6 py-4 shadow-sm">
      <Link
        href="/"
        className="flex items-center gap-2 font-bold tracking-tight text-foreground"
      >
        <span
          className="inline-block h-5 w-5 rounded-md"
          style={{ background: "linear-gradient(135deg, var(--accent), #1c1917)" }}
        />
        Suede Signal
      </Link>
      <nav className="flex items-center gap-4 text-xs font-medium">
        <Link href="/docs" className="text-muted transition hover:text-foreground">
          Docs
        </Link>
        <Link href="/articles" className="text-muted transition hover:text-foreground">
          Articles
        </Link>
        <a
          href={AGENT_STUDIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-accent-strong transition hover:text-accent sm:inline"
        >
          Suede Agent Studio ↗
        </a>
      </nav>
    </header>
  );
}

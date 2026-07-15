"use client";

import { useEffect, useState } from "react";
import type { AuditReport, Lane } from "@/lib/audit";
import { SignalGauge } from "@/app/components/SignalGauge";
import { OrbitIcons } from "@/app/components/OrbitIcons";
import { Marquee } from "@/app/components/Marquee";

const EXAMPLE_DOMAIN = "suedeai.ai";

type HistoryEntry = { host: string; score: number; grade: string; at: string };

const HISTORY_KEY = "ss-history";

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-200)));
}

function scoreText(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function hostOf(url: string) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LaneCard({ lane }: { lane: Lane }) {
  const [open, setOpen] = useState(false);
  const failed = lane.checks.filter((c) => !c.passed).length;
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-foreground">{lane.title}</span>
            <span className="font-mono text-sm tabular-nums text-muted">{lane.score}/100</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full ${lane.score >= 80 ? "bg-emerald-500" : lane.score >= 60 ? "bg-amber-500" : "bg-red-500"} transition-all duration-700`}
              style={{ width: `${lane.score}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {failed === 0 ? "all clear" : `${failed} issue${failed > 1 ? "s" : ""}`} {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <ul className="border-t border-border px-5 py-3 text-sm">
          {lane.checks.map((c) => (
            <li key={c.id} className="flex gap-3 py-1.5">
              <span className={c.passed ? "text-emerald-600" : "text-red-500"}>
                {c.passed ? "✓" : "✕"}
              </span>
              <span>
                <span className="text-foreground">{c.label}</span>
                <span className="text-muted"> — {c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrendBadge({ report, history }: { report: AuditReport; history: HistoryEntry[] }) {
  const host = hostOf(report.finalUrl);
  const prior = history.filter((h) => h.host === host && h.at < report.fetchedAt);
  if (prior.length === 0) {
    return <span className="text-xs text-muted">first scan of this domain</span>;
  }
  const last = prior[prior.length - 1];
  const delta = report.score - last.score;
  const cls = delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-muted";
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";
  return (
    <span className={`text-xs font-medium ${cls}`}>
      {arrow} {delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta}`} vs{" "}
      {new Date(last.at).toLocaleDateString()} · {prior.length + 1} scans tracked
    </span>
  );
}

function ReportDetail({ report, history }: { report: AuditReport; history: HistoryEntry[] }) {
  return (
    <div className="animate-sweep-in space-y-6">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface px-6 py-8 shadow-sm sm:flex-row sm:justify-between">
        <SignalGauge score={report.score} grade={report.grade} size={172} />
        <div className="text-center sm:text-right">
          <p className="text-lg font-semibold text-foreground">{report.score}/100 AI visibility</p>
          <p className="mt-1 text-sm break-all text-muted">{report.finalUrl}</p>
          <p className="mt-1 text-xs text-muted">{new Date(report.fetchedAt).toLocaleString()}</p>
          <p className="mt-2">
            <TrendBadge report={report} history={history} />
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {report.lanes.map((lane) => (
          <LaneCard key={lane.id} lane={lane} />
        ))}
      </div>

      {report.topFixes.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-6">
          <h2 className="font-semibold text-accent-strong">Fix these first</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/90">
            {report.topFixes.map((fix, i) => (
              <li key={i}>{fix}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function CompareTable({ reports }: { reports: AuditReport[] }) {
  const laneIds = reports[0].lanes.map((l) => ({ id: l.id, title: l.title }));
  const best = Math.max(...reports.map((r) => r.score));
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-5 py-4 font-medium text-muted">Lane</th>
            {reports.map((r) => (
              <th key={r.finalUrl} className="px-5 py-4">
                <div className="font-semibold text-foreground">{hostOf(r.finalUrl)}</div>
                <div className={`mt-1 text-lg font-bold ${scoreText(r.score)}`}>
                  {r.grade} · {r.score}
                  {r.score === best && reports.length > 1 && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      LEADER
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {laneIds.map((lane) => {
            const laneBest = Math.max(
              ...reports.map((r) => r.lanes.find((l) => l.id === lane.id)?.score ?? 0)
            );
            return (
              <tr key={lane.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-3 text-muted">{lane.title}</td>
                {reports.map((r) => {
                  const s = r.lanes.find((l) => l.id === lane.id)?.score ?? 0;
                  return (
                    <td key={r.finalUrl} className="px-5 py-3">
                      <span className={`tabular-nums font-medium ${scoreText(s)}`}>{s}</span>
                      {s === laneBest && reports.length > 1 && s > 0 && (
                        <span className="ml-1.5 text-emerald-600/70">▲</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Mention = {
  id: string;
  title: string;
  source: string;
  ups: number;
  comments: number;
  permalink: string;
  createdUtc: number;
  excerpt: string;
};

function draftReply(brand: string, m: Mention): string {
  return [
    `Disclosure up front: I work on ${brand}, so weigh accordingly.`,
    ``,
    `Since "${m.title}" is on topic — adding one option to the thread. ${brand} [one honest sentence on what it does and who it's for — edit before posting].`,
    ``,
    `Not here to pitch. Happy to answer questions in-thread if it's useful, and genuinely fine if a different tool fits better.`,
  ].join("\n");
}

function MentionCard({ mention, brand }: { mention: Mention; brand: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <a
          href={mention.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground transition hover:text-accent-strong"
        >
          {mention.title}
        </a>
        <span className="shrink-0 text-xs text-muted">
          {mention.source} · ↑{mention.ups} · {mention.comments} comments
        </span>
      </div>
      {mention.excerpt && <p className="mt-2 text-sm text-muted">{mention.excerpt}…</p>}
      <div className="mt-3">
        {draft === null ? (
          <button
            onClick={() => setDraft(draftReply(brand, mention))}
            className="text-sm font-medium text-accent-strong transition hover:text-accent"
          >
            Draft a reply ▸
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-accent"
            />
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(draft);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-full bg-accent px-4 py-1.5 font-medium text-white transition hover:bg-accent-strong"
              >
                {copied ? "Copied ✓" : "Copy draft"}
              </button>
              <span className="text-xs text-muted">Edit before posting — disclosure stays in.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MentionWatch({ brand }: { brand: string }) {
  const [query, setQuery] = useState(brand);
  const [mentions, setMentions] = useState<Mention[] | null>(null);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentions?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed.");
      setMentions(data.mentions);
      setUnavailable(data.unavailable ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-16">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Mention watch</h2>
      <p className="mt-2 text-sm text-muted">
        The threads AI engines learn from. Find where your brand is (or isn&apos;t) in the
        conversation, and draft a disclosed reply.
      </p>
      <form onSubmit={scan} className="mt-4 flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="brand or topic"
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder-muted/60 shadow-sm outline-none transition focus:border-accent"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-full border border-accent/50 px-5 py-3 font-medium text-accent-strong transition hover:bg-accent/10 disabled:opacity-40"
        >
          {loading ? "Scanning…" : "Scan communities"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {mentions !== null && !error && (
        <div className="mt-4 space-y-3">
          {unavailable.length > 0 && (
            <p className="text-xs text-muted">
              {unavailable.join(" and ")} unreachable right now — showing the rest.
            </p>
          )}
          {mentions.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted shadow-sm">
              No high-impact threads found for “{query}”. That itself is a visibility gap — the
              conversations AI learns from don&apos;t mention you yet.
            </p>
          ) : (
            mentions.map((m) => <MentionCard key={m.id} mention={m} brand={brand} />)
          )}
        </div>
      )}
    </section>
  );
}

const FAQS = [
  {
    q: "What does Suede Signal actually check?",
    a: "26 deterministic checks across five lanes: whether AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) can read your site, whether llms.txt exists, metadata and Open Graph quality, JSON-LD structured data, passage-level citability, and trust signals like about pages and freshness markup.",
  },
  {
    q: "Why does AI visibility matter?",
    a: "A growing share of product discovery now starts in ChatGPT, Claude, Perplexity, and Google AI Overviews instead of a search results page. If the engines can't read your site — or can't find a citable passage on it — you don't exist in the answer.",
  },
  {
    q: "Is my data stored?",
    a: "No. Every audit runs read-only against your public pages at request time. Nothing is saved on our side.",
  },
  {
    q: "How is this different from an SEO audit?",
    a: "Classic SEO optimizes for ranked links. AI visibility optimizes for being quoted in an answer: crawler permissions, entity schema, question-shaped headings, and direct extractable passages. Some checks overlap; the intent doesn't.",
  },
  {
    q: "Can I compare against competitors?",
    a: "Yes — add up to two competitor URLs and you get a lane-by-lane comparison showing exactly where you lead and where you're losing the answer.",
  },
];

export default function Home() {
  const [urls, setUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const filled = urls.filter((u) => u.trim());

  function setUrl(i: number, value: string) {
    setUrls((prev) => prev.map((u, idx) => (idx === i ? value : u)));
  }

  async function runAudit(targets: string[]) {
    if (targets.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setReports([]);
    try {
      const results = await Promise.all(
        targets.map(async (url) => {
          const res = await fetch("/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Audit failed for ${url}.`);
          return data as AuditReport;
        })
      );
      setReports(results);
      setHistory((prev) => {
        const merged = [
          ...prev,
          ...results.map((r) => ({
            host: hostOf(r.finalUrl),
            score: r.score,
            grade: r.grade,
            at: r.fetchedAt,
          })),
        ];
        saveHistory(merged);
        return merged;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24">
      <header className="mt-6 flex items-center justify-between rounded-full border border-border bg-surface px-6 py-4 shadow-sm">
        <span className="flex items-center gap-2 font-bold tracking-tight text-foreground">
          <span
            className="inline-block h-5 w-5 rounded-md"
            style={{ background: "linear-gradient(135deg, var(--accent), #1c1917)" }}
          />
          Suede Signal
        </span>
        <span className="text-xs text-muted">by Suede Labs</span>
      </header>

      <section className="relative pt-16 pb-12 text-center">
        <OrbitIcons />
        <span className="relative inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted shadow-sm">
          <span className="font-semibold text-accent-strong">Free</span> AI search visibility audit
        </span>
        <h1 className="relative mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Become the brand
          <br />
          <span className="text-accent">AI recommends</span>
        </h1>
        <p className="relative mx-auto mt-5 max-w-xl text-lg text-muted">
          ChatGPT, Claude, and Perplexity are the new front page. Paste your URL and get a graded
          audit in seconds — what the engines can read, what they&apos;ll cite, and exactly what to
          fix.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAudit(filled);
          }}
          className="relative mt-8 space-y-3"
        >
          {urls.map((u, i) => (
            <div key={i} className="flex gap-3">
              <input
                value={u}
                onChange={(e) => setUrl(i, e.target.value)}
                placeholder={i === 0 ? "yourdomain.com" : `competitor${i}.com`}
                className="min-w-0 flex-1 rounded-full border border-border bg-surface px-6 py-3.5 text-foreground placeholder-muted/60 shadow-sm outline-none transition focus:border-accent"
                spellCheck={false}
                autoFocus={i === 0}
              />
              {i === 0 ? (
                <button
                  type="submit"
                  disabled={loading || filled.length === 0}
                  className="rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:opacity-40"
                >
                  {loading ? "Auditing…" : "Audit"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-full border border-border px-4 text-muted transition hover:text-foreground"
                  aria-label="Remove competitor"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {urls.length < 3 && (
            <button
              type="button"
              onClick={() => setUrls((prev) => [...prev, ""])}
              className="text-sm text-muted transition hover:text-accent-strong"
            >
              + Compare against a competitor
            </button>
          )}
        </form>

        <div className="relative mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => runAudit([EXAMPLE_DOMAIN])}
            disabled={loading}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            See an example scan
          </button>
        </div>

        {reports.length === 0 && !loading && (
          <div className="relative mt-8 flex justify-center">
            <SignalGauge score={null} grade={null} size={200} />
          </div>
        )}
      </section>

      {loading && (
        <p className="mt-2 animate-pulse text-center text-sm text-muted">
          Fetching {filled.length > 1 ? `${filled.length} sites` : "your page"} — robots.txt,
          llms.txt, and schema…
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {reports.length > 1 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
            Head to head
          </h2>
          <CompareTable reports={reports} />
        </section>
      )}

      {reports.length > 0 && (
        <>
          <section className="mt-12 space-y-12">
            {reports.map((r) => (
              <div key={r.finalUrl}>
                {reports.length > 1 && (
                  <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
                    {hostOf(r.finalUrl)}
                  </h3>
                )}
                <ReportDetail report={r} history={history} />
              </div>
            ))}
          </section>
          <MentionWatch brand={hostOf(reports[0].finalUrl)} />
        </>
      )}

      {reports.length === 0 && !loading && (
        <>
          <section className="mt-20">
            <h2 className="text-center text-2xl font-bold text-foreground">
              AI is the new search engine. Are you visible?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted">
              ChatGPT, Perplexity, and Gemini pull answers from pages they can crawl, parse, and
              trust — then cite the source. Everyone else gets skipped, and most sites fail at
              least one of the three without knowing it.
            </p>
            <div className="mt-8">
              <Marquee />
            </div>
          </section>

          <section className="mt-20 space-y-16">
            <div className="flex flex-col items-center gap-8 sm:flex-row">
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
                  Graded scan
                </p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">
                  See exactly how AI ranks your brand
                </h3>
                <p className="mt-2 text-muted">
                  Paste a URL, get an A–F grade in seconds. Five weighted lanes, 26 checks, and a
                  ranked fix list — the same lanes the Suede audit stack runs on production sites.
                </p>
              </div>
              <div className="flex flex-1 justify-center rounded-3xl border border-border bg-surface p-8 shadow-sm">
                <SignalGauge score={87} grade="B" size={160} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 sm:flex-row-reverse">
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
                  Competitor lens
                </p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">
                  Find out who AI actually recommends
                </h3>
                <p className="mt-2 text-muted">
                  Line your site up against two competitors, lane by lane. See who the engines can
                  actually read, who has the schema, and who&apos;s winning citability.
                </p>
              </div>
              <div className="flex-1 space-y-2 rounded-3xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-sm">
                  <span className="font-medium text-foreground">yourbrand.com</span>
                  <span className="font-semibold text-emerald-700">A · 92 LEADER</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-background px-4 py-2.5 text-sm">
                  <span className="font-medium text-foreground">competitor.com</span>
                  <span className="font-semibold text-amber-700">C · 71</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 sm:flex-row">
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
                  Mention watch
                </p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">
                  Listen before AI does
                </h3>
                <p className="mt-2 text-muted">
                  See where your brand shows up in the conversations AI engines learn from —
                  community threads, ranked by impact — and draft a disclosed reply.
                </p>
              </div>
              <div className="flex-1 rounded-3xl border border-border bg-surface p-5 shadow-sm">
                <p className="font-medium text-foreground">
                  Best AI visibility tool for a small team?
                </p>
                <p className="mt-1 text-xs text-muted">r/SaaS · ↑142 · 38 comments</p>
                <p className="mt-3 text-xs font-medium text-accent-strong">Draft a reply ▸</p>
              </div>
            </div>
          </section>

          <section className="mt-20">
            <h2 className="text-center text-sm font-semibold tracking-wide text-muted uppercase">
              Pricing
            </h2>
            <div className="mx-auto mt-6 max-w-lg rounded-3xl border-2 border-accent/40 bg-surface p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold text-foreground">Audit</h3>
                <p className="text-3xl font-bold text-accent-strong">Free</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>Unlimited on-demand audits</li>
                <li>Competitor comparison</li>
                <li>Mention watch + reply drafts</li>
                <li>Visibility history, saved to your browser</li>
                <li>Nothing stored on our servers, no signup</li>
              </ul>
            </div>
            <p className="mt-4 text-center text-sm text-muted">
              Watch (scheduled re-audits, drift alerts, cross-device sync) — coming soon.
            </p>
          </section>

          <section className="mt-20">
            <h2 className="text-center text-sm font-semibold tracking-wide text-muted uppercase">
              Questions
            </h2>
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
          </section>

          <section className="mt-20 rounded-3xl bg-foreground p-10 text-center">
            <h2 className="text-2xl font-bold text-background">
              Find out if you&apos;re the answer
            </h2>
            <p className="mt-2 text-background/70">Free, instant, nothing stored.</p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-6 rounded-full bg-accent px-8 py-3.5 font-semibold text-white transition hover:bg-accent-strong"
            >
              Run your free audit
            </button>
          </section>
        </>
      )}

      <footer className="mt-24 border-t border-border pt-6 text-center text-xs text-muted">
        Suede Signal runs read-only checks against your public pages. Nothing is stored.
      </footer>
    </main>
  );
}

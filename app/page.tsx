"use client";

import { useState } from "react";
import type { AuditReport, Lane } from "@/lib/audit";

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-400 border-emerald-400/40",
  B: "text-lime-400 border-lime-400/40",
  C: "text-amber-400 border-amber-400/40",
  D: "text-orange-400 border-orange-400/40",
  F: "text-red-400 border-red-400/40",
};

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-red-400";
}

function scoreText(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-stone-100">{lane.title}</span>
            <span className="text-sm tabular-nums text-stone-400">{lane.score}/100</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${scoreColor(lane.score)} transition-all duration-700`}
              style={{ width: `${lane.score}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-stone-500">
          {failed === 0 ? "all clear" : `${failed} issue${failed > 1 ? "s" : ""}`} {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <ul className="border-t border-white/10 px-5 py-3 text-sm">
          {lane.checks.map((c) => (
            <li key={c.id} className="flex gap-3 py-1.5">
              <span className={c.passed ? "text-emerald-400" : "text-red-400"}>
                {c.passed ? "✓" : "✕"}
              </span>
              <span>
                <span className="text-stone-200">{c.label}</span>
                <span className="text-stone-500"> — {c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportDetail({ report }: { report: AuditReport }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 text-4xl font-bold ${GRADE_COLORS[report.grade]}`}
        >
          {report.grade}
        </div>
        <div>
          <p className="text-lg font-medium text-stone-100">{report.score}/100 AI visibility</p>
          <p className="mt-1 text-sm break-all text-stone-500">
            {report.finalUrl} · audited {new Date(report.fetchedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {report.lanes.map((lane) => (
          <LaneCard key={lane.id} lane={lane} />
        ))}
      </div>

      {report.topFixes.length > 0 && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-6">
          <h2 className="font-semibold text-amber-200">Fix these first</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-300">
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
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="px-5 py-4 font-medium text-stone-400">Lane</th>
            {reports.map((r) => (
              <th key={r.finalUrl} className="px-5 py-4">
                <div className="font-semibold text-stone-100">{hostOf(r.finalUrl)}</div>
                <div className={`mt-1 text-lg font-bold ${scoreText(r.score)}`}>
                  {r.grade} · {r.score}
                  {r.score === best && reports.length > 1 && (
                    <span className="ml-2 rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
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
              <tr key={lane.id} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 text-stone-300">{lane.title}</td>
                {reports.map((r) => {
                  const s = r.lanes.find((l) => l.id === lane.id)?.score ?? 0;
                  return (
                    <td key={r.finalUrl} className="px-5 py-3">
                      <span className={`tabular-nums font-medium ${scoreText(s)}`}>{s}</span>
                      {s === laneBest && reports.length > 1 && s > 0 && (
                        <span className="ml-1.5 text-emerald-400/60">▲</span>
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

const FAQS = [
  {
    q: "What does Suede Reply actually check?",
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

const FEATURES = [
  {
    title: "Graded audit",
    body: "Paste a URL, get an A–F grade in seconds. Five weighted lanes, 26 checks, and a ranked fix list — the same lanes the Suede audit stack runs on production sites.",
    tag: "Live",
  },
  {
    title: "Competitor lens",
    body: "Line your site up against two competitors, lane by lane. See who the engines can actually read, who has the schema, and who's winning citability.",
    tag: "Live",
  },
  {
    title: "Mention watch",
    body: "Track where your brand shows up in the conversations AI engines learn from — Reddit threads, community posts — before the models bake them in.",
    tag: "Coming soon",
  },
];

export default function Home() {
  const [urls, setUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<AuditReport[]>([]);

  const filled = urls.filter((u) => u.trim());

  function setUrl(i: number, value: string) {
    setUrls((prev) => prev.map((u, idx) => (idx === i ? value : u)));
  }

  async function audit(e: React.FormEvent) {
    e.preventDefault();
    if (filled.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setReports([]);
    try {
      const results = await Promise.all(
        filled.map(async (url) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24">
      <header className="flex items-center justify-between py-8">
        <span className="text-sm font-semibold tracking-widest text-amber-200/90 uppercase">
          Suede Reply
        </span>
        <span className="text-xs text-stone-500">by Suede Labs</span>
      </header>

      <section className="pt-10 pb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">
          Make your brand{" "}
          <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            the answer
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-stone-400">
          ChatGPT, Claude, and Perplexity are the new front page. Paste your URL and get a graded
          AI-visibility audit in seconds — what the engines can read, what they&apos;ll cite, and
          exactly what to fix.
        </p>
      </section>

      <form onSubmit={audit} className="space-y-3">
        {urls.map((u, i) => (
          <div key={i} className="flex gap-3">
            <input
              value={u}
              onChange={(e) => setUrl(i, e.target.value)}
              placeholder={i === 0 ? "yourdomain.com" : `competitor${i}.com`}
              className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-300/50"
              spellCheck={false}
              autoFocus={i === 0}
            />
            {i === 0 ? (
              <button
                type="submit"
                disabled={loading || filled.length === 0}
                className="rounded-xl bg-amber-300 px-6 py-3.5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-40"
              >
                {loading ? "Auditing…" : "Audit"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="rounded-xl border border-white/15 px-4 text-stone-500 transition hover:text-stone-300"
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
            className="text-sm text-stone-500 transition hover:text-amber-200"
          >
            + Compare against a competitor
          </button>
        )}
      </form>

      {loading && (
        <p className="mt-6 animate-pulse text-center text-sm text-stone-500">
          Fetching {filled.length > 1 ? `${filled.length} sites` : "your page"} — robots.txt,
          llms.txt, and schema…
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {reports.length > 1 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-sm font-semibold tracking-widest text-stone-400 uppercase">
            Head to head
          </h2>
          <CompareTable reports={reports} />
        </section>
      )}

      {reports.length > 0 && (
        <section className="mt-12 space-y-12">
          {reports.map((r) => (
            <div key={r.finalUrl}>
              {reports.length > 1 && (
                <h3 className="mb-4 text-sm font-semibold tracking-widest text-stone-400 uppercase">
                  {hostOf(r.finalUrl)}
                </h3>
              )}
              <ReportDetail report={r} />
            </div>
          ))}
        </section>
      )}

      {reports.length === 0 && !loading && (
        <>
          <section className="mt-24">
            <h2 className="text-center text-2xl font-semibold text-stone-100">
              The front page moved. Your traffic strategy didn&apos;t.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-stone-400">
              AI engines answer with citations, not ten blue links. They cite sites they can crawl,
              parse, and trust — and skip everyone else. Most sites fail at least one of the three
              without knowing it.
            </p>
          </section>

          <section className="mt-16 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-100">{f.title}</h3>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      f.tag === "Live"
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-white/10 text-stone-400"
                    }`}
                  >
                    {f.tag}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">{f.body}</p>
              </div>
            ))}
          </section>

          <section className="mt-20">
            <h2 className="text-center text-sm font-semibold tracking-widest text-stone-400 uppercase">
              Pricing
            </h2>
            <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.04] p-6">
                <h3 className="font-semibold text-stone-100">Audit</h3>
                <p className="mt-1 text-3xl font-bold text-amber-200">Free</p>
                <ul className="mt-4 space-y-2 text-sm text-stone-400">
                  <li>Unlimited on-demand audits</li>
                  <li>Competitor comparison</li>
                  <li>Ranked fix list</li>
                  <li>Nothing stored, no signup</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold text-stone-100">Watch</h3>
                <p className="mt-1 text-3xl font-bold text-stone-300">Coming soon</p>
                <ul className="mt-4 space-y-2 text-sm text-stone-500">
                  <li>Scheduled re-audits and drift alerts</li>
                  <li>Brand mention tracking</li>
                  <li>Reply drafting for community threads</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-20">
            <h2 className="text-center text-sm font-semibold tracking-widest text-stone-400 uppercase">
              Questions
            </h2>
            <div className="mt-6 space-y-2">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
                >
                  <summary className="cursor-pointer list-none font-medium text-stone-200 marker:content-none">
                    <span className="mr-2 inline-block text-stone-500 transition group-open:rotate-90">
                      ▸
                    </span>
                    {f.q}
                  </summary>
                  <p className="mt-3 pl-6 text-sm leading-relaxed text-stone-400">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-2xl border border-white/10 bg-gradient-to-b from-amber-300/[0.06] to-transparent p-10 text-center">
            <h2 className="text-2xl font-semibold text-stone-100">
              Find out if you&apos;re the answer
            </h2>
            <p className="mt-2 text-stone-400">Free, instant, nothing stored.</p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-6 rounded-xl bg-amber-300 px-8 py-3.5 font-semibold text-stone-950 transition hover:bg-amber-200"
            >
              Run your free audit
            </button>
          </section>
        </>
      )}

      <footer className="mt-24 border-t border-white/10 pt-6 text-center text-xs text-stone-600">
        Suede Reply runs read-only checks against your public pages. Nothing is stored.
      </footer>
    </main>
  );
}

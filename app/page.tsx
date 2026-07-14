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

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);

  async function audit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed.");
      setReport(data);
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

      <form onSubmit={audit} className="flex gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-300/50"
          spellCheck={false}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-xl bg-amber-300 px-6 py-3.5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-40"
        >
          {loading ? "Auditing…" : "Audit"}
        </button>
      </form>

      {loading && (
        <p className="mt-6 animate-pulse text-center text-sm text-stone-500">
          Fetching your page, robots.txt, llms.txt, and schema…
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {report && (
        <section className="mt-12 space-y-8">
          <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 text-4xl font-bold ${GRADE_COLORS[report.grade]}`}
            >
              {report.grade}
            </div>
            <div>
              <p className="text-lg font-medium text-stone-100">
                {report.score}/100 AI visibility
              </p>
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
        </section>
      )}

      <footer className="mt-24 border-t border-white/10 pt-6 text-center text-xs text-stone-600">
        Suede Reply runs read-only checks against your public pages. Nothing is stored.
      </footer>
    </main>
  );
}

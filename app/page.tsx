"use client";

import { useState } from "react";
import type { AuditReport, Lane } from "@/lib/audit";

const CORAL = "#E8795A";

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-600 border-emerald-600/40 bg-emerald-50",
  B: "text-lime-600 border-lime-600/40 bg-lime-50",
  C: "text-amber-600 border-amber-600/40 bg-amber-50",
  D: "text-orange-600 border-orange-600/40 bg-orange-50",
  F: "text-red-600 border-red-600/40 bg-red-50",
};

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
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
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-stone-900">{lane.title}</span>
            <span className="text-sm tabular-nums text-stone-500">{lane.score}/100</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full rounded-full ${scoreColor(lane.score)} transition-all duration-700`}
              style={{ width: `${lane.score}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-stone-400">
          {failed === 0 ? "all clear" : `${failed} issue${failed > 1 ? "s" : ""}`} {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <ul className="border-t border-stone-100 px-5 py-3 text-sm">
          {lane.checks.map((c) => (
            <li key={c.id} className="flex gap-3 py-1.5">
              <span className={c.passed ? "text-emerald-600" : "text-red-500"}>
                {c.passed ? "✓" : "✕"}
              </span>
              <span>
                <span className="text-stone-800">{c.label}</span>
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
      <div className="flex items-center gap-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 text-4xl font-bold ${GRADE_COLORS[report.grade]}`}
        >
          {report.grade}
        </div>
        <div>
          <p className="text-lg font-semibold text-stone-900">{report.score}/100 AI visibility</p>
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
        <div className="rounded-2xl border border-[#E8795A]/30 bg-[#E8795A]/[0.06] p-6">
          <h2 className="font-semibold text-[#C85A3D]">Fix these first</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700">
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
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left">
            <th className="px-5 py-4 font-medium text-stone-500">Lane</th>
            {reports.map((r) => (
              <th key={r.finalUrl} className="px-5 py-4">
                <div className="font-semibold text-stone-900">{hostOf(r.finalUrl)}</div>
                <div className={`mt-1 text-lg font-bold ${scoreText(r.score)}`}>
                  {r.grade} · {r.score}
                  {r.score === best && reports.length > 1 && (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
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
              <tr key={lane.id} className="border-b border-stone-100 last:border-0">
                <td className="px-5 py-3 text-stone-600">{lane.title}</td>
                {reports.map((r) => {
                  const s = r.lanes.find((l) => l.id === lane.id)?.score ?? 0;
                  return (
                    <td key={r.finalUrl} className="px-5 py-3">
                      <span className={`tabular-nums font-medium ${scoreText(s)}`}>{s}</span>
                      {s === laneBest && reports.length > 1 && s > 0 && (
                        <span className="ml-1.5 text-emerald-500/70">▲</span>
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
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <a
          href={mention.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-stone-900 transition hover:text-[#C85A3D]"
        >
          {mention.title}
        </a>
        <span className="shrink-0 text-xs text-stone-400">
          {mention.source} · ↑{mention.ups} · {mention.comments} comments
        </span>
      </div>
      {mention.excerpt && <p className="mt-2 text-sm text-stone-500">{mention.excerpt}…</p>}
      <div className="mt-3">
        {draft === null ? (
          <button
            onClick={() => setDraft(draftReply(brand, mention))}
            className="text-sm font-medium text-[#C85A3D] transition hover:text-[#E8795A]"
          >
            Draft a reply ▸
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 p-3 text-sm text-stone-800 outline-none focus:border-[#E8795A]"
            />
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(draft);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-full bg-[#E8795A] px-4 py-1.5 font-medium text-white transition hover:bg-[#DD6B4A]"
              >
                {copied ? "Copied ✓" : "Copy draft"}
              </button>
              <span className="text-xs text-stone-400">Edit before posting — disclosure stays in.</span>
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
      <h2 className="text-sm font-semibold tracking-widest text-stone-400 uppercase">
        Mention watch
      </h2>
      <p className="mt-2 text-sm text-stone-500">
        The threads AI engines learn from. Find where your brand is (or isn&apos;t) in the
        conversation, and draft a disclosed reply.
      </p>
      <form onSubmit={scan} className="mt-4 flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="brand or topic"
          className="flex-1 rounded-full border border-stone-300 bg-white px-5 py-3 text-stone-900 placeholder-stone-400 shadow-sm outline-none transition focus:border-[#E8795A]"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-full border border-[#E8795A]/50 px-5 py-3 font-medium text-[#C85A3D] transition hover:bg-[#E8795A]/10 disabled:opacity-40"
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
            <p className="text-xs text-stone-400">
              {unavailable.join(" and ")} unreachable right now — showing the rest.
            </p>
          )}
          {mentions.length === 0 ? (
            <p className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-600 shadow-sm">
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
    body: "See where your brand shows up in the conversations AI engines learn from — community threads, ranked by impact — and draft a disclosed reply.",
    tag: "Live",
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
      <header className="mt-6 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-6 py-4 shadow-sm">
        <span className="flex items-center gap-2 font-bold tracking-tight text-stone-900">
          <span
            className="inline-block h-5 w-5 rounded-md"
            style={{ background: `linear-gradient(135deg, ${CORAL}, #1c1917)` }}
          />
          Suede Signal
        </span>
        <span className="text-xs text-stone-400">by Suede Labs</span>
      </header>

      <section className="pt-16 pb-12 text-center">
        <span className="inline-block rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-600 shadow-sm">
          <span className="font-semibold text-[#C85A3D]">Free</span> AI search visibility audit
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Become the brand
          <br />
          <span className="text-[#E8795A]">AI recommends</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
          ChatGPT, Claude, and Perplexity are the new front page. Paste your URL and get a graded
          audit in seconds — what the engines can read, what they&apos;ll cite, and exactly what to
          fix.
        </p>
      </section>

      <form onSubmit={audit} className="space-y-3">
        {urls.map((u, i) => (
          <div key={i} className="flex gap-3">
            <input
              value={u}
              onChange={(e) => setUrl(i, e.target.value)}
              placeholder={i === 0 ? "yourdomain.com" : `competitor${i}.com`}
              className="flex-1 rounded-full border border-stone-300 bg-white px-6 py-3.5 text-stone-900 placeholder-stone-400 shadow-sm outline-none transition focus:border-[#E8795A]"
              spellCheck={false}
              autoFocus={i === 0}
            />
            {i === 0 ? (
              <button
                type="submit"
                disabled={loading || filled.length === 0}
                className="rounded-full bg-[#E8795A] px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#DD6B4A] disabled:opacity-40"
              >
                {loading ? "Auditing…" : "Audit"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="rounded-full border border-stone-300 px-4 text-stone-400 transition hover:text-stone-700"
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
            className="text-sm text-stone-500 transition hover:text-[#C85A3D]"
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
        <p className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700">
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
        <>
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
          <MentionWatch brand={hostOf(reports[0].finalUrl)} />
        </>
      )}

      {reports.length === 0 && !loading && (
        <>
          <section className="mt-24">
            <h2 className="text-center text-2xl font-bold text-stone-900">
              The front page moved. Your traffic strategy didn&apos;t.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-stone-600">
              AI engines answer with citations, not ten blue links. They cite sites they can crawl,
              parse, and trust — and skip everyone else. Most sites fail at least one of the three
              without knowing it.
            </p>
          </section>

          <section className="mt-16 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-900">{f.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      f.tag === "Live" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {f.tag}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{f.body}</p>
              </div>
            ))}
          </section>

          <section className="mt-20">
            <h2 className="text-center text-sm font-semibold tracking-widest text-stone-400 uppercase">
              Pricing
            </h2>
            <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-[#E8795A]/40 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-stone-900">Audit</h3>
                <p className="mt-1 text-3xl font-bold text-[#C85A3D]">Free</p>
                <ul className="mt-4 space-y-2 text-sm text-stone-600">
                  <li>Unlimited on-demand audits</li>
                  <li>Competitor comparison</li>
                  <li>Mention watch + reply drafts</li>
                  <li>Nothing stored, no signup</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-stone-900">Watch</h3>
                <p className="mt-1 text-3xl font-bold text-stone-400">Coming soon</p>
                <ul className="mt-4 space-y-2 text-sm text-stone-500">
                  <li>Scheduled re-audits and drift alerts</li>
                  <li>Automated brand mention tracking</li>
                  <li>Visibility history over time</li>
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
                  className="group rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm"
                >
                  <summary className="cursor-pointer list-none font-medium text-stone-900 marker:content-none">
                    <span className="mr-2 inline-block text-stone-400 transition group-open:rotate-90">
                      ▸
                    </span>
                    {f.q}
                  </summary>
                  <p className="mt-3 pl-6 text-sm leading-relaxed text-stone-600">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-3xl bg-stone-900 p-10 text-center">
            <h2 className="text-2xl font-bold text-white">Find out if you&apos;re the answer</h2>
            <p className="mt-2 text-stone-400">Free, instant, nothing stored.</p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-6 rounded-full bg-[#E8795A] px-8 py-3.5 font-semibold text-white transition hover:bg-[#DD6B4A]"
            >
              Run your free audit
            </button>
          </section>
        </>
      )}

      <footer className="mt-24 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        Suede Signal runs read-only checks against your public pages. Nothing is stored.
      </footer>
    </main>
  );
}

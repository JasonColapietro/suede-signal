// The real Mention Watch -> Agent Studio pipeline as it exists today.
// Scanning and posting are still manual — Agent Studio has no node that
// can search social platforms or post to them. Only the draft step is a
// real agent: an actual Claude call in a live Agent Studio flow.

const STEPS = [
  { label: "Scan", detail: "Suede Signal searches Reddit and Hacker News for you, on demand" },
  { label: "Draft", detail: "A real agent in Suede Agent Studio drafts the reply — an actual Claude call, not a template" },
  { label: "Review", detail: "You read it, edit it, add anything only you'd know" },
  { label: "Post", detail: "You paste it in yourself — no auto-poster yet" },
];

export function AgentFlowPreview() {
  return (
    <div>
      {STEPS.map((s, i) => (
        <div key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
          {i < STEPS.length - 1 && (
            <span
              aria-hidden
              className="absolute top-8 left-[15px] h-full w-px bg-border"
            />
          )}
          <span
            className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold ${
              i === 1
                ? "border-accent bg-accent/10 text-accent-strong"
                : "border-border bg-surface text-muted"
            }`}
          >
            {i + 1}
          </span>
          <div>
            <p className="font-medium text-foreground">{s.label}</p>
            <p className="text-sm text-muted">{s.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

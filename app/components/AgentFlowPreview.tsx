// The Mention Watch pipeline, drawn as the agent graph it becomes once
// it's built in Suede Agent Studio — scan, draft, approve, post.

const STEPS = [
  { label: "Scan", detail: "Reddit, X, LinkedIn, Discord — on a schedule, not on demand" },
  { label: "Draft", detail: "Brand-voice reply, disclosure written in by default" },
  { label: "Approve", detail: "Queued for you — nothing posts without a human okay" },
  { label: "Post & track", detail: "Logged with a permalink and fed back into Signal" },
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
              i === 2
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

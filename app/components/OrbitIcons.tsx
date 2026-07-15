// Floating badges around the hero — the layout device crowdreply uses
// for platform logos. Ours name the actual AI crawler user-agents the
// audit checks (real, verifiable), not logos. Full-bleed positioned so
// they sit in the page margins beside the narrow content column, not on
// top of it.

const NODES = [
  { label: "GPTBot", x: 4, y: 12 },
  { label: "Google-Extended", x: 95, y: 10 },
  { label: "ClaudeBot", x: 3, y: 55 },
  { label: "PerplexityBot", x: 96, y: 58 },
];

export function OrbitIcons() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-screen -translate-x-1/2 lg:block"
    >
      {NODES.map((n) => (
        <span
          key={n.label}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-muted shadow-sm"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          {n.label}
        </span>
      ))}
    </div>
  );
}

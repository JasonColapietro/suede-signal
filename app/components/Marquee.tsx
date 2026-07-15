// Auto-scrolling query ticker for the problem section — the layout
// device, filled with our own example prompts.

const QUERIES = [
  "Best AI visibility tool for startups?",
  "Why isn't my site cited in ChatGPT answers?",
  "How do I get into AI Overviews?",
  "Top alternatives to [your competitor]?",
  "What's the best rights registry for musicians?",
  "How do I make my docs citable by Claude?",
];

export function Marquee() {
  const items = [...QUERIES, ...QUERIES];
  return (
    <div className="overflow-hidden border-y border-border py-4">
      <div className="animate-marquee flex w-max gap-3">
        {items.map((q, i) => (
          <span
            key={i}
            className="shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

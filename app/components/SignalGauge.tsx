"use client";

// The signature move: an analog signal-strength meter. Same component
// idles in the hero (needle at rest, "no signal") and reports a real
// score after an audit — the marketing surface literally demos the
// product instead of describing it.

const RADIUS = 82;
const CENTER_X = 100;
const CENTER_Y = 104;
const STROKE = 14;

const BANDS: { from: number; to: number; color: string }[] = [
  { from: 0, to: 50, color: "#ef4444" }, // F
  { from: 50, to: 65, color: "#f97316" }, // D
  { from: 65, to: 80, color: "#f59e0b" }, // C
  { from: 80, to: 90, color: "#a3e635" }, // B
  { from: 90, to: 100, color: "#34d399" }, // A
];

function scoreToAngle(score: number) {
  return 180 - score * 1.8; // score 0 -> 180deg (left), score 100 -> 0deg (right)
}

function polarPoint(angleDeg: number, radius = RADIUS) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(rad),
    y: CENTER_Y - radius * Math.sin(rad),
  };
}

function arcPath(fromScore: number, toScore: number) {
  const start = polarPoint(scoreToAngle(fromScore));
  const end = polarPoint(scoreToAngle(toScore));
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

export function SignalGauge({
  score,
  grade,
  size = 200,
}: {
  score: number | null;
  grade: string | null;
  size?: number;
}) {
  const needleAngle = score === null ? 180 : scoreToAngle(score);
  const needleRotation = 90 - needleAngle;
  const needleColor =
    score === null
      ? "var(--muted)"
      : (BANDS.find((b) => score >= b.from && score <= b.to)?.color ?? "var(--muted)");

  return (
    <div className="relative" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 200 124" className="h-full w-full overflow-visible">
        {BANDS.map((b) => (
          <path
            key={b.from}
            d={arcPath(b.from, b.to)}
            fill="none"
            stroke={b.color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            opacity={score === null ? 0.3 : score >= b.from && score <= b.to ? 1 : 0.3}
            style={{ transition: "opacity 500ms ease" }}
          />
        ))}
        {[0, 50, 65, 80, 90, 100].map((s) => {
          const p1 = polarPoint(scoreToAngle(s), RADIUS - STROKE / 2 - 3);
          const p2 = polarPoint(scoreToAngle(s), RADIUS + STROKE / 2 + 3);
          return (
            <line
              key={s}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="var(--background)"
              strokeWidth={2.5}
            />
          );
        })}
        <g
          style={{
            transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
            transform: `rotate(${needleRotation}deg)`,
            transition: "transform 900ms cubic-bezier(0.16, 1, 0.3, 1), stroke 500ms ease",
          }}
        >
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={CENTER_X}
            y2={CENTER_Y - RADIUS + 8}
            stroke={needleColor}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: "stroke 500ms ease" }}
          />
        </g>
        <circle cx={CENTER_X} cy={CENTER_Y} r={7} fill={needleColor} style={{ transition: "fill 500ms ease" }} />
        <circle cx={CENTER_X} cy={CENTER_Y} r={3} fill="var(--background)" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span
          className="font-mono text-3xl font-bold tabular-nums"
          style={{ color: score === null ? "var(--muted)" : needleColor }}
        >
          {score === null ? "—" : score}
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--muted)]">
          {grade ? `grade ${grade}` : "no signal"}
        </span>
      </div>
    </div>
  );
}

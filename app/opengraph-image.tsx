import { ImageResponse } from "next/og";

export const alt = "Suede Signal — AI-readiness audit for answer engines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #07111f 0%, #0f172a 58%, #164e63 100%)",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 84px",
          width: "100%",
        }}
      >
        <div style={{ color: "#67e8f9", display: "flex", fontSize: 30, fontWeight: 700 }}>
          SUEDE LABS AI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 980 }}>
          <div style={{ display: "flex", fontSize: 86, fontWeight: 750, letterSpacing: "-0.04em" }}>
            Suede Signal
          </div>
          <div style={{ color: "#a5f3fc", display: "flex", fontSize: 42, lineHeight: 1.2 }}>
            See what answer engines can read, what is missing, and exactly what to fix.
          </div>
          <div style={{ color: "#cbd5e1", display: "flex", fontSize: 28 }}>
            Free AI-readiness audit for ChatGPT, Claude, and Perplexity.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

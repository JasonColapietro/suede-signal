import { ImageResponse } from "next/og";

// Static social card, served from a stable path. The opengraph-image file
// convention emits a hashed URL that moves between builds, so an absolute
// reference to it goes stale; a Route Handler keeps the URL fixed.
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#faf9f7",
          color: "#17140f",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 20,
              background: "#ef7a4f",
              marginRight: 16,
            }}
          />
          <div style={{ fontSize: 28, letterSpacing: 2, color: "#6b6459" }}>
            SUEDE SIGNAL
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
            AI-readiness audit
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#dd6538",
            }}
          >
            for answer engines
          </div>
          <div style={{ fontSize: 32, marginTop: 28, color: "#6b6459" }}>
            See what ChatGPT, Claude, and Perplexity can read on your site.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #e7e3dc",
            paddingTop: 28,
            fontSize: 28,
            color: "#6b6459",
          }}
        >
          <div style={{ display: "flex" }}>signal.suedeai.ai</div>
          <div style={{ display: "flex", color: "#dd6538" }}>Free audit</div>
        </div>
      </div>
    ),
    size,
  );
}

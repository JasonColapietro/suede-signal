import type { Metadata } from "next";
import { renderMarkdown } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "API reference — Suede Signal Docs",
  description:
    "HTTP reference for Suede Signal: POST /api/audit for the AI-visibility report and GET /api/mentions for community mention scans.",
  alternates: { canonical: "/docs/api" },
};

const BODY = `
Both features of the site are plain HTTP endpoints. There's no authentication and no API key — the same free, stateless service the UI uses. Please be reasonable: these endpoints fetch third-party sites on demand, so cache on your side and don't hammer them.

## POST /api/audit

Runs the full 26-check audit against one URL and returns the complete report.

\`\`\`bash
curl -s ${SITE_URL}/api/audit \\
  -H "Content-Type: application/json" \\
  -d '{"url": "example.com"}'
\`\`\`

**Request body** — \`{ "url": string }\`. The scheme is optional; \`https://\` is assumed.

**Response 200** — the report:

\`\`\`json
{
  "url": "example.com",
  "finalUrl": "https://example.com/",
  "fetchedAt": "2026-07-18T14:00:00.000Z",
  "grade": "B",
  "score": 84,
  "lanes": [
    {
      "id": "crawler-access",
      "title": "AI Crawler Access",
      "weight": 25,
      "score": 86,
      "checks": [
        {
          "id": "bot-GPTBot",
          "label": "GPTBot allowed",
          "passed": true,
          "detail": "GPTBot can crawl your site."
        }
      ]
    }
  ],
  "topFixes": ["Add /llms.txt: a short markdown file listing your key pages…"]
}
\`\`\`

Failed checks additionally carry a \`fix\` string. Lane \`id\`s are \`crawler-access\`, \`metadata\`, \`schema\`, \`citability\`, and \`trust\`.

**Errors**

- \`400\` — missing or invalid body, or empty \`url\`.
- \`422\` — the target couldn't be audited: unreachable, non-2xx status, or a blocked address (see security notes). The \`error\` field is human-readable.

## GET /api/mentions

Searches Reddit and Hacker News for a brand or topic and returns up to 12 threads ranked by impact (\`ups + 2 × comments\`).

\`\`\`bash
curl -s "${SITE_URL}/api/mentions?q=your%20brand"
\`\`\`

**Response 200**

\`\`\`json
{
  "query": "your brand",
  "mentions": [
    {
      "id": "rd-abc123",
      "title": "Best AI visibility tool for a small team?",
      "source": "r/SaaS",
      "ups": 142,
      "comments": 38,
      "permalink": "https://www.reddit.com/r/SaaS/comments/…",
      "createdUtc": 1750000000,
      "excerpt": "First 200 characters of the post…"
    }
  ],
  "unavailable": []
}
\`\`\`

\`unavailable\` lists sources that couldn't be reached this scan (\`"Reddit"\`, \`"Hacker News"\`). If both are down you get \`502\` with an \`error\` message instead.

**Errors** — \`400\` when \`q\` is missing or empty; \`502\` when both sources are unreachable.

## Behavior & limits

- **Timeouts** — each upstream fetch times out at 10 seconds; whole-request cap is 30 seconds.
- **Redirects** — the auditor follows up to 5 redirects, re-validating every hop.
- **Response cap** — page bodies are read up to 4 MB.
- **SSRF protection** — the auditor resolves every hostname (including each redirect hop) and refuses private, loopback, link-local, and reserved addresses. You cannot point it at internal infrastructure.
- **Statelessness** — nothing about your request is stored. There is no history endpoint; the UI's scan history lives in the browser's localStorage.
- **User agent** — audit fetches identify as \`SuedeSignalAudit/1.0\`.

## What the audit can't see

The auditor reads server-returned HTML. Client-side-rendered content, geo-gated responses, and bot-walled pages will score differently from what a human sees in a browser — which is exactly the visibility problem the audit exists to surface.
`;

export default function ApiPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">API reference</h1>
      <p className="mt-3 text-muted">
        The two endpoints behind the site — free, unauthenticated, stateless.
      </p>
      <div
        className="prose-suede mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(BODY) }}
      />
    </article>
  );
}

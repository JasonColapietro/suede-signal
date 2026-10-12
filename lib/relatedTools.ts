// Sister Suede sites linked from the sitewide footer and llms.txt.
//
// Each name comes from the target's live <title>. Each description is the
// target's live meta description (optimize) or an excerpt of it (seo, perform,
// claude), as served on 2026-10-11 (HTTP 200, no noindex meta, no
// X-Robots-Tag). The href is the canonical URL each site declares.
// Re-check a target live before adding, renaming, or re-describing an entry.

export type RelatedTool = {
  name: string;
  href: string;
  description: string;
};

export const RELATED_SUEDE_TOOLS: readonly RelatedTool[] = [
  {
    name: "Suede Audit",
    href: "https://optimize.suedeai.ai/",
    description:
      "Free AI visibility audit: check crawler access, entity schema, metadata, content structure and answer-engine signals. Get a score and prioritized repairs.",
  },
  {
    name: "Suede AI SEO",
    href: "https://seo.suedeai.ai/",
    description: "GEO and SEO agency in West Palm Beach, FL, run by Jason Colapietro.",
  },
  {
    name: "Suede ACP/x402 Performance Engine",
    href: "https://perform.suedeai.ai",
    description: "Score your ACP/x402 readiness in 60 seconds. Free, no account required.",
  },
  {
    name: "Claude Code Field Notes",
    href: "https://claude.suedeai.ai",
    description:
      "Six lessons from operating 20+ live software surfaces with Claude Code and AI coding agents.",
  },
];

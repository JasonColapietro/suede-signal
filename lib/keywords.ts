// Central keyword map for every indexable page on signal.suedeai.ai.
//
// Each page's `metadata.keywords` comes from here. In Next.js a child route's
// `keywords` replaces the parent's, so every list is complete on its own:
// page terms first, then the brand terms, deduped case-insensitively.
//
// Terms are real search queries matched to what each page covers (sourced
// from the 2026-09-08 keyword research, geo_practice group, plus the page's
// own topic). This file has no imports so the node:test guard can load it.

export const BRAND_KEYWORDS = ["Suede Signal", "Suede AI"] as const;

const PAGE_KEYWORDS: Record<string, readonly string[]> = {
  "/": [
    "AI visibility audit",
    "AI readiness audit",
    "free AI visibility audit",
    "generative engine optimization",
    "answer engine optimization",
    "AI SEO",
    "AI crawler access",
    "llms.txt checker",
    "ChatGPT visibility",
  ],
  "/docs": [
    "Suede Signal documentation",
    "AI visibility audit",
    "AI readiness audit",
    "AI visibility score",
    "generative engine optimization",
  ],
  "/docs/scoring": [
    "AI visibility score",
    "AI readiness score",
    "AI visibility audit methodology",
    "AI crawler access",
    "structured data",
    "citability",
    "trust signals",
  ],
  "/docs/fixes": [
    "robots.txt AI crawlers",
    "llms.txt template",
    "JSON-LD schema",
    "Open Graph metadata",
    "FAQ schema",
    "how to improve AI visibility",
  ],
  "/docs/mention-watch": [
    "brand mention monitoring",
    "Reddit brand mentions",
    "community mentions",
    "AI brand visibility",
    "AI reputation management",
  ],
  "/docs/api": [
    "AI visibility audit API",
    "website audit API",
    "brand mentions API",
    "AI readiness audit",
  ],
  "/docs/faq": [
    "AI visibility audit FAQ",
    "generative engine optimization",
    "GEO vs SEO",
    "answer engine optimization",
    "llms.txt",
  ],
  "/articles": [
    "AI visibility guides",
    "generative engine optimization",
    "llms.txt",
    "AI crawlers",
    "JSON-LD",
    "GEO vs SEO",
  ],
  "/articles/what-is-llms-txt": [
    "llms.txt",
    "what is llms.txt",
    "llms.txt example",
    "llms.txt template",
    "AI crawlers",
  ],
  "/articles/which-ai-crawlers-to-allow": [
    "AI crawlers",
    "robots.txt AI crawlers",
    "GPTBot",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
    "block AI training",
  ],
  "/articles/json-ld-for-ai-visibility": [
    "JSON-LD",
    "structured data",
    "Organization schema",
    "schema markup for AI",
    "AI visibility",
  ],
  "/articles/citable-passages": [
    "citable content",
    "AI citations",
    "answer engine optimization",
    "write for AI answers",
    "generative engine optimization",
  ],
  "/articles/ai-visibility-vs-seo": [
    "GEO vs SEO",
    "AI visibility vs SEO",
    "generative engine optimization",
    "what is GEO",
    "AI search optimization",
  ],
  "/articles/where-ai-engines-learn-about-brands": [
    "AI brand visibility",
    "Reddit brand mentions",
    "community mentions",
    "why does ChatGPT recommend competitors",
    "AI reputation management",
  ],
};

function dedupe(terms: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of terms) {
    const key = term.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(term.trim());
  }
  return out;
}

export const INDEXABLE_ROUTES = Object.keys(PAGE_KEYWORDS);

export function keywordsFor(route: string): string[] {
  const page = PAGE_KEYWORDS[route];
  if (!page) throw new Error(`No keywords mapped for route ${route}`);
  return dedupe([...page, ...BRAND_KEYWORDS]);
}

# Suede Signal

**Become the brand AI recommends.** The Suede take on CrowdReply: a free, instant AI-visibility audit. Paste a URL, get a graded report on how visible the site is to ChatGPT, Claude, Perplexity, and Gemini — and exactly what to fix.

## How it works

One page, one API route, zero LLM calls. `POST /api/audit` fetches the page, `robots.txt`, and `llms.txt`, then runs deterministic checks across five weighted lanes distilled from the Suede audit skill pack (`suede-seo-audit`, `suede-visibility-grader`, `seo-geo`):

| Lane | Weight | Checks |
|---|---|---|
| AI Crawler Access | 25 | GPTBot / ClaudeBot / PerplexityBot / Google-Extended / CCBot allowed, llms.txt present |
| Metadata & Sharing | 20 | Title, meta description, canonical, Open Graph, HTTPS |
| Structured Data | 20 | JSON-LD present, entity schema, FAQ schema |
| Citability | 25 | Single H1, section structure, content depth, lists, question-form headings |
| Trust Signals | 10 | About page, contact route, freshness markup |

Weighted lane scores roll up to an overall 0–100 score and A–F grade, plus a ranked "fix these first" list.

## Run it

```bash
npm install
npm run dev
```

Nothing is stored; all checks are read-only against public pages.

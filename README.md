# Suede Signal

**Become the brand AI recommends.** A free, instant AI-visibility audit. Paste a URL, get a graded report on how visible the site is to ChatGPT, Claude, Perplexity, and Gemini — and exactly what to fix.

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

## Docs & articles

The site ships its own documentation and content sections:

- `/docs` — overview, [scoring methodology](https://suede-signal.vercel.app/docs/scoring), [fix guide](https://suede-signal.vercel.app/docs/fixes), [Mention Watch](https://suede-signal.vercel.app/docs/mention-watch), [API reference](https://suede-signal.vercel.app/docs/api), and [FAQ](https://suede-signal.vercel.app/docs/faq)
- `/articles` — six practitioner guides (llms.txt, AI crawler policy, JSON-LD, citable passages, AI visibility vs SEO, community mentions), stored as markdown in `lib/articles.ts` and rendered server-side
- `/sitemap.xml`, `/robots.txt`, and `/llms.txt` are generated/served so the site passes its own audit

## Run it

```bash
npm install
npm run dev
```

Nothing is stored; all checks are read-only against public pages.

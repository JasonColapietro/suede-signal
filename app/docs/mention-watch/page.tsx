import type { Metadata } from "next";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Mention Watch — Suede Signal Docs",
  description:
    "How Mention Watch finds the community threads AI engines learn from, ranks them by impact, and drafts a disclosed reply you edit before posting.",
  alternates: { canonical: "/docs/mention-watch" },
};

const BODY = `
AI engines don't just read your website — they learn what to recommend from the places people compare tools out loud. Reddit threads and Hacker News discussions show up disproportionately in answers to "best X for Y" questions. Mention Watch tells you where those conversations are happening for your brand or topic, so you can show up in them honestly.

## What does a scan do?

After you run an audit (or from the scan box under any report), enter a brand name or topic and Mention Watch searches:

- **Reddit** — public search across subreddits, past year, sorted by relevance.
- **Hacker News** — the Algolia HN search index across stories and comments.

Results are merged and ranked by impact (upvotes and comment count), and each card links to the live thread. If one source is unreachable, you get the other with a note — no fake results.

## What's in a reply draft?

Every mention card has a "Draft a reply" button. The draft is a template, not AI-generated text, and it's built around three non-negotiables:

1. **Disclosure first.** The draft opens by stating you work on the brand. Undisclosed self-promotion gets deleted by moderators, poisons the thread, and reads as astroturfing to both humans and the models trained on the thread.
2. **Answer the actual question.** The placeholder in the middle is for one honest sentence about what your product does and who it's for — you edit it before posting.
3. **No pressure close.** The draft ends by conceding a different tool might fit better. Because sometimes it does, and saying so is what makes the rest credible.

The draft copies to your clipboard; nothing is ever posted on your behalf.

## Why do community threads matter for AI visibility?

Three reasons, all boring and structural:

- Discussion forums are heavily represented in the corpora models train on.
- Answer engines doing live retrieval favor comparison discussions for recommendation-shaped queries.
- A thread where real users vouch for you is third-party evidence — worth more to an engine (and a human) than anything on your own domain.

If a scan returns nothing for your brand, that's a finding too: the conversations AI learns from don't mention you yet.

## Can I automate the loop?

By hand, the loop is: scan, pick the threads worth joining, draft, edit, post, repeat next week. [Suede Agent Studio](https://agents.suedeai.ai) lets you build the same scan–draft–approve loop as a scheduled agent across more sources (Reddit, X, LinkedIn, Discord), drafting in your brand voice, with every reply queued for your approval before anything posts. Mention Watch is the manual version so you can validate the workflow before automating it.

## Ground rules

- Read the room before posting: subreddit rules on self-promotion vary widely.
- Never remove the disclosure line from a draft.
- Reply where you genuinely add information; skip threads where you'd just be advertising.
- Quality over volume — one useful, disclosed reply a week beats ten drive-bys that get you banned.
`;

export default function MentionWatchPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Mention Watch</h1>
      <p className="mt-3 text-muted">
        Find the threads AI engines learn from, and join them with disclosure built in.
      </p>
      <div
        className="prose-suede mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(BODY) }}
      />
    </article>
  );
}

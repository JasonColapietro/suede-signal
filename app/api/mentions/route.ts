import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export type Mention = {
  id: string;
  title: string;
  source: string; // e.g. "r/SEO" or "Hacker News"
  ups: number;
  comments: number;
  permalink: string;
  createdUtc: number;
  excerpt: string;
};

type RedditChild = {
  data: {
    id: string;
    title: string;
    subreddit: string;
    ups: number;
    num_comments: number;
    permalink: string;
    created_utc: number;
    selftext?: string;
  };
};

type HnHit = {
  objectID: string;
  title: string | null;
  story_title: string | null;
  points: number | null;
  num_comments: number | null;
  created_at_i: number;
  story_text: string | null;
  comment_text: string | null;
  url: string | null;
};

async function fetchJson(url: string, headers: Record<string, string>, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function searchReddit(q: string): Promise<Mention[] | null> {
  const json = await fetchJson(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&t=year&limit=25`,
    { "User-Agent": "web:suede-signal:1.0 (AI visibility audit; by Suede Labs)", Accept: "application/json" }
  );
  if (!json?.data?.children) return null;
  return (json.data.children as RedditChild[]).map((c) => ({
    id: `rd-${c.data.id}`,
    title: c.data.title,
    source: `r/${c.data.subreddit}`,
    ups: c.data.ups ?? 0,
    comments: c.data.num_comments ?? 0,
    permalink: `https://www.reddit.com${c.data.permalink}`,
    createdUtc: c.data.created_utc,
    excerpt: (c.data.selftext || "").replace(/\s+/g, " ").slice(0, 200),
  }));
}

async function searchHackerNews(q: string): Promise<Mention[] | null> {
  const json = await fetchJson(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&hitsPerPage=25`,
    { Accept: "application/json" }
  );
  if (!json?.hits) return null;
  return (json.hits as HnHit[])
    .filter((h) => h.title || h.story_title)
    .map((h) => ({
      id: `hn-${h.objectID}`,
      title: (h.title || h.story_title) as string,
      source: "Hacker News",
      ups: h.points ?? 0,
      comments: h.num_comments ?? 0,
      permalink: `https://news.ycombinator.com/item?id=${h.objectID}`,
      createdUtc: h.created_at_i,
      excerpt: (h.story_text || h.comment_text || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 200),
    }));
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query." }, { status: 400 });
  }

  const [reddit, hn] = await Promise.all([searchReddit(q), searchHackerNews(q)]);
  const unavailable = [reddit === null && "Reddit", hn === null && "Hacker News"].filter(
    Boolean
  ) as string[];

  const mentions = [...(reddit ?? []), ...(hn ?? [])]
    // impact = engagement AI browsing/training is likely to surface
    .sort((a, b) => b.ups + b.comments * 2 - (a.ups + a.comments * 2))
    .slice(0, 12);

  if (mentions.length === 0 && unavailable.length === 2) {
    return NextResponse.json(
      { error: "Community sources are unreachable right now. Try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ query: q, mentions, unavailable });
}

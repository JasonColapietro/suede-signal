import { marked } from "marked";

// Article bodies live in lib/articles.ts as trusted, repo-committed markdown.
// Rendered server-side only; no user input flows through here.
marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false });
}

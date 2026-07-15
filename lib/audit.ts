// Suede Signal — AI visibility audit engine.
// Deterministic checks distilled from the Suede audit skill lanes
// (suede-seo-audit, suede-visibility-grader, seo-geo). No LLM calls.

import { lookup } from "node:dns/promises";
import net from "node:net";

export type CheckResult = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  fix?: string;
};

export type Lane = {
  id: string;
  title: string;
  weight: number;
  score: number; // 0–100
  checks: CheckResult[];
};

export type AuditReport = {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  grade: string;
  score: number;
  lanes: Lane[];
  topFixes: string[];
};

const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
];

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; SuedeSignalAudit/1.0; +https://suedeai.ai)",
  Accept: "text/html,application/xhtml+xml",
};

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024; // 4MB — plenty for an HTML page, caps abuse

// This tool fetches whatever URL a visitor supplies, server-side. Without
// this check it's an SSRF gadget: an attacker points it at 127.0.0.1, an
// internal service, or a cloud metadata endpoint and reads the response
// back through the audit report. Every hop (including redirects) is
// re-validated against the *resolved* IP, not just the hostname string.
function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateOrReservedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (/^fe[89ab]/.test(lower)) return true; // fe80::/10 link-local
  if (/^f[cd]/.test(lower)) return true; // fc00::/7 unique local
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateOrReservedIPv4(mapped[1]);
  return false;
}

function isPrivateOrReservedIP(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateOrReservedIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateOrReservedIPv6(ip);
  return true; // unrecognized shape — fail closed
}

async function assertPublicHost(hostname: string): Promise<void> {
  const bare = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (bare === "localhost" || bare.endsWith(".localhost")) {
    throw new Error("blocked host");
  }
  const addresses = await lookup(bare, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateOrReservedIP(a.address))) {
    throw new Error("blocked host");
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const decoder = new TextDecoder();
  let received = 0;
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      const keep = Math.max(0, value.byteLength - (received - maxBytes));
      out += decoder.decode(value.subarray(0, keep));
      await reader.cancel().catch(() => {});
      break;
    }
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

async function fetchText(url: string, timeoutMs = 10000): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  let current = url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const parsed = new URL(current);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, status: 0, text: "", finalUrl: current };
      }
      await assertPublicHost(parsed.hostname);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(current, {
          headers: FETCH_HEADERS,
          redirect: "manual",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        current = new URL(location, current).toString();
        continue;
      }

      const text = await readCapped(res, MAX_RESPONSE_BYTES);
      return { ok: res.ok, status: res.status, text, finalUrl: current };
    }
    return { ok: false, status: 0, text: "", finalUrl: current };
  } catch {
    return { ok: false, status: 0, text: "", finalUrl: current };
  }
}

function extract(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function extractAll(html: string, re: RegExp): string[] {
  return [...html.matchAll(re)].map((m) => m[1]);
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function laneScore(checks: CheckResult[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
}

// ---- Lanes ----------------------------------------------------------------

function auditCrawlerAccess(robotsTxt: string | null, llmsTxtFound: boolean): Lane {
  const checks: CheckResult[] = [];

  if (robotsTxt === null) {
    checks.push({
      id: "robots-missing",
      label: "robots.txt reachable",
      passed: true, // no robots.txt = everything allowed; not a block
      detail: "No robots.txt found — all crawlers allowed by default.",
    });
  } else {
    for (const bot of AI_CRAWLERS) {
      // blocked if a User-agent section naming this bot (or *) contains Disallow: /
      const blocked = isBotBlocked(robotsTxt, bot);
      checks.push({
        id: `bot-${bot}`,
        label: `${bot} allowed`,
        passed: !blocked,
        detail: blocked
          ? `${bot} is disallowed in robots.txt — this AI engine cannot read your site.`
          : `${bot} can crawl your site.`,
        fix: blocked
          ? `Remove the Disallow rule for ${bot} in robots.txt so AI engines can cite you.`
          : undefined,
      });
    }
  }

  checks.push({
    id: "llms-txt",
    label: "llms.txt present",
    passed: llmsTxtFound,
    detail: llmsTxtFound
      ? "llms.txt found — AI engines get a curated map of your site."
      : "No llms.txt — AI engines have no curated guide to your content.",
    fix: llmsTxtFound
      ? undefined
      : "Add /llms.txt: a short markdown file listing your key pages with one-line descriptions.",
  });

  return {
    id: "crawler-access",
    title: "AI Crawler Access",
    weight: 25,
    score: laneScore(checks),
    checks,
  };
}

function isBotBlocked(robotsTxt: string, bot: string): boolean {
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.trim());
  let applies = false;
  let blocked = false;
  for (const line of lines) {
    const ua = line.match(/^user-agent:\s*(.+)$/i);
    if (ua) {
      const agent = ua[1].trim().toLowerCase();
      applies = agent === bot.toLowerCase();
      continue;
    }
    if (applies) {
      const dis = line.match(/^disallow:\s*(.*)$/i);
      if (dis && dis[1].trim() === "/") blocked = true;
      const allow = line.match(/^allow:\s*(.*)$/i);
      if (allow && allow[1].trim() === "/") blocked = false;
    }
  }
  return blocked;
}

function auditMetadata(html: string, finalUrl: string): Lane {
  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc =
    extract(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
    extract(html, /<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const ogTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const ogImage = /<meta[^>]+property=["']og:image["']/i.test(html);
  const https = finalUrl.startsWith("https://");

  const checks: CheckResult[] = [
    {
      id: "title",
      label: "Title tag (15–70 chars)",
      passed: !!title && title.length >= 15 && title.length <= 70,
      detail: title ? `"${title}" (${title.length} chars)` : "No <title> tag found.",
      fix:
        !!title && title.length >= 15 && title.length <= 70
          ? undefined
          : "Write a 15–70 character title that names what you do and who it's for.",
    },
    {
      id: "description",
      label: "Meta description (50–160 chars)",
      passed: !!desc && desc.length >= 50 && desc.length <= 160,
      detail: desc ? `${desc.length} chars` : "No meta description found.",
      fix:
        !!desc && desc.length >= 50 && desc.length <= 160
          ? undefined
          : "Add a 50–160 character meta description that answers the query directly — AI engines lift these.",
    },
    {
      id: "canonical",
      label: "Canonical URL",
      passed: canonical,
      detail: canonical ? "Canonical link present." : "No canonical link.",
      fix: canonical ? undefined : "Add <link rel=\"canonical\"> so citations consolidate to one URL.",
    },
    {
      id: "og",
      label: "Open Graph tags",
      passed: ogTitle && ogImage,
      detail:
        ogTitle && ogImage
          ? "og:title and og:image present."
          : `Missing ${[!ogTitle && "og:title", !ogImage && "og:image"].filter(Boolean).join(", ")}.`,
      fix: ogTitle && ogImage ? undefined : "Add og:title and og:image so shared citations render rich previews.",
    },
    {
      id: "https",
      label: "Served over HTTPS",
      passed: https,
      detail: https ? "HTTPS in use." : "Page resolves over HTTP.",
      fix: https ? undefined : "Serve the site over HTTPS — AI engines deprioritize insecure sources.",
    },
  ];

  return { id: "metadata", title: "Metadata & Sharing", weight: 20, score: laneScore(checks), checks };
}

function auditSchema(html: string): Lane {
  const blocks = extractAll(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const types: string[] = [];
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b);
      const collect = (node: unknown) => {
        if (Array.isArray(node)) node.forEach(collect);
        else if (node && typeof node === "object") {
          const t = (node as Record<string, unknown>)["@type"];
          if (typeof t === "string") types.push(t);
          if (Array.isArray(t)) types.push(...t.filter((x): x is string => typeof x === "string"));
          const g = (node as Record<string, unknown>)["@graph"];
          if (g) collect(g);
        }
      };
      collect(parsed);
    } catch {
      /* invalid JSON-LD counted below */
    }
  }
  const hasFaq = types.some((t) => /faq/i.test(t));
  const hasOrgOrPerson = types.some((t) => /organization|person|localbusiness/i.test(t));

  const checks: CheckResult[] = [
    {
      id: "jsonld",
      label: "JSON-LD structured data",
      passed: blocks.length > 0 && types.length > 0,
      detail:
        types.length > 0
          ? `Found: ${[...new Set(types)].slice(0, 6).join(", ")}`
          : "No valid JSON-LD found.",
      fix:
        types.length > 0
          ? undefined
          : "Add JSON-LD (Organization + WebSite at minimum) — structured data is how AI engines verify who you are.",
    },
    {
      id: "entity",
      label: "Entity schema (Organization/Person)",
      passed: hasOrgOrPerson,
      detail: hasOrgOrPerson ? "Entity schema present." : "No Organization or Person schema.",
      fix: hasOrgOrPerson ? undefined : "Add Organization schema with name, url, logo, and sameAs links to your profiles.",
    },
    {
      id: "faq",
      label: "FAQ schema",
      passed: hasFaq,
      detail: hasFaq ? "FAQPage schema present." : "No FAQ schema.",
      fix: hasFaq ? undefined : "Add FAQPage schema for your top 3–5 questions — the highest-yield format for AI answers.",
    },
  ];

  return { id: "schema", title: "Structured Data", weight: 20, score: laneScore(checks), checks };
}

function auditCitability(html: string): Lane {
  const h1s = extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2Count = (html.match(/<h2[\b\s>]/gi) || []).length;
  const text = stripTags(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasLists = /<(ul|ol)[\s>]/i.test(html);
  const questionHeadings = extractAll(html, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi).filter((h) =>
    /\?|how |what |why |when |which /i.test(stripTags(h))
  );

  const checks: CheckResult[] = [
    {
      id: "h1",
      label: "Single clear H1",
      passed: h1s.length === 1,
      detail: h1s.length === 1 ? `"${stripTags(h1s[0]).slice(0, 80)}"` : `${h1s.length} H1 tags found.`,
      fix: h1s.length === 1 ? undefined : "Use exactly one H1 that states the page's answer in plain language.",
    },
    {
      id: "structure",
      label: "Section structure (2+ H2s)",
      passed: h2Count >= 2,
      detail: `${h2Count} H2 headings.`,
      fix: h2Count >= 2 ? undefined : "Break content into H2 sections — AI engines cite passages, and passages need boundaries.",
    },
    {
      id: "depth",
      label: "Content depth (300+ words)",
      passed: wordCount >= 300,
      detail: `~${wordCount} words of visible text.`,
      fix: wordCount >= 300 ? undefined : "Thin pages don't get cited. Add substantive, specific content.",
    },
    {
      id: "scannable",
      label: "Lists or tables present",
      passed: hasLists,
      detail: hasLists ? "Scannable structures found." : "No lists or tables.",
      fix: hasLists ? undefined : "Convert key points to bullet lists — the format AI answers extract most often.",
    },
    {
      id: "questions",
      label: "Question-form headings",
      passed: questionHeadings.length >= 1,
      detail: `${questionHeadings.length} headings match question patterns.`,
      fix:
        questionHeadings.length >= 1
          ? undefined
          : "Add headings phrased as the questions users actually ask, each followed by a direct 1–2 sentence answer.",
    },
  ];

  return { id: "citability", title: "Citability", weight: 25, score: laneScore(checks), checks };
}

function auditTrust(html: string): Lane {
  const hasAbout = /href=["'][^"']*\/about/i.test(html);
  const hasContact = /href=["'][^"']*\/contact/i.test(html) || /mailto:/i.test(html);
  const hasDates = /<time[\s>]|datetime=|dateModified|datePublished/i.test(html);

  const checks: CheckResult[] = [
    {
      id: "about",
      label: "About page linked",
      passed: hasAbout,
      detail: hasAbout ? "About link found." : "No /about link found.",
      fix: hasAbout ? undefined : "Link an About page — entity verification is a core AI trust signal.",
    },
    {
      id: "contact",
      label: "Contact method visible",
      passed: hasContact,
      detail: hasContact ? "Contact link or email found." : "No contact link or email found.",
      fix: hasContact ? undefined : "Add a visible contact route (page or email).",
    },
    {
      id: "freshness",
      label: "Dates / freshness signals",
      passed: hasDates,
      detail: hasDates ? "Date markup present." : "No date or freshness markup.",
      fix: hasDates ? undefined : "Add datePublished/dateModified markup — AI engines prefer provably fresh sources.",
    },
  ];

  return { id: "trust", title: "Trust Signals", weight: 10, score: laneScore(checks), checks };
}

// ---- Orchestrator ---------------------------------------------------------

function toGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export async function runAudit(rawUrl: string): Promise<AuditReport> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const parsed = new URL(url); // throws on invalid — caught by the route

  const origin = parsed.origin;
  const [page, robots, llms] = await Promise.all([
    fetchText(url),
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/llms.txt`),
  ]);

  if (!page.ok) {
    throw new Error(
      page.status === 0
        ? `Could not reach ${url} — check the address and try again.`
        : `${url} responded with HTTP ${page.status}.`
    );
  }

  const llmsFound = llms.ok && llms.text.trim().length > 0 && !/<html/i.test(llms.text);
  const robotsTxt = robots.ok ? robots.text : null;

  const lanes = [
    auditCrawlerAccess(robotsTxt, llmsFound),
    auditMetadata(page.text, page.finalUrl),
    auditSchema(page.text),
    auditCitability(page.text),
    auditTrust(page.text),
  ];

  const totalWeight = lanes.reduce((s, l) => s + l.weight, 0);
  const score = Math.round(lanes.reduce((s, l) => s + l.score * l.weight, 0) / totalWeight);

  const topFixes = lanes
    .flatMap((l) => l.checks.filter((c) => !c.passed && c.fix).map((c) => ({ fix: c.fix as string, weight: l.weight })))
    .sort((a, b) => b.weight - a.weight)
    .map((f) => f.fix)
    .slice(0, 5);

  return {
    url: rawUrl,
    finalUrl: page.finalUrl,
    fetchedAt: new Date().toISOString(),
    grade: toGrade(score),
    score,
    lanes,
    topFixes,
  };
}

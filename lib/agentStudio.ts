// Real bridge to Suede Agent Studio (agents.suedeai.ai). Agent Studio has
// no login: every workspace is an unguessable owner UUID, normally minted
// as a browser cookie. We mint one server-side, create a real flow under
// it via Agent Studio's own public API, and hand the UUID back as a
// "workspace key" the user pastes into Agent Studio's existing
// claim-a-workspace box (POST /api/me/claim, wired up on their /flows
// page) to take ownership on their own device.
//
// Agent Studio's node palette has no web-fetch or social-posting node
// today (checked against src/lib/flow/types.ts / nodes/*.ts) — only
// input/output/llm/schedule/branch/subflow plus Suede's own music tools.
// So this creates the real, buildable slice: an input -> llm -> output
// flow that drafts a disclosed reply from real mention content via an
// actual Claude call, not a template string. It does not scan or post to
// anything itself; scanning stays Suede Signal's own Reddit/HN search.

import { randomUUID } from "node:crypto";

const AGENT_STUDIO_BASE = "https://agents.suedeai.ai";

export type MentionSeed = {
  title: string;
  excerpt: string;
  source: string;
};

type FlowGraph = {
  id: string;
  name: string;
  nodes: Array<{
    id: string;
    type: "input" | "llm" | "output";
    params: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  edges: Array<{ id: string; source: string; target: string; targetHandle: string }>;
};

function buildReplyAgentGraph(brand: string, mention: MentionSeed): FlowGraph {
  return {
    id: randomUUID(),
    name: `${brand} — disclosed reply drafter`,
    nodes: [
      {
        id: "n1",
        type: "input",
        params: {
          fields: {
            brand,
            title: mention.title,
            excerpt: mention.excerpt,
            source: mention.source,
          },
        },
        position: { x: 80, y: 120 },
      },
      {
        id: "n2",
        type: "llm",
        params: {
          system:
            "You draft short, honest, disclosure-first replies to online community threads on behalf of a brand. Always open by disclosing you work on the brand. Reference the actual thread topic specifically -- never paste generic boilerplate. 3-5 sentences, no marketing language, no exclamation points, no hype. Explicitly invite questions and say it's fine if a different tool fits better. Output only the reply text, nothing else.",
          prompt:
            "Brand: {{in.brand}}\nCommunity: {{in.source}}\nThread title: {{in.title}}\nThread excerpt: {{in.excerpt}}\n\nDraft the disclosed reply.",
        },
        position: { x: 360, y: 120 },
      },
      {
        id: "n3",
        type: "output",
        params: { label: "Disclosed reply draft" },
        position: { x: 640, y: 120 },
      },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2", targetHandle: "in" },
      { id: "e2", source: "n2", target: "n3", targetHandle: "in" },
    ],
  };
}

export async function createReplyAgentFlow(
  brand: string,
  mention: MentionSeed
): Promise<{ flowId: string; ownerKey: string; flowsUrl: string }> {
  const ownerKey = randomUUID();
  const graph = buildReplyAgentGraph(brand, mention);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${AGENT_STUDIO_BASE}/api/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-owner-id": ownerKey },
      body: JSON.stringify({ name: graph.name, graph }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`Agent Studio returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as { flow?: { id?: string } };
  if (!data.flow?.id) {
    throw new Error("Agent Studio response was missing a flow id.");
  }
  return { flowId: data.flow.id, ownerKey, flowsUrl: `${AGENT_STUDIO_BASE}/flows` };
}

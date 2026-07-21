import { NextRequest, NextResponse } from "next/server";
import { createReplyAgentFlow } from "@/lib/agentStudio";

export const maxDuration = 20;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { brand, mention } = (body ?? {}) as {
    brand?: unknown;
    mention?: { title?: unknown; excerpt?: unknown; source?: unknown };
  };

  if (typeof brand !== "string" || !brand.trim()) {
    return NextResponse.json({ error: "Missing brand." }, { status: 400 });
  }
  if (!mention || typeof mention.title !== "string" || typeof mention.source !== "string") {
    return NextResponse.json({ error: "Missing mention details." }, { status: 400 });
  }

  try {
    const result = await createReplyAgentFlow(brand.trim(), {
      title: mention.title,
      excerpt: typeof mention.excerpt === "string" ? mention.excerpt : "",
      source: mention.source,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create the agent.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

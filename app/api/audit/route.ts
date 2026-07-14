import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "Enter a URL to audit." }, { status: 400 });
  }

  try {
    const report = await runAudit(url);
    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Audit failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ArtifactType } from "@prisma/client";
import { generateArtifact } from "@/lib/pipeline/generate";

type RouteContext = { params: Promise<{ jobId: string }> };

const VALID_TYPES = new Set<string>(["EMAIL_DRAFT", "REFERRAL_REQUEST", "CONNECTION_NOTE"]);

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { jobId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = (body as { type?: unknown })?.type;
  if (typeof type !== "string" || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid artifact type" }, { status: 400 });
  }

  try {
    const result = await generateArtifact(jobId, type as ArtifactType);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = (err as Error).message ?? "Unknown error";
    const status = message.includes("No") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ArtifactType } from "@prisma/client";
import { generateArtifact, JobNotFoundError } from "@/lib/pipeline/generate";
import { getAppUser } from "@/lib/user";

type RouteContext = { params: Promise<{ jobId: string }> };

const VALID_TYPES = new Set<string>(["EMAIL_DRAFT", "REFERRAL_REQUEST", "CONNECTION_NOTE"]);

export async function POST(req: NextRequest, ctx: RouteContext) {
  const [user, { jobId }] = await Promise.all([getAppUser(), ctx.params]);

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
    const result = await generateArtifact(jobId, type as ArtifactType, user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = (err as Error).message ?? "Unknown error";
    const status = err instanceof JobNotFoundError ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

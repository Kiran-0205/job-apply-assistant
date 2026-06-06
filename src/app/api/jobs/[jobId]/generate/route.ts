import { NextRequest, NextResponse } from "next/server";
import { generateArtifacts } from "@/lib/pipeline/generate";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { jobId } = await ctx.params;

  try {
    const result = await generateArtifacts(jobId);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = (err as Error).message ?? "Unknown error";
    const status = message.includes("No") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApplicationStatus, ReferralStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { jobId } = await ctx.params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { artifacts: { orderBy: { createdAt: "desc" } } },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json(job);
}

const PatchSchema = z
  .object({
    applicationStatus: z.nativeEnum(ApplicationStatus).optional(),
    referralStatus: z.nativeEnum(ReferralStatus).optional(),
  })
  .refine((d) => d.applicationStatus !== undefined || d.referralStatus !== undefined, {
    message: "Provide at least one of applicationStatus or referralStatus",
  });

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { jobId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 422 });
  }

  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...(parsed.data.applicationStatus ? { applicationStatus: parsed.data.applicationStatus } : {}),
      ...(parsed.data.referralStatus ? { referralStatus: parsed.data.referralStatus } : {}),
    },
  });

  return NextResponse.json(job);
}

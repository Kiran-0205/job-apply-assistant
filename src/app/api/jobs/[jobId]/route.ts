import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApplicationStatus, ReferralStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppUser } from "@/lib/user";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const [user, { jobId }] = await Promise.all([getAppUser(), ctx.params]);

  // Scoped to the signed-in user — a job id alone must not grant access.
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    include: { artifacts: { orderBy: { createdAt: "desc" } } },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const [user, { jobId }] = await Promise.all([getAppUser(), ctx.params]);

  // deleteMany so the userId filter is part of the delete itself
  const { count } = await prisma.job.deleteMany({ where: { id: jobId, userId: user.id } });
  if (count === 0) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
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
  const [user, { jobId }] = await Promise.all([getAppUser(), ctx.params]);

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

  const { count } = await prisma.job.updateMany({
    where: { id: jobId, userId: user.id },
    data: {
      ...(parsed.data.applicationStatus ? { applicationStatus: parsed.data.applicationStatus } : {}),
      ...(parsed.data.referralStatus ? { referralStatus: parsed.data.referralStatus } : {}),
    },
  });
  if (count === 0) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  return NextResponse.json(job);
}

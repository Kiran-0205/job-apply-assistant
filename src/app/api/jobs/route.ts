import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";
import { ingest } from "@/lib/pipeline/ingest";
import { extractAndStore } from "@/lib/pipeline/extract";
import { prisma } from "@/lib/prisma";

const DEMO_USER_EMAIL = "saikiran@example.com";

export async function GET(req: NextRequest) {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) {
    return NextResponse.json(
      { error: "Demo user not found — run `npm run db:seed` first" },
      { status: 500 }
    );
  }

  const statusParam = req.nextUrl.searchParams.get("status");
  const validStatuses = Object.values(ApplicationStatus);
  const statusFilter =
    statusParam && validStatuses.includes(statusParam as ApplicationStatus)
      ? (statusParam as ApplicationStatus)
      : undefined;

  const jobs = await prisma.job.findMany({
    where: { userId: user.id, ...(statusFilter ? { applicationStatus: statusFilter } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      artifacts: { select: { id: true, type: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(jobs);
}

const BodySchema = z.union([
  z.object({ message: z.string().min(1, "message cannot be empty") }),
  z.object({ url: z.string().url("must be a valid URL") }),
]);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) {
    return NextResponse.json(
      { error: "Demo user not found — run `npm run db:seed` first" },
      { status: 500 }
    );
  }

  let ingested: Awaited<ReturnType<typeof ingest>>;
  try {
    ingested = await ingest(parsed.data);
  } catch (err) {
    return NextResponse.json(
      { error: `Ingest failed: ${(err as Error).message}` },
      { status: 422 }
    );
  }

  let job: Awaited<ReturnType<typeof extractAndStore>>;
  try {
    job = await extractAndStore(
      user.id,
      ingested.source,
      ingested.text,
      "sourceUrl" in ingested ? ingested.sourceUrl : undefined
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Extract failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(job, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";
import { ingest } from "@/lib/pipeline/ingest";
import { extractAndStore } from "@/lib/pipeline/extract";
import { prisma } from "@/lib/prisma";
import { getAppUser } from "@/lib/user";

export async function GET(req: NextRequest) {
  const user = await getAppUser();

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

// A bare URL pasted into the text tab still identifies a posting we may
// already have — treat it the same as the URL tab for duplicate detection.
const BARE_URL_RE = /^https?:\/\/\S+$/i;

function candidateUrl(input: z.infer<typeof BodySchema>): string | null {
  if ("url" in input) return input.url.trim();
  const trimmed = input.message.trim();
  return BARE_URL_RE.test(trimmed) ? trimmed : null;
}

// Re-pasting a link you already saved should land you on the existing job
// instantly instead of re-fetching the page and re-running extraction.
// Trailing slashes are the most common paste variation, so match both forms.
async function findExisting(userId: string, url: string) {
  const variants = [url, url.endsWith("/") ? url.slice(0, -1) : `${url}/`];
  return prisma.job.findFirst({
    where: { userId, sourceUrl: { in: variants } },
    select: { id: true },
  });
}

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

  const user = await getAppUser();

  const url = candidateUrl(parsed.data);
  if (url) {
    const existing = await findExisting(user.id, url);
    if (existing) {
      return NextResponse.json({ id: existing.id, duplicate: true }, { status: 200 });
    }
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

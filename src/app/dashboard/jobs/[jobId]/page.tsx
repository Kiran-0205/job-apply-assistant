import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAppUser } from "@/lib/user";
import { CopyButton } from "@/components/CopyButton";
import { ArtifactSection, type ArtifactItem } from "@/components/ArtifactSection";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { ArtifactType } from "@prisma/client";

const STAMP_STYLES: Record<string, string> = {
  EMAIL: "border-rust text-rust",
  PORTAL: "border-ink text-ink",
  UNKNOWN: "border-ink-soft text-ink-soft",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="font-mono text-xs font-bold text-ink uppercase tracking-[0.3em]">
        {children}
      </h2>
      <div className="w-10 h-0.5 bg-rust mt-2" aria-hidden />
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const user = await getAppUser();
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { artifacts: { orderBy: { createdAt: "desc" } } },
  });

  if (!job) notFound();

  // Group artifacts by type, newest first (job.artifacts is already ordered desc)
  const artifactsByType: Record<ArtifactType, ArtifactItem[]> = {
    EMAIL_DRAFT: [],
    REFERRAL_REQUEST: [],
    CONNECTION_NOTE: [],
  };
  for (const a of job.artifacts) {
    artifactsByType[a.type].push({ id: a.id, content: a.content, createdAt: a.createdAt.toISOString() });
  }

  return (
    <main className="flex-1 px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back + delete */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-rust transition-colors"
          >
            <span aria-hidden>←</span> Back to cases
          </Link>
          <DeleteJobButton jobId={job.id} />
        </div>

        {/* Job header — the case file itself, heaviest object on the page */}
        <div className="bg-cream border-2 border-coal shadow-card-lg">
          <div className="bg-coal px-6 sm:px-7 py-2.5 flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold text-cream uppercase tracking-[0.3em]">
              Case file
            </p>
            <span className="font-mono text-[10px] text-flame uppercase tracking-[0.2em]">
              Confidential
            </span>
          </div>
          <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-2xl font-bold text-ink">
                {job.company ?? "Unknown Company"}
              </h1>
              <p className="text-sm text-ink-soft mt-1">
                {job.title ?? "Unknown role"}
                {job.location ? ` · ${job.location}` : ""}
              </p>
              {job.jdSummary && (
                <p className="text-sm text-ink-soft mt-3 leading-relaxed max-w-prose">{job.jdSummary}</p>
              )}
            </div>
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 border-2 shrink-0 -rotate-3 ${STAMP_STYLES[job.applyMethod]}`}
            >
              {job.applyMethod}
            </span>
          </div>

          {/* Apply info */}
          {job.applyMethod === "PORTAL" && job.portalUrl && (
            <div className="mt-5 pt-5 border-t border-linen text-sm">
              <p className="truncate">
                <span className="text-ink-soft">Apply via </span>
                <a
                  href={job.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rust hover:underline underline-offset-2 font-medium break-all"
                >
                  {job.portalUrl}
                </a>
              </p>
            </div>
          )}
          </div>
        </div>

        {/* Skills & qualifications */}
        {(job.skills.length > 0 || job.qualifications.length > 0) && (
          <div className="bg-cream border border-ink/25 shadow-card p-6 sm:p-7 grid sm:grid-cols-2 gap-6">
            {job.skills.length > 0 && (
              <div>
                <SectionLabel>Key skills</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="font-mono text-[11px] font-bold px-2 py-0.5 border border-ink-soft/50 text-ink"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {job.qualifications.length > 0 && (
              <div>
                <SectionLabel>Qualifications</SectionLabel>
                <ul className="space-y-1.5">
                  {job.qualifications.map((q) => (
                    <li key={q} className="text-sm text-ink-soft leading-snug flex gap-2">
                      <span className="text-rust" aria-hidden>—</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Contact email, when one was found in the posting */}
        {job.contactEmail && (
          <div className="bg-cream border border-ink/25 shadow-card p-6 sm:p-7 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <SectionLabel>Contact email</SectionLabel>
              <p className="font-mono text-sm font-bold text-ink truncate">{job.contactEmail}</p>
            </div>
            <CopyButton text={job.contactEmail} />
          </div>
        )}

        {/* Tailored email */}
        <ArtifactSection
          jobId={job.id}
          type="EMAIL_DRAFT"
          title="Tailored email"
          description="A cold-application email written for this role, ready to send or paste into Gmail."
          buttonLabel="Generate email"
          artifacts={artifactsByType.EMAIL_DRAFT}
          contactEmail={job.contactEmail}
        />

        {/* Referral message */}
        <ArtifactSection
          jobId={job.id}
          type="REFERRAL_REQUEST"
          title="Referral message"
          description="A short message asking a contact at the company for a referral."
          buttonLabel="Generate referral"
          artifacts={artifactsByType.REFERRAL_REQUEST}
          company={job.company}
          school={user.school}
        />

        {/* Connection request note */}
        <ArtifactSection
          jobId={job.id}
          type="CONNECTION_NOTE"
          title="Connection request note"
          description="A LinkedIn connection note (under 300 characters) for someone at the company."
          buttonLabel="Generate note"
          artifacts={artifactsByType.CONNECTION_NOTE}
          company={job.company}
        />
      </div>
    </main>
  );
}

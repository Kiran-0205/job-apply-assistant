import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CopyButton } from "@/components/CopyButton";
import { ArtifactSection, type ArtifactItem } from "@/components/ArtifactSection";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { ArtifactType } from "@prisma/client";

const METHOD_STYLES: Record<string, string> = {
  EMAIL: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  PORTAL: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  UNKNOWN: "bg-stone-100 text-stone-500 ring-1 ring-stone-200",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

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
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <span aria-hidden>←</span> Dashboard
          </Link>
          <DeleteJobButton jobId={job.id} />
        </div>

        {/* Job header */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                {job.title ?? "Unknown role"}
                {job.location ? ` · ${job.location}` : ""}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
                {job.company ?? "Unknown Company"}
              </h1>
              {job.jdSummary && (
                <p className="text-sm text-stone-500 mt-3 leading-relaxed max-w-prose">{job.jdSummary}</p>
              )}
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${METHOD_STYLES[job.applyMethod]}`}
            >
              {job.applyMethod}
            </span>
          </div>

          {/* Apply info */}
          {job.applyMethod === "PORTAL" && job.portalUrl && (
            <div className="mt-5 pt-5 border-t border-stone-100 text-sm">
              <p className="truncate">
                <span className="text-stone-400">Apply via </span>
                <a
                  href={job.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-medium break-all"
                >
                  {job.portalUrl}
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Skills & qualifications */}
        {(job.skills.length > 0 || job.qualifications.length > 0) && (
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 grid sm:grid-cols-2 gap-6">
            {job.skills.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Key skills
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {job.qualifications.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Qualifications
                </h2>
                <ul className="space-y-1.5">
                  {job.qualifications.map((q) => (
                    <li key={q} className="text-sm text-stone-600 leading-snug flex gap-2">
                      <span className="text-stone-300" aria-hidden>·</span>
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
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">
                Contact email
              </h2>
              <p className="text-sm font-medium text-stone-800 truncate">{job.contactEmail}</p>
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

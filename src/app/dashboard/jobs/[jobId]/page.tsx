import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CopyButton } from "@/components/CopyButton";
import { GenerateButton } from "@/components/GenerateButton";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { ArtifactType } from "@prisma/client";

const ARTIFACT_LABELS: Record<ArtifactType, string> = {
  EMAIL_DRAFT: "Email Draft",
  REFERRAL_REQUEST: "Referral Request",
  CONNECTION_NOTE: "LinkedIn Connection Note",
};

const METHOD_STYLES: Record<string, string> = {
  EMAIL: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  PORTAL: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  UNKNOWN: "bg-stone-100 text-stone-500 ring-1 ring-stone-200",
};

function parseEmailArtifact(content: string): { subject: string; body: string } {
  const lines = content.split("\n");
  const subjectLine = lines.find((l) => l.startsWith("Subject:"));
  if (!subjectLine) return { subject: "", body: content };
  const subject = subjectLine.replace(/^Subject:\s*/i, "").trim();
  const body = lines.slice(lines.indexOf(subjectLine) + 1).join("\n").trim();
  return { subject, body };
}

function gmailLink(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ view: "cm", to, su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function linkedinSearch(company: string): string {
  const params = new URLSearchParams({ keywords: company });
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

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

  // Deduplicate artifacts: newest per type
  const latestByType = new Map<ArtifactType, (typeof job.artifacts)[number]>();
  for (const a of job.artifacts) {
    if (!latestByType.has(a.type)) latestByType.set(a.type, a);
  }
  const latest = [...latestByType.values()];

  const emailArtifact = latest.find((a) => a.type === "EMAIL_DRAFT");
  const { subject: emailSubject, body: emailBody } = emailArtifact
    ? parseEmailArtifact(emailArtifact.content)
    : { subject: "", body: "" };

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
          {(job.contactEmail || job.portalUrl) && (
            <div className="mt-5 pt-5 border-t border-stone-100 flex flex-col gap-1.5 text-sm">
              {job.applyMethod === "EMAIL" && job.contactEmail && (
                <p>
                  <span className="text-stone-400">Apply via </span>
                  <a href={`mailto:${job.contactEmail}`} className="text-indigo-600 hover:underline font-medium">
                    {job.contactEmail}
                  </a>
                </p>
              )}
              {job.applyMethod === "PORTAL" && job.portalUrl && (
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
              )}
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

        {/* Generate */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-sm font-semibold text-stone-900">Materials</h2>
            <GenerateButton jobId={job.id} />
          </div>
          <p className="text-xs text-stone-400 mb-5">
            Generates {job.applyMethod === "EMAIL" ? "an email draft" : "a referral request + LinkedIn note"}.
            Previous generations are preserved as history below.
          </p>

          {/* Artifacts */}
          {latest.length === 0 ? (
            <div className="border border-dashed border-stone-200 rounded-xl py-10 text-center">
              <p className="text-sm text-stone-400">No materials yet — click Generate above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latest.map((artifact) => (
                <div key={artifact.id} className="border border-stone-100 rounded-xl p-4 sm:p-5 bg-stone-50/60">
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <h3 className="text-sm font-semibold text-stone-700">
                      {ARTIFACT_LABELS[artifact.type]}
                    </h3>
                    <div className="flex gap-2 shrink-0">
                      <CopyButton text={artifact.content} />
                      {/* Gmail deep-link for email drafts */}
                      {artifact.type === "EMAIL_DRAFT" && job.contactEmail && emailSubject && (
                        <a
                          href={gmailLink(job.contactEmail, emailSubject, emailBody)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          Open in Gmail
                        </a>
                      )}
                      {/* LinkedIn people search for referral requests */}
                      {artifact.type === "REFERRAL_REQUEST" && job.company && (
                        <a
                          href={linkedinSearch(job.company)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium px-2.5 py-1 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          Search on LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans leading-relaxed">
                    {artifact.content}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* History count */}
          {job.artifacts.length > latest.length && (
            <p className="mt-4 text-xs text-stone-400 text-center">
              + {job.artifacts.length - latest.length} older generation(s) stored in the database
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CopyButton } from "@/components/CopyButton";
import { StatusControl } from "@/components/StatusControl";
import { GenerateButton } from "@/components/GenerateButton";
import { ArtifactType, ApplicationStatus, ReferralStatus } from "@prisma/client";

const ARTIFACT_LABELS: Record<ArtifactType, string> = {
  EMAIL_DRAFT: "Email Draft",
  REFERRAL_REQUEST: "Referral Request",
  CONNECTION_NOTE: "LinkedIn Connection Note",
};

const METHOD_COLORS: Record<string, string> = {
  EMAIL: "bg-green-100 text-green-700",
  PORTAL: "bg-blue-100 text-blue-700",
  UNKNOWN: "bg-gray-100 text-gray-600",
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
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          ← Dashboard
        </Link>

        {/* Job header */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {job.company ?? "Unknown Company"}
              </h1>
              <p className="text-zinc-600 mt-0.5">
                {job.title ?? "Unknown Role"}
                {job.location ? ` — ${job.location}` : ""}
              </p>
              {job.jdSummary && (
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{job.jdSummary}</p>
              )}
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${METHOD_COLORS[job.applyMethod]}`}
            >
              {job.applyMethod}
            </span>
          </div>

          {/* Apply info */}
          {job.applyMethod === "EMAIL" && job.contactEmail && (
            <p className="mt-3 text-sm">
              <span className="text-zinc-500">Contact: </span>
              <a href={`mailto:${job.contactEmail}`} className="text-indigo-600 hover:underline">
                {job.contactEmail}
              </a>
            </p>
          )}
          {job.applyMethod === "PORTAL" && job.portalUrl && (
            <p className="mt-3 text-sm">
              <span className="text-zinc-500">Portal: </span>
              <a
                href={job.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline break-all"
              >
                {job.portalUrl}
              </a>
            </p>
          )}
        </div>

        {/* Status control */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Status</h2>
          <StatusControl
            jobId={job.id}
            applicationStatus={job.applicationStatus as ApplicationStatus}
            referralStatus={job.referralStatus as ReferralStatus}
          />
        </div>

        {/* Generate */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-zinc-700">Materials</h2>
            <GenerateButton jobId={job.id} />
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Generates {job.applyMethod === "EMAIL" ? "an email draft" : "a referral request + LinkedIn note"}.
            Previous generations are preserved as history below.
          </p>

          {/* Artifacts */}
          {latest.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">
              No materials yet — click Generate above.
            </p>
          ) : (
            <div className="space-y-5">
              {latest.map((artifact) => (
                <div key={artifact.id} className="border border-zinc-100 rounded-lg p-4 bg-zinc-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-zinc-700">
                      {ARTIFACT_LABELS[artifact.type]}
                    </h3>
                    <div className="flex gap-2">
                      <CopyButton text={artifact.content} />
                      {/* Gmail deep-link for email drafts */}
                      {artifact.type === "EMAIL_DRAFT" && job.contactEmail && emailSubject && (
                        <a
                          href={gmailLink(job.contactEmail, emailSubject, emailBody)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 rounded-md border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
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
                          className="text-xs px-2.5 py-1 rounded-md border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          Search on LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-zinc-800 font-sans leading-relaxed">
                    {artifact.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History count */}
        {job.artifacts.length > latest.length && (
          <p className="text-xs text-zinc-400 text-center">
            + {job.artifacts.length - latest.length} older generation(s) stored in the database
          </p>
        )}
      </div>
    </main>
  );
}

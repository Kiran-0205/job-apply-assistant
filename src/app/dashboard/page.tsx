import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddJobForm } from "@/components/AddJobForm";
import { ApplicationStatus } from "@prisma/client";

const DEMO_USER_EMAIL = "saikiran@example.com";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  DRAFTED: "Drafted",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "bg-gray-100 text-gray-600",
  DRAFTED: "bg-blue-100 text-blue-700",
  APPLIED: "bg-amber-100 text-amber-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  CLOSED: "bg-red-100 text-red-700",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatuses = Object.values(ApplicationStatus);
  const statusFilter =
    status && validStatuses.includes(status as ApplicationStatus)
      ? (status as ApplicationStatus)
      : undefined;

  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  const jobs = user
    ? await prisma.job.findMany({
        where: { userId: user.id, ...(statusFilter ? { applicationStatus: statusFilter } : {}) },
        orderBy: { createdAt: "desc" },
        include: { artifacts: { select: { id: true }, orderBy: { createdAt: "desc" } } },
      })
    : [];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Job Apply Assistant</h1>
          <p className="text-sm text-zinc-500 mt-1">Prepare materials. You act. Nothing is sent automatically.</p>
        </div>

        {/* Add job form */}
        <AddJobForm />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              !statusFilter ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400"
            }`}
          >
            All
          </Link>
          {validStatuses.map((s) => (
            <Link
              key={s}
              href={`/dashboard?status=${s}`}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                statusFilter === s
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        {/* Job list */}
        {jobs.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-12">
            No jobs yet — paste a posting above to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">
                        {job.company ?? "Unknown company"}
                      </p>
                      <p className="text-sm text-zinc-500 truncate mt-0.5">
                        {job.title ?? "Unknown role"}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      {job.jdSummary && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{job.jdSummary}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.applicationStatus]}`}>
                        {STATUS_LABELS[job.applicationStatus]}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {job.applyMethod.toLowerCase()}
                        {job.artifacts.length > 0 ? ` · ${job.artifacts.length} artifacts` : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

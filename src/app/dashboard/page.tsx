import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddJobForm } from "@/components/AddJobForm";
import { DeleteJobIcon } from "@/components/DeleteJobIcon";

const DEMO_USER_EMAIL = "saikiran@example.com";

const METHOD_COLORS: Record<string, string> = {
  EMAIL: "bg-emerald-50 text-emerald-700",
  PORTAL: "bg-blue-50 text-blue-700",
  UNKNOWN: "bg-stone-100 text-stone-500",
};

const AVATAR_PALETTE = [
  "bg-indigo-50 text-indigo-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-600",
  "bg-violet-50 text-violet-600",
  "bg-teal-50 text-teal-600",
];

function avatarStyle(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initial(name: string | null): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value = seconds;
  for (const [size, label] of units) {
    if (value < size) return value < 1 ? "just now" : `${Math.floor(value)}${label} ago`;
    value /= size;
  }
  return "a while ago";
}

export default async function DashboardPage() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  const jobs = user
    ? await prisma.job.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { artifacts: { select: { id: true }, orderBy: { createdAt: "desc" } } },
      })
    : [];

  return (
    <main className="flex-1 px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Add job form */}
        <AddJobForm />

        {/* Search history */}
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Search history
          </h2>

          {jobs.length === 0 ? (
            <div className="border border-dashed border-stone-300 rounded-2xl py-16 text-center">
              <p className="text-sm text-stone-400">No jobs yet — paste a posting above to get started.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {jobs.map((job) => (
                <li key={job.id} className="relative group">
                  <DeleteJobIcon jobId={job.id} />
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex items-start gap-4 bg-white border border-stone-200/80 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-150"
                  >
                    <span
                      className={`grid place-items-center shrink-0 w-10 h-10 rounded-xl text-sm font-semibold ${avatarStyle(
                        job.company ?? job.id
                      )}`}
                    >
                      {initial(job.company)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold text-stone-900 truncate">
                          {job.company ?? "Unknown company"}
                        </p>
                        <span className="text-xs text-stone-400 shrink-0">
                          {relativeTime(job.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 truncate mt-0.5">
                        {job.title ?? "Unknown role"}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      {job.jdSummary && (
                        <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {job.jdSummary}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${METHOD_COLORS[job.applyMethod]}`}>
                          {job.applyMethod.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

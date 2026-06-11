import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAppUser } from "@/lib/user";
import { AddJobForm } from "@/components/AddJobForm";
import { DeleteJobIcon } from "@/components/DeleteJobIcon";

const JOB_SITES = [
  { name: "LinkedIn",    url: "https://www.linkedin.com/jobs/",        label: "Professional network",   color: "bg-blue-50 text-blue-700" },
  { name: "Indeed",      url: "https://indeed.com",                    label: "Millions of listings",    color: "bg-indigo-50 text-indigo-700" },
  { name: "Naukri",      url: "https://www.naukri.com",                label: "India's top job site",    color: "bg-orange-50 text-orange-700" },
  { name: "Glassdoor",   url: "https://www.glassdoor.com/Job/",        label: "Jobs + reviews",          color: "bg-emerald-50 text-emerald-700" },
  { name: "Wellfound",   url: "https://wellfound.com/jobs",            label: "Startup jobs",            color: "bg-rose-50 text-rose-700" },
  { name: "Internshala", url: "https://internshala.com/jobs",          label: "Freshers & interns",      color: "bg-pink-50 text-pink-700" },
  { name: "HN Jobs",     url: "https://news.ycombinator.com/jobs",     label: "Y Combinator startups",   color: "bg-amber-50 text-amber-700" },
  { name: "Remote OK",   url: "https://remoteok.com",                  label: "Remote-first roles",      color: "bg-green-50 text-green-700" },
  { name: "Foundit",     url: "https://www.foundit.in",                label: "Jobs in India",           color: "bg-red-50 text-red-700" },
  { name: "WWR",         url: "https://weworkremotely.com",            label: "We Work Remotely",        color: "bg-lime-50 text-lime-700" },
  { name: "Instahyre",   url: "https://www.instahyre.com",             label: "Tech hiring platform",    color: "bg-violet-50 text-violet-700" },
  { name: "Shine",       url: "https://www.shine.com",                 label: "India professionals",     color: "bg-sky-50 text-sky-700" },
];

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
  const user = await getAppUser();
  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { artifacts: { select: { id: true }, orderBy: { createdAt: "desc" } } },
  });

  return (
    <main className="flex-1 px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_256px] lg:gap-8 lg:items-start">

        {/* ── Left column: form + history ── */}
        <div className="space-y-10">
          <AddJobForm />

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

        {/* ── Right column: job boards ── */}
        <aside className="mt-10 lg:mt-0 lg:sticky lg:top-20">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-4">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Job boards
            </h2>
            <ul className="space-y-1">
              {JOB_SITES.map((site) => (
                <li key={site.name}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors group"
                  >
                    <span className={`grid place-items-center shrink-0 w-7 h-7 rounded-lg text-xs font-semibold ${site.color}`}>
                      {site.name[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 group-hover:text-indigo-600 transition-colors leading-tight">
                        {site.name}
                      </p>
                      <p className="text-[11px] text-stone-400 leading-tight truncate">{site.label}</p>
                    </div>
                    <svg className="ml-auto shrink-0 w-3.5 h-3.5 text-stone-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

      </div>
    </main>
  );
}

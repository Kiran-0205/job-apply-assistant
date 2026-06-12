import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAppUser } from "@/lib/user";
import { AddJobForm } from "@/components/AddJobForm";
import { DeleteJobIcon } from "@/components/DeleteJobIcon";
import { MotivationalQuote } from "@/components/MotivationalQuote";

const JOB_SITES = [
  { name: "LinkedIn",    url: "https://www.linkedin.com/jobs/",        label: "Professional network" },
  { name: "Indeed",      url: "https://indeed.com",                    label: "Millions of listings" },
  { name: "Naukri",      url: "https://www.naukri.com",                label: "India's top job site" },
  { name: "Glassdoor",   url: "https://www.glassdoor.com/Job/",        label: "Jobs + reviews" },
  { name: "Wellfound",   url: "https://wellfound.com/jobs",            label: "Startup jobs" },
  { name: "Internshala", url: "https://internshala.com/jobs",          label: "Freshers & interns" },
  { name: "HN Jobs",     url: "https://news.ycombinator.com/jobs",     label: "Y Combinator startups" },
  { name: "Remote OK",   url: "https://remoteok.com",                  label: "Remote-first roles" },
  { name: "Foundit",     url: "https://www.foundit.in",                label: "Jobs in India" },
  { name: "WWR",         url: "https://weworkremotely.com",            label: "We Work Remotely" },
  { name: "Instahyre",   url: "https://www.instahyre.com",             label: "Tech hiring platform" },
  { name: "Shine",       url: "https://www.shine.com",                 label: "India professionals" },
];

const METHOD_DOTS: Record<string, string> = {
  EMAIL: "bg-emerald-500",
  PORTAL: "bg-sky-500",
  UNKNOWN: "bg-zinc-300",
};

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
          <div>
            <MotivationalQuote />
            <div className="mt-4">
              <AddJobForm />
            </div>
          </div>

          <section>
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">Applications</h2>
              {jobs.length > 0 && (
                <span className="text-xs text-zinc-400">{jobs.length}</span>
              )}
            </div>

            {jobs.length === 0 ? (
              <div className="border border-dashed border-zinc-200 rounded-2xl py-16 text-center">
                <p className="text-sm text-zinc-400">
                  No jobs yet — paste a posting above to get started.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {jobs.map((job) => (
                  <li key={job.id} className="relative group">
                    <DeleteJobIcon jobId={job.id} />
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="flex items-start gap-4 bg-white border border-zinc-200/70 rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:border-zinc-300 transition-all duration-200"
                    >
                      <span className="grid place-items-center shrink-0 w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 text-sm font-semibold">
                        {initial(job.company)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-medium text-zinc-900 truncate">
                            {job.company ?? "Unknown company"}
                          </p>
                          <span className="text-xs text-zinc-400 shrink-0">
                            {relativeTime(job.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 truncate mt-0.5">
                          {job.title ?? "Unknown role"}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                        {job.jdSummary && (
                          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {job.jdSummary}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${METHOD_DOTS[job.applyMethod]}`} aria-hidden />
                          <span className="text-xs text-zinc-500 capitalize">
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
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-4 shadow-card">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3 px-2">Job boards</h2>
            <ul className="space-y-0.5">
              {JOB_SITES.map((site) => (
                <li key={site.name}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-700 group-hover:text-indigo-600 transition-colors leading-tight">
                        {site.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-tight truncate mt-0.5">
                        {site.label}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 text-zinc-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-sm" aria-hidden>
                      ↗
                    </span>
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

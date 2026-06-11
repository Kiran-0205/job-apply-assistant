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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="font-mono text-xs font-bold text-ink uppercase tracking-[0.3em]">
        {children}
      </h2>
      <div className="w-10 h-0.5 bg-rust mt-2" aria-hidden />
    </div>
  );
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
            <SectionLabel>Recent Cases</SectionLabel>

            {jobs.length === 0 ? (
              <div className="border-2 border-dashed border-linen py-16 text-center">
                <p className="font-mono text-sm text-ink-soft">
                  No cases on file — paste a posting above to open one.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {jobs.map((job, index) => (
                  <li key={job.id} className="relative group">
                    <DeleteJobIcon jobId={job.id} />
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="block bg-cream border border-ink/25 p-4 sm:p-5 shadow-card hover:border-rust hover:shadow-card-rust hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[11px] font-bold text-rust uppercase tracking-[0.2em]">
                          Case #{String(jobs.length - index).padStart(3, "0")}
                        </span>
                        <span className="font-mono text-[11px] text-ink-soft shrink-0">
                          {relativeTime(job.createdAt)}
                        </span>
                      </div>

                      <p className="font-mono font-bold text-ink truncate mt-1.5">
                        {job.company ?? "Unknown company"}
                      </p>
                      <p className="text-sm text-ink-soft truncate mt-0.5">
                        {job.title ?? "Unknown role"}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      {job.jdSummary && (
                        <p className="text-xs text-ink-soft/80 mt-2 line-clamp-2 leading-relaxed">
                          {job.jdSummary}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-linen/70">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] border border-ink-soft/50 text-ink-soft px-2 py-0.5">
                          {job.applyMethod}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-rust uppercase tracking-[0.18em] group-hover:underline underline-offset-4">
                          View case →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Right column: job boards — dark directory panel ── */}
        <aside className="mt-10 lg:mt-0 lg:sticky lg:top-20">
          <div className="bg-coal p-4 sm:p-5 shadow-panel">
            <div className="mb-4">
              <h2 className="font-mono text-xs font-bold text-cream uppercase tracking-[0.3em]">
                Job Boards
              </h2>
              <div className="w-10 h-0.5 bg-flame mt-2" aria-hidden />
            </div>
            <ul>
              {JOB_SITES.map((site) => (
                <li key={site.name} className="border-b border-cream/10 last:border-b-0">
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-2.5 group"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-cream/90 uppercase tracking-[0.12em] group-hover:text-flame transition-colors leading-tight">
                        {site.name}
                      </p>
                      <p className="text-[11px] text-cream/40 leading-tight truncate mt-0.5">
                        {site.label}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 font-mono text-xs text-cream/25 group-hover:text-flame transition-colors" aria-hidden>
                      →
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

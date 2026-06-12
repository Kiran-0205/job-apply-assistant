// Instant skeleton while the dashboard server-renders, so navigation
// gives immediate feedback instead of a frozen click.
export default function DashboardLoading() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_256px] lg:gap-8 lg:items-start animate-pulse">
        <div className="space-y-10">
          <div>
            <div className="h-[104px] sm:h-[120px] rounded-2xl bg-zinc-200" />
            <div className="mt-4 h-56 rounded-2xl bg-white border border-zinc-200/70" />
          </div>
          <div>
            <div className="h-4 w-28 rounded bg-zinc-200 mb-4" />
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-white border border-zinc-200/70" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 lg:mt-0 h-96 rounded-2xl bg-white border border-zinc-200/70" />
      </div>
    </main>
  );
}

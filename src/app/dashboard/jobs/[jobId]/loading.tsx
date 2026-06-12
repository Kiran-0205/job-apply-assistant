// Instant skeleton while a job's details server-render.
export default function JobLoading() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-zinc-200" />
          <div className="h-7 w-16 rounded-full bg-zinc-200" />
        </div>
        <div className="h-44 rounded-2xl bg-white border border-zinc-200/70" />
        <div className="h-36 rounded-2xl bg-white border border-zinc-200/70" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-white border border-zinc-200/70" />
        ))}
      </div>
    </main>
  );
}

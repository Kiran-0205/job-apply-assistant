// Instant skeleton while the templates form server-renders.
export default function TemplatesLoading() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-zinc-200" />
        <div className="h-[560px] rounded-2xl bg-white border border-zinc-200/70" />
      </div>
    </main>
  );
}

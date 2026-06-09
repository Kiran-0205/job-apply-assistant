"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/generate`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Generation failed");
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {loading ? "Generating…" : "Generate / Regenerate"}
      </button>
      {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

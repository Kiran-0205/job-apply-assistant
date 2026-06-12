"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteJob() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Delete failed");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Delete this job?</span>
        <button
          onClick={deleteJob}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
    >
      Delete
    </button>
  );
}

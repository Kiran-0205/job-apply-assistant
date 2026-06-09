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
        <span className="text-xs text-stone-500">Delete this job?</span>
        <button
          onClick={deleteJob}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-md border border-stone-200 text-stone-500 hover:border-stone-400 transition-colors"
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
      className="text-xs px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
    >
      Delete
    </button>
  );
}

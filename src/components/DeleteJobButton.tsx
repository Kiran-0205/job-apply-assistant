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
        <span className="font-mono text-[11px] text-ink-soft uppercase tracking-[0.1em]">
          Close this case?
        </span>
        <button
          onClick={deleteJob}
          disabled={loading}
          className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 bg-rust text-cream hover:bg-rust-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 border border-ink-soft/50 text-ink-soft hover:border-ink hover:text-ink cursor-pointer transition-colors"
        >
          Cancel
        </button>
        {error && <p className="text-xs text-rust font-medium">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 border border-rust/50 text-rust hover:bg-rust hover:text-cream cursor-pointer transition-colors"
    >
      Delete
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteJobIcon({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (loading) return;
    if (!window.confirm("Delete this job and its generated materials? This can't be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete job"
      title="Delete job"
      className="absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400 shadow-sm opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:border-rose-300 disabled:opacity-50 transition-all text-sm leading-none"
    >
      ×
    </button>
  );
}

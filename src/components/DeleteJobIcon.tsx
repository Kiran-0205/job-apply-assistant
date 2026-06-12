"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function DeleteJobIcon({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  // Cancel if the user clicks anywhere outside the confirm pill
  useEffect(() => {
    if (!confirming) return;
    function onPointerDown(e: PointerEvent) {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [confirming]);

  async function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <>
      {/* × trigger — hidden while confirm pill is showing */}
      <button
        onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
        aria-label="Delete job"
        title="Delete job"
        className={`absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm hover:text-rose-500 hover:border-rose-300 cursor-pointer transition-all text-sm leading-none
          ${confirming ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"}`}
      >
        ×
      </button>

      {/* Inline confirm pill */}
      <div
        ref={pillRef}
        className={`absolute -top-3 -right-1 z-10 flex items-center gap-1 bg-white border border-rose-200 rounded-full pl-2.5 pr-1 py-1 shadow-md transition-all duration-150 origin-right
          ${confirming ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}
      >
        <span className="text-[11px] font-medium text-rose-500 whitespace-nowrap select-none">
          Delete?
        </span>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-full px-2 py-0.5 cursor-pointer transition-colors"
        >
          {loading ? "…" : "Yes"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
          className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 rounded-full px-1.5 py-0.5 cursor-pointer transition-colors"
        >
          No
        </button>
      </div>
    </>
  );
}

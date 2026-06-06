"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "text" | "url";

export function AddJobForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("text");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    setError(null);

    const body = tab === "text" ? { message: value.trim() } : { url: value.trim() };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.push(`/dashboard/jobs/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Add Job</h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(["text", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setValue(""); setError(null); }}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              tab === t
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t === "text" ? "Paste text" : "URL"}
          </button>
        ))}
      </div>

      {tab === "text" ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste the job description here…"
          rows={6}
          required
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://careers.company.com/job/123"
          required
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Extracting…" : "Add Job"}
      </button>
    </form>
  );
}

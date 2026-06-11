"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "text" | "url";

// A pasted value that is just a bare link — used to nudge the user toward the URL tab.
const BARE_URL_RE = /^https?:\/\/\S+$/i;

export function AddJobForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("url");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pastedUrlInText = tab === "text" && BARE_URL_RE.test(value.trim());

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
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Add a posting</h2>
          <p className="text-xs text-stone-400 mt-0.5">Paste the raw text or drop a career-page link — we&apos;ll extract the rest.</p>
        </div>
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {(["text", "url"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setValue(""); setError(null); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                tab === t
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {t === "text" ? "Paste text" : "URL"}
            </button>
          ))}
        </div>
      </div>

      {tab === "text" ? (
        <>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste the job description here…"
            rows={6}
            required
            className="w-full border border-stone-200 rounded-xl p-3.5 text-sm text-stone-800 placeholder:text-stone-400 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-shadow"
          />
          {pastedUrlInText && (
            <p className="mt-2 text-xs text-stone-500">
              That looks like a link.{" "}
              <button
                type="button"
                onClick={() => { setTab("url"); setError(null); }}
                className="font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                Switch to the URL tab
              </button>{" "}
              for better extraction.
            </p>
          )}
        </>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://careers.company.com/job/123"
          required
          className="w-full border border-stone-200 rounded-xl p-3.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-shadow"
        />
      )}

      {error && (
        <p className="mt-2.5 text-sm text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !value.trim() || pastedUrlInText}
        className="mt-3.5 w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {loading ? "Extracting…" : "Add job"}
      </button>
    </form>
  );
}

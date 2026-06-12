"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "text" | "url";

// A pasted value that is just a bare link — used to nudge the user toward the URL tab.
const BARE_URL_RE = /^https?:\/\/\S+$/i;

const FIELD_CLASS =
  "w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-shadow";

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
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-zinc-200/70 rounded-2xl p-5 sm:p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Add a job</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Paste the raw text or drop a career-page link — we&apos;ll extract the rest.
          </p>
        </div>
        <div className="flex gap-0.5 bg-zinc-100 rounded-full p-0.5 shrink-0">
          {(["text", "url"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setValue(""); setError(null); }}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                tab === t
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {t === "text" ? "Text" : "URL"}
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
            className={`${FIELD_CLASS} resize-y`}
          />
          {pastedUrlInText && (
            <p className="mt-2 text-xs text-zinc-500">
              That looks like a link.{" "}
              <button
                type="button"
                onClick={() => { setTab("url"); setError(null); }}
                className="font-medium text-indigo-600 hover:underline underline-offset-2 cursor-pointer"
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
          className={FIELD_CLASS}
        />
      )}

      {error && <p className="mt-2.5 text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !value.trim() || pastedUrlInText}
        className="mt-4 w-full bg-zinc-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? "Extracting…" : "Add job"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "text" | "url";

// A pasted value that is just a bare link — used to nudge the user toward the URL tab.
const BARE_URL_RE = /^https?:\/\/\S+$/i;

const FIELD_CLASS =
  "w-full bg-paper border border-linen p-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust/40 transition-shadow";

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
    <form onSubmit={handleSubmit} className="bg-cream border-2 border-coal shadow-card-lg">
      {/* Title band — like the tab of a file folder. */}
      <div className="flex items-center justify-between gap-3 bg-coal px-5 sm:px-6 py-2.5">
        <h2 className="font-mono text-xs font-bold text-cream uppercase tracking-[0.3em]">
          Open a Case
        </h2>
        <div className="flex border border-cream/30 shrink-0">
          {(["text", "url"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setValue(""); setError(null); }}
              className={`px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                tab === t
                  ? "bg-rust text-cream"
                  : "bg-transparent text-cream/50 hover:text-cream"
              }`}
            >
              {t === "text" ? "Paste text" : "URL"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
      <p className="text-xs text-ink-soft mb-3">
        Paste the raw text or drop a career-page link — we&apos;ll extract the rest.
      </p>

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
            <p className="mt-2 text-xs text-ink-soft">
              That looks like a link.{" "}
              <button
                type="button"
                onClick={() => { setTab("url"); setError(null); }}
                className="font-bold text-rust hover:underline underline-offset-2 cursor-pointer"
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

      {error && (
        <p className="mt-2.5 text-sm text-rust font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !value.trim() || pastedUrlInText}
        className="mt-4 w-full bg-rust text-cream py-2.5 font-mono text-xs font-bold uppercase tracking-[0.25em] hover:bg-rust-dark cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {loading ? "Extracting…" : "File the case"}
      </button>
      </div>
    </form>
  );
}

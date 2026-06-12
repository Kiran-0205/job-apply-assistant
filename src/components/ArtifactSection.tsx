"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArtifactType } from "@prisma/client";
import { CopyButton } from "@/components/CopyButton";

export type ArtifactItem = {
  id: string;
  content: string;
  // Model commentary (placeholders to fill, caveats) — shown apart from the
  // message and never included in what gets copied.
  notes: string | null;
  createdAt: string;
};

function parseEmailArtifact(content: string): { subject: string; body: string } {
  const lines = content.split("\n");
  const subjectLine = lines.find((l) => l.startsWith("Subject:"));
  if (!subjectLine) return { subject: "", body: content };
  const subject = subjectLine.replace(/^Subject:\s*/i, "").trim();
  const body = lines.slice(lines.indexOf(subjectLine) + 1).join("\n").trim();
  return { subject, body };
}

function gmailLink(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ view: "cm", to, su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function linkedinSearch(keywords: string): string {
  const params = new URLSearchParams({ keywords });
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

function formatTimestamp(iso: string): string {
  // Fixed locale avoids server/client hydration mismatches from differing locale settings.
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ACTION_LINK_CLASS =
  "text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-600 bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors shrink-0";

export function ArtifactSection({
  jobId,
  type,
  title,
  description,
  buttonLabel,
  artifacts,
  contactEmail,
  company,
  school,
  autoGenerate = false,
}: {
  jobId: string;
  type: ArtifactType;
  title: string;
  description: string;
  buttonLabel: string;
  artifacts: ArtifactItem[];
  contactEmail?: string | null;
  company?: string | null;
  school?: string | null;
  // Fire a generation on mount when the section is empty — used right after
  // a job is added so materials are ready without any clicking.
  autoGenerate?: boolean;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(artifacts[0]?.id ?? null);

  // When a fresh artifact arrives after a generation, default the picker to it.
  // State is adjusted during render (not in an effect) per React's
  // "you might not need an effect" guidance.
  const latestId = artifacts[0]?.id ?? null;
  const [prevLatestId, setPrevLatestId] = useState(latestId);
  if (latestId !== prevLatestId) {
    setPrevLatestId(latestId);
    setSelectedId(latestId);
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  // Auto-generate once per mount; the ref guards against StrictMode's double
  // effect run. Only fires for empty sections, so a page reload after the
  // artifact has been created won't generate again. Deferred to a microtask
  // so the effect body itself doesn't set state synchronously.
  const autoFired = useRef(false);
  useEffect(() => {
    if (autoGenerate && artifacts.length === 0 && !autoFired.current) {
      autoFired.current = true;
      queueMicrotask(generate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = artifacts.find((a) => a.id === selectedId) ?? artifacts[0] ?? null;

  let extraAction: React.ReactNode = null;
  if (selected) {
    if (type === "EMAIL_DRAFT" && contactEmail) {
      const { subject, body } = parseEmailArtifact(selected.content);
      if (subject) {
        extraAction = (
          <a
            href={gmailLink(contactEmail, subject, body)}
            target="_blank"
            rel="noopener noreferrer"
            className={ACTION_LINK_CLASS}
          >
            Open in Gmail
          </a>
        );
      }
    }
  }

  // Independent of any generated content, so it's available right away.
  // Connection notes are sent to people found the same way referrals are, so
  // both sections get the people-search shortcuts.
  const linkedinAction =
    (type === "REFERRAL_REQUEST" || type === "CONNECTION_NOTE") && company ? (
      <>
        <a
          href={linkedinSearch(company)}
          target="_blank"
          rel="noopener noreferrer"
          className={ACTION_LINK_CLASS}
        >
          Search on LinkedIn
        </a>
        {school && (
          <a
            href={linkedinSearch(`${company} ${school}`)}
            target="_blank"
            rel="noopener noreferrer"
            className={ACTION_LINK_CLASS}
          >
            Find {school} alumni
          </a>
        )}
      </>
    ) : null;

  return (
    <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 sm:p-7 shadow-card">
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {linkedinAction}
          <button
            onClick={generate}
            disabled={generating}
            className="px-3.5 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-full hover:bg-indigo-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 shrink-0"
          >
            {generating ? "Generating…" : buttonLabel}
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-400 mb-5">{description}</p>

      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

      {!selected ? (
        <div className="border border-dashed border-zinc-200 rounded-xl py-10 text-center">
          <p className="text-sm text-zinc-400">
            Nothing generated yet — click {buttonLabel} above.
          </p>
        </div>
      ) : (
        <>
        {selected.notes && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide shrink-0 mt-0.5">
              Note for you
            </span>
            <p className="text-xs text-amber-800 whitespace-pre-wrap leading-relaxed">
              {selected.notes}
            </p>
          </div>
        )}
        <div className="border border-zinc-100 rounded-xl p-4 sm:p-5 bg-zinc-50/70">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            {artifacts.length > 1 ? (
              <select
                value={selected.id}
                onChange={(e) => setSelectedId(e.target.value)}
                className="text-xs font-medium border border-zinc-200 rounded-lg px-2 py-1 bg-white text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {artifacts.map((a, i) => (
                  <option key={a.id} value={a.id}>
                    {i === 0 ? "Latest" : formatTimestamp(a.createdAt)}
                    {i === 0 ? ` · ${formatTimestamp(a.createdAt)}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-zinc-400">{formatTimestamp(selected.createdAt)}</span>
            )}
            <div className="flex gap-2 shrink-0 ml-auto">
              {extraAction}
              <CopyButton text={selected.content} />
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-zinc-700 font-sans leading-relaxed">
            {selected.content}
          </pre>
        </div>
        </>
      )}
    </div>
  );
}

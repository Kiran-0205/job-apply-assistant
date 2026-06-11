"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArtifactType } from "@prisma/client";
import { CopyButton } from "@/components/CopyButton";

export type ArtifactItem = {
  id: string;
  content: string;
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

function linkedinSearch(company: string): string {
  const params = new URLSearchParams({ keywords: company });
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

export function ArtifactSection({
  jobId,
  type,
  title,
  description,
  buttonLabel,
  artifacts,
  contactEmail,
  company,
}: {
  jobId: string;
  type: ArtifactType;
  title: string;
  description: string;
  buttonLabel: string;
  artifacts: ArtifactItem[];
  contactEmail?: string | null;
  company?: string | null;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(artifacts[0]?.id ?? null);

  // When a fresh artifact arrives after a generation, default the picker to it.
  useEffect(() => {
    setSelectedId(artifacts[0]?.id ?? null);
  }, [artifacts.length > 0 ? artifacts[0].id : null]);

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
            className="text-xs font-medium px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            Open in Gmail
          </a>
        );
      }
    }
  }

  // Independent of any generated content, so it's available right away.
  const linkedinAction =
    type === "REFERRAL_REQUEST" && company ? (
      <a
        href={linkedinSearch(company)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium px-2.5 py-1 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shrink-0"
      >
        Search on LinkedIn
      </a>
    ) : null;

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {linkedinAction}
          <button
            onClick={generate}
            disabled={generating}
            className="px-3.5 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 shrink-0"
          >
            {generating ? "Generating…" : buttonLabel}
          </button>
        </div>
      </div>
      <p className="text-xs text-stone-400 mb-5">{description}</p>

      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

      {!selected ? (
        <div className="border border-dashed border-stone-200 rounded-xl py-10 text-center">
          <p className="text-sm text-stone-400">Nothing generated yet — click {buttonLabel} above.</p>
        </div>
      ) : (
        <div className="border border-stone-100 rounded-xl p-4 sm:p-5 bg-stone-50/60">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            {artifacts.length > 1 ? (
              <select
                value={selected.id}
                onChange={(e) => setSelectedId(e.target.value)}
                className="text-xs font-medium border border-stone-200 rounded-md px-2 py-1 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {artifacts.map((a, i) => (
                  <option key={a.id} value={a.id}>
                    {i === 0 ? "Latest" : formatTimestamp(a.createdAt)}
                    {i === 0 ? ` · ${formatTimestamp(a.createdAt)}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-stone-400">{formatTimestamp(selected.createdAt)}</span>
            )}
            <div className="flex gap-2 shrink-0 ml-auto">
              {extraAction}
              <CopyButton text={selected.content} />
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans leading-relaxed">
            {selected.content}
          </pre>
        </div>
      )}
    </div>
  );
}

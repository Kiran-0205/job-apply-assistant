"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ProfileValues = {
  name: string;
  email: string;
  headline: string;
  location: string;
  school: string;
  summary: string;
  skills: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
};

const FIELD_CLASS =
  "w-full bg-paper border border-linen p-3 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust/40 transition-shadow";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-ink">{label}</span>
      {hint && <span className="text-xs text-ink-soft"> · {hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof ProfileValues>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <input
            className={FIELD_CLASS}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email" hint="used to sign off emails">
          <input
            type="email"
            className={FIELD_CLASS}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="jane@example.com"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Headline" hint="one-line positioning">
          <input
            className={FIELD_CLASS}
            value={values.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="Final-year CS student moving into SDE roles"
          />
        </Field>
        <Field label="Location">
          <input
            className={FIELD_CLASS}
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Bengaluru, India"
          />
        </Field>
      </div>

      <Field label="School" hint="used to find alumni at a company for referrals">
        <input
          className={FIELD_CLASS}
          value={values.school}
          onChange={(e) => set("school", e.target.value)}
          placeholder="IIT Guwahati"
        />
      </Field>

      <Field label="Background" hint="education, experience, achievements — the materials are written from this">
        <textarea
          rows={5}
          className={`${FIELD_CLASS} resize-y`}
          value={values.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="B.Tech in Civil Engineering, IIT Guwahati. Software engineering intern at Acme. Codeforces Specialist. Built…"
        />
      </Field>

      <Field label="Skills" hint="comma-separated tech stack / strengths">
        <input
          className={FIELD_CLASS}
          value={values.skills}
          onChange={(e) => set("skills", e.target.value)}
          placeholder="TypeScript, React, Next.js, Node.js, PostgreSQL, system design"
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="GitHub">
          <input
            className={FIELD_CLASS}
            value={values.githubUrl}
            onChange={(e) => set("githubUrl", e.target.value)}
            placeholder="https://github.com/…"
          />
        </Field>
        <Field label="LinkedIn">
          <input
            className={FIELD_CLASS}
            value={values.linkedinUrl}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/…"
          />
        </Field>
        <Field label="Website">
          <input
            className={FIELD_CLASS}
            value={values.websiteUrl}
            onChange={(e) => set("websiteUrl", e.target.value)}
            placeholder="https://…"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-rust font-medium">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-rust text-cream py-2.5 px-5 font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-rust-dark cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="font-mono text-xs font-bold text-rust uppercase tracking-[0.12em]">Saved ✓</span>}
      </div>
    </form>
  );
}

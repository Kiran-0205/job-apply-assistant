"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TemplateValues = {
  emailTemplate: string;
  referralTemplate: string;
  connectionTemplate: string;
};

const FIELD_CLASS =
  "w-full bg-paper border border-linen p-3 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust/40 transition-shadow resize-y";

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

export function TemplatesForm({ initial }: { initial: TemplateValues }) {
  const router = useRouter();
  const [values, setValues] = useState<TemplateValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof TemplateValues>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/templates", {
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
      <Field
        label="Email template"
        hint="starting point for tailored application emails"
      >
        <textarea
          rows={8}
          className={FIELD_CLASS}
          value={values.emailTemplate}
          onChange={(e) => set("emailTemplate", e.target.value)}
          placeholder={
            "Subject: Application for <role> at <company>\n\nHi team,\n\nI'm excited to apply for...\n\nBest,\n<your name>"
          }
        />
      </Field>

      <Field
        label="Referral message template"
        hint="starting point for referral request messages"
      >
        <textarea
          rows={6}
          className={FIELD_CLASS}
          value={values.referralTemplate}
          onChange={(e) => set("referralTemplate", e.target.value)}
          placeholder={
            "Hi <name>,\n\nI hope you're doing well. I'm applying for <role> at <company> and was wondering..."
          }
        />
      </Field>

      <Field
        label="Connection note template"
        hint="starting point for LinkedIn connection requests, under 300 characters"
      >
        <textarea
          rows={4}
          className={FIELD_CLASS}
          value={values.connectionTemplate}
          onChange={(e) => set("connectionTemplate", e.target.value)}
          placeholder={"Hi <name>, I'm interested in <role> at <company> and would love to connect..."}
        />
      </Field>

      {error && <p className="text-sm text-rust font-medium">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-rust text-cream py-2.5 px-5 font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-rust-dark cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {saving ? "Saving…" : "Save templates"}
        </button>
        {saved && <span className="font-mono text-xs font-bold text-rust uppercase tracking-[0.12em]">Saved ✓</span>}
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TemplateValues = {
  emailTemplate: string;
  referralTemplate: string;
  connectionTemplate: string;
};

const FIELD_CLASS =
  "w-full bg-white border border-zinc-200 rounded-xl p-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-shadow resize-y";

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
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      {hint && <span className="text-xs text-zinc-400"> · {hint}</span>}
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

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 text-white py-2.5 px-5 rounded-xl text-sm font-medium hover:bg-indigo-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {saving ? "Saving…" : "Save templates"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
      </div>
    </form>
  );
}

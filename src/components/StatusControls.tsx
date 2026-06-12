"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationStatus, ReferralStatus } from "@prisma/client";

const APPLICATION_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  DRAFTED: "Drafted",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  CLOSED: "Closed",
};

const REFERRAL_LABELS: Record<ReferralStatus, string> = {
  NONE: "Not pursuing",
  TEMPLATE_READY: "Message ready",
  REQUESTED: "Requested",
  RECEIVED: "Received",
};

const SELECT_CLASS =
  "w-full text-sm font-medium border border-zinc-200 rounded-xl px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 cursor-pointer disabled:opacity-50 transition-shadow";

// Two independent pipelines (see schema comments): where the application
// itself stands, and where the referral chase stands.
export function StatusControls({
  jobId,
  applicationStatus,
  referralStatus,
}: {
  jobId: string;
  applicationStatus: ApplicationStatus;
  referralStatus: ReferralStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(patch: {
    applicationStatus?: ApplicationStatus;
    referralStatus?: ReferralStatus;
  }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update status");
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 sm:p-7 shadow-card">
      <h2 className="text-sm font-semibold text-zinc-900 mb-4">Track progress</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Application</span>
          <select
            value={applicationStatus}
            disabled={saving}
            onChange={(e) => update({ applicationStatus: e.target.value as ApplicationStatus })}
            className={SELECT_CLASS}
          >
            {Object.entries(APPLICATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Referral</span>
          <select
            value={referralStatus}
            disabled={saving}
            onChange={(e) => update({ referralStatus: e.target.value as ReferralStatus })}
            className={SELECT_CLASS}
          >
            {Object.entries(REFERRAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

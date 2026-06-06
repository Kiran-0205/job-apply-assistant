"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AppStatus = "SAVED" | "DRAFTED" | "APPLIED" | "INTERVIEW" | "CLOSED";
type RefStatus = "NONE" | "TEMPLATE_READY" | "REQUESTED" | "RECEIVED";

const APP_STATUSES: AppStatus[] = ["SAVED", "DRAFTED", "APPLIED", "INTERVIEW", "CLOSED"];
const REF_STATUSES: RefStatus[] = ["NONE", "TEMPLATE_READY", "REQUESTED", "RECEIVED"];

const APP_LABELS: Record<AppStatus, string> = {
  SAVED: "Saved",
  DRAFTED: "Drafted",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  CLOSED: "Closed",
};

const REF_LABELS: Record<RefStatus, string> = {
  NONE: "No referral",
  TEMPLATE_READY: "Template ready",
  REQUESTED: "Requested",
  RECEIVED: "Received",
};

const APP_COLORS: Record<AppStatus, string> = {
  SAVED: "bg-gray-100 text-gray-700 border-gray-300",
  DRAFTED: "bg-blue-100 text-blue-700 border-blue-300",
  APPLIED: "bg-amber-100 text-amber-700 border-amber-300",
  INTERVIEW: "bg-purple-100 text-purple-700 border-purple-300",
  CLOSED: "bg-red-100 text-red-700 border-red-300",
};

export function StatusControl({
  jobId,
  applicationStatus,
  referralStatus,
}: {
  jobId: string;
  applicationStatus: AppStatus;
  referralStatus: RefStatus;
}) {
  const router = useRouter();
  const [appStatus, setAppStatus] = useState<AppStatus>(applicationStatus);
  const [refStatus, setRefStatus] = useState<RefStatus>(referralStatus);
  const [saving, setSaving] = useState(false);

  async function update(patch: Partial<{ applicationStatus: AppStatus; referralStatus: RefStatus }>) {
    setSaving(true);
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Application Status
        </p>
        <div className="flex flex-wrap gap-2">
          {APP_STATUSES.map((s) => (
            <button
              key={s}
              disabled={saving}
              onClick={() => { setAppStatus(s); update({ applicationStatus: s }); }}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                appStatus === s
                  ? `${APP_COLORS[s]} ring-2 ring-offset-1 ring-current`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {APP_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Referral Status
        </p>
        <div className="flex flex-wrap gap-2">
          {REF_STATUSES.map((s) => (
            <button
              key={s}
              disabled={saving}
              onClick={() => { setRefStatus(s); update({ referralStatus: s }); }}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                refStatus === s
                  ? "bg-green-100 text-green-700 border-green-300 ring-2 ring-offset-1 ring-green-400"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {REF_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

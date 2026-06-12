"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
        copied
          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
          : "border-zinc-200 text-zinc-600 bg-white hover:border-zinc-300 hover:text-zinc-900"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

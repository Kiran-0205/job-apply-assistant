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
      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
        copied
          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
          : "border-stone-200 text-stone-500 bg-white hover:border-stone-300 hover:text-stone-700"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

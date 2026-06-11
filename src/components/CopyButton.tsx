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
      className={`font-mono text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 border cursor-pointer transition-colors ${
        copied
          ? "border-rust text-cream bg-rust"
          : "border-ink-soft/50 text-ink bg-transparent hover:border-rust hover:text-rust"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

// Mindset-shift pairs: a limiting belief, typed out and slashed away, then
// reframed into its confident counterpart.
const QUOTES: [string, string][] = [
  ["I'll apply when I'm ready.", "I'll apply and become ready."],
  ["I'll start once it's perfect.", "I'll start, and improve as I go."],
  ["I need more experience first.", "I'll gain experience by starting."],
  ["I'm not good enough yet.", "I'm good enough to begin."],
];

const TYPE_SPEED = 45;
const PAUSE_AFTER_TYPE = 1500;
const SLASH_DURATION = 650;
// How long the struck-out line stays on screen after the strike lands.
const STRIKE_LINGER = 550;
const REVEAL_DURATION = 700;
const HOLD_DURATION = 4000;

type Phase = "typing" | "pausing" | "slashing" | "revealing" | "holding";

export function MotivationalQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [typed, setTyped] = useState("");

  const [before, after] = QUOTES[quoteIndex];

  // Type out the "before" line one character at a time. The reset happens in
  // the first timer tick rather than synchronously in the effect body, so the
  // effect never sets state directly (react-hooks/set-state-in-effect).
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i === 0) setPhase("typing");
      i++;
      setTyped(before.slice(0, i));
      if (i >= before.length) {
        clearInterval(timer);
        setPhase("pausing");
      }
    }, TYPE_SPEED);

    return () => clearInterval(timer);
  }, [quoteIndex, before]);

  // Drive the rest of the cycle: pause -> slash -> reveal -> hold -> next quote.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    switch (phase) {
      case "pausing":
        timer = setTimeout(() => setPhase("slashing"), PAUSE_AFTER_TYPE);
        break;
      case "slashing":
        timer = setTimeout(() => setPhase("revealing"), SLASH_DURATION + STRIKE_LINGER);
        break;
      case "revealing":
        timer = setTimeout(() => setPhase("holding"), REVEAL_DURATION);
        break;
      case "holding":
        timer = setTimeout(() => setQuoteIndex((i) => (i + 1) % QUOTES.length), HOLD_DURATION);
        break;
    }
    return () => clearTimeout(timer);
  }, [phase]);

  const showBefore = phase !== "holding";
  const showSlash = phase === "slashing" || phase === "revealing";
  const showAfter = phase === "revealing" || phase === "holding";

  return (
    <div
      className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl px-5 py-7 sm:px-8 sm:py-8 overflow-hidden select-none shadow-card"
      aria-hidden="true"
    >
      {/* Soft accent glow in the corner. */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative h-7 sm:h-9 flex items-center justify-center text-center">
        {showBefore && (
          <p
            className={`absolute inset-0 flex items-center justify-center whitespace-nowrap text-sm sm:text-xl md:text-2xl font-semibold tracking-tight transition-opacity duration-300 ${
              phase === "revealing" ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* Wrapping span keeps the strike sized to the text, not the card. */}
            <span
              className={`relative inline-block transition-colors duration-500 ${
                showSlash ? "text-zinc-500" : "text-zinc-100"
              }`}
            >
              {typed}
              {showSlash && (
                <span
                  className="absolute -left-[3%] -right-[3%] top-1/2 h-[0.18em] -translate-y-1/2 bg-rose-500 origin-left rounded-full shadow-[0_0_14px_rgba(244,63,94,0.9)]"
                  style={{
                    animation: `strike-in ${SLASH_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                  }}
                />
              )}
            </span>
            {phase === "typing" && (
              <span
                className="inline-block w-[2px] h-[0.9em] bg-indigo-400 ml-1"
                style={{ animation: "blink-cursor 0.9s steps(1) infinite" }}
              />
            )}
          </p>
        )}
        {showAfter && (
          <p
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-sm sm:text-xl md:text-2xl font-semibold text-indigo-300 tracking-tight"
            style={{ animation: `rise-glow ${REVEAL_DURATION}ms ease-out forwards` }}
          >
            {after}
          </p>
        )}
      </div>
    </div>
  );
}

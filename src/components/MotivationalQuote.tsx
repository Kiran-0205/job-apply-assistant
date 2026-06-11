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
const REVEAL_DURATION = 700;
const HOLD_DURATION = 4000;

type Phase = "typing" | "pausing" | "slashing" | "revealing" | "holding";

export function MotivationalQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [typed, setTyped] = useState("");

  const [before, after] = QUOTES[quoteIndex];

  // Type out the "before" line one character at a time.
  useEffect(() => {
    setTyped("");
    setPhase("typing");

    let i = 0;
    const timer = setInterval(() => {
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
        timer = setTimeout(() => setPhase("revealing"), SLASH_DURATION);
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
      className="relative bg-coal px-5 py-7 sm:px-8 sm:py-8 overflow-hidden select-none shadow-panel"
      aria-hidden="true"
    >
      {/* Corner ticks, like a printed form. */}
      <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-flame" />
      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-flame" />
      <span className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-flame" />
      <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-flame" />

      <div className="relative h-7 sm:h-9 flex items-center justify-center text-center">
        {showBefore && (
          <p
            className={`absolute inset-0 flex items-center justify-center whitespace-nowrap font-mono text-sm sm:text-lg md:text-xl font-bold text-cream transition-opacity duration-300 ${
              phase === "revealing" ? "opacity-0" : "opacity-100"
            }`}
          >
            {typed}
            {phase === "typing" && (
              <span
                className="inline-block w-[2px] h-[0.9em] bg-flame ml-1"
                style={{ animation: "blink-cursor 0.9s steps(1) infinite" }}
              />
            )}
            {showSlash && (
              <span
                className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-flame origin-left shadow-[0_0_12px_rgba(194,85,64,0.7)]"
                style={{ animation: `slash-sweep ${SLASH_DURATION}ms ease-out forwards` }}
              />
            )}
          </p>
        )}
        {showAfter && (
          <p
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap font-mono text-sm sm:text-lg md:text-xl font-bold text-flame"
            style={{ animation: `rise-glow ${REVEAL_DURATION}ms ease-out forwards` }}
          >
            {after}
          </p>
        )}
      </div>
    </div>
  );
}

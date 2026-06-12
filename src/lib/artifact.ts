// Splits raw model output into the send-ready message and any side commentary.
//
// New generations are prompted to use <message>/<notes> tags, but this also
// cleans up untagged output (and artifacts generated before the tags existed):
// leading chatter like "Here's a tailored referral message:" and trailing
// "Note: …" blocks are moved out of the message so only sendable text remains.

const PREAMBLE_RE =
  /^(here('s| is| are)\b|sure[,!.]|certainly[,!.]|of course[,!.]|below (is|are)\b|i('ve| have) (drafted|written|prepared)\b|this is a\b)/i;

const TRAILING_NOTE_RE = /^(\*{0,2}note\b|p\.?s\.?\b|---)/i;

export function splitArtifactContent(content: string): {
  message: string;
  notes: string | null;
} {
  let text = content.trim();

  // Preferred path: explicit tags from the generation prompt.
  const tagged = text.match(/<message>([\s\S]*?)<\/message>/i);
  if (tagged) {
    const noteTag = text.match(/<notes>([\s\S]*?)<\/notes>/i);
    return { message: tagged[1].trim(), notes: noteTag?.[1].trim() || null };
  }

  const notes: string[] = [];

  // Strip a markdown fence wrapping the entire output.
  const fenced = text.match(/^```[a-z]*\n([\s\S]*?)\n```$/i);
  if (fenced) text = fenced[1].trim();

  // Leading chatty intro line ending with ":" (e.g. "Here's a draft you can send:").
  const lines = text.split("\n");
  const first = lines[0]?.trim() ?? "";
  if (PREAMBLE_RE.test(first) && first.endsWith(":")) {
    notes.push(first.replace(/:$/, "."));
    lines.shift();
    text = lines.join("\n").trim();
  }

  // Trailing commentary block: paragraphs starting with "Note", "PS", or a "---" rule.
  const paragraphs = text.split(/\n\s*\n/);
  const trailing: string[] = [];
  while (paragraphs.length > 1 && TRAILING_NOTE_RE.test(paragraphs[paragraphs.length - 1].trim())) {
    trailing.unshift(paragraphs.pop()!.trim().replace(/^---\s*/, ""));
  }
  notes.push(...trailing);
  text = paragraphs.join("\n\n").trim();

  return { message: text, notes: notes.length ? notes.join("\n\n") : null };
}

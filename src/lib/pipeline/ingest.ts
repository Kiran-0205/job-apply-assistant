import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/ssrf";

export type IngestResult =
  | { source: "MESSAGE"; text: string }
  | { source: "URL"; text: string; sourceUrl: string };

// Direct-fetch thresholds: too-short = SPA shell, too-long = leaked JS config blobs
const MIN_DIRECT = 1_500;
const MAX_DIRECT = 50_000;
// Jina threshold: anything under this after cleaning is not a real job description
const MIN_JINA = 300;

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, nav, footer, header").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

// Strip backtick-fenced code blocks and long inline code spans.
// SPA pages (Phenom ATS etc.) embed theme JSON as code spans that eat
// the LLM's 15k-char window before the actual job description.
function cleanMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]{20,}`/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const ERROR_TITLE_RE = /not found|404|error|exception|no job|page unavailable|job closed|expired/i;

// Parse Jina.ai reader response:
// - Returns null if Jina signals a 4xx/5xx via its Warning: header
// - Returns null if the page title or first heading indicates a "not found" / error page
// - Strips the Jina metadata preamble (Title:, URL Source:, Markdown Content:)
//   so it doesn't consume the LLM's context window
function parseJinaResponse(raw: string): string | null {
  // Explicit error signal from Jina
  if (/^Warning:\s+Target URL returned error/m.test(raw)) {
    return null;
  }
  // Catch error pages via the page title Jina reports
  const titleMatch = raw.match(/^Title:\s+(.+)/m);
  if (titleMatch && ERROR_TITLE_RE.test(titleMatch[1])) {
    return null;
  }
  // Extract only the content after "Markdown Content:"
  const match = raw.match(/Markdown Content:\s*\n([\s\S]*)/);
  const content = cleanMarkdown(match ? match[1] : raw);
  // Also reject if the first non-empty line of content is an error heading
  const firstHeading = content.match(/^#+\s+(.+)/m);
  if (firstHeading && ERROR_TITLE_RE.test(firstHeading[1])) {
    return null;
  }
  return content.length >= MIN_JINA ? content : null;
}

async function fetchDirect(url: string): Promise<string | null> {
  try {
    const html = await safeFetch(url, { timeoutMs: 10_000 });
    const text = htmlToText(html);
    if (text.length >= MIN_DIRECT && text.length <= MAX_DIRECT) return text;
    return null;
  } catch {
    return null;
  }
}

async function fetchViaJina(url: string): Promise<string | null> {
  try {
    const raw = await safeFetch(`https://r.jina.ai/${url}`, { timeoutMs: 30_000 });
    return parseJinaResponse(raw);
  } catch {
    return null;
  }
}

// A bare URL pasted into the text tab should go through the same fetch path
// as the URL tab — otherwise the LLM hallucinates from the company name alone.
const BARE_URL_RE = /^https?:\/\/\S+$/i;

async function ingestUrl(url: string): Promise<IngestResult> {
  // Run both in parallel: direct is faster for static pages, Jina handles SPAs.
  // Checking direct first means static pages resolve in ~2s; SPAs fall through
  // to Jina which has been running in parallel and is already partway done.
  const directPromise = fetchDirect(url);
  const jinaPromise = fetchViaJina(url);

  const directText = await directPromise;
  if (directText !== null) {
    return { source: "URL", text: directText, sourceUrl: url };
  }

  const jinaText = await jinaPromise;
  if (jinaText !== null) {
    return { source: "URL", text: jinaText, sourceUrl: url };
  }

  throw new Error(
    "Could not extract content from this page. It may require a login or block automated access. Open the posting, copy its text, and paste that into \"Paste text\" instead."
  );
}

export async function ingest(
  input: { message: string } | { url: string }
): Promise<IngestResult> {
  if ("message" in input) {
    const trimmed = input.message.trim();
    if (BARE_URL_RE.test(trimmed)) {
      return ingestUrl(trimmed);
    }
    return { source: "MESSAGE", text: trimmed };
  }
  return ingestUrl(input.url);
}

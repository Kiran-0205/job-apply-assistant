import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/ssrf";

export type IngestResult =
  | { source: "MESSAGE"; text: string }
  | { source: "URL"; text: string; sourceUrl: string };

// Minimum chars for the direct HTML fetch — a real job description is rarely shorter.
// SPA shells often return 100–500 chars of meta/title text; those fall through to Jina.
const MIN_DIRECT_CONTENT = 1_500;
// If direct-fetched text exceeds this, the page is probably a JS SPA with large
// config/JSON blobs leaked into the body — fall through to Jina.ai instead.
const MAX_DIRECT_CONTENT = 50_000;
// Minimum chars for a Jina.ai result to be considered usable.
const MIN_JINA_CONTENT = 300;

// Strip HTML to plain text using cheerio; preserves whitespace structure
function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  // Remove non-content elements
  $("script, style, noscript, iframe, nav, footer, header").remove();
  // Collapse whitespace
  return $("body").text().replace(/\s+/g, " ").trim();
}

// Some SPA pages (e.g. Microsoft Careers) embed large JSON blobs as inline code
// spans in Jina's markdown output. Stripping them keeps the job content in the
// LLM's 15k-char window.
function cleanJinaMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")   // fenced code blocks
    .replace(/`[^`\n]{20,}`/g, "")    // long inline code spans (skip short ones like URLs)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Jina.ai Reader renders JavaScript-heavy pages and returns clean markdown text.
// Used as a fallback when direct HTML fetch produces sparse content.
async function fetchViaJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const raw = await safeFetch(jinaUrl, { timeoutMs: 30_000 });
  return cleanJinaMarkdown(raw);
}

// A bare link with no surrounding text isn't real JD content — handing it to
// the LLM as "rawText" makes it guess/hallucinate a listing from the company
// name in the URL instead of reading the actual posting. Route it through the
// same fetch-based path as the URL tab so behavior is consistent and honest.
const BARE_URL_RE = /^https?:\/\/\S+$/i;

async function ingestUrl(url: string): Promise<IngestResult> {
  let text: string | null = null;

  // First: try a direct server-side fetch (fast, works for server-rendered pages)
  try {
    const html = await safeFetch(url);
    const extracted = htmlToText(html);
    if (extracted.length >= MIN_DIRECT_CONTENT && extracted.length <= MAX_DIRECT_CONTENT) {
      text = extracted;
    }
    // If extracted is too large the page likely leaked JS config/JSON into body text;
    // fall through to Jina which strips that noise.
  } catch {
    // Direct fetch failed (bot-protection 403, network error, etc.) — fall through to Jina
  }

  // Fallback: Jina.ai Reader renders JS-heavy SPA pages and returns clean text
  if (text === null) {
    try {
      const jinaText = await fetchViaJina(url);
      if (jinaText.length >= MIN_JINA_CONTENT) {
        text = jinaText;
      }
    } catch {
      // Jina also failed — fall through to error
    }
  }

  if (text === null) {
    throw new Error(
      "Could not extract content from this page. It may render with JavaScript or block automated access. Open the posting, copy its text, and paste that into \"Paste text\" instead."
    );
  }

  return { source: "URL", text, sourceUrl: url };
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

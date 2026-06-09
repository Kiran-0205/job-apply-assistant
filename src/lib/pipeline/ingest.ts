import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/ssrf";

export type IngestResult =
  | { source: "MESSAGE"; text: string }
  | { source: "URL"; text: string; sourceUrl: string };

// Strip HTML to plain text using cheerio; preserves whitespace structure
function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  // Remove non-content elements
  $("script, style, noscript, iframe, nav, footer, header").remove();
  // Collapse whitespace
  return $("body").text().replace(/\s+/g, " ").trim();
}

// A bare link with no surrounding text isn't real JD content — handing it to
// the LLM as "rawText" makes it guess/hallucinate a listing from the company
// name in the URL instead of reading the actual posting. Route it through the
// same fetch-based path as the URL tab so behavior is consistent and honest.
const BARE_URL_RE = /^https?:\/\/\S+$/i;

async function ingestUrl(url: string): Promise<IngestResult> {
  const html = await safeFetch(url);
  const text = htmlToText(html);
  if (text.length < 50) {
    // Many career sites (Ashby, and similar React/SPA-based ATS pages) render
    // their content client-side with JavaScript — the raw HTML we fetch is an
    // empty shell, so there's nothing for cheerio to extract. We can't run JS
    // here, so guide the user to the path that always works: paste the text.
    throw new Error(
      "This page renders its content with JavaScript, so we can't read the posting from the URL. Open the posting, copy its text, and paste that into \"Paste text\" instead."
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

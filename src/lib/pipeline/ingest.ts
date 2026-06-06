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

export async function ingest(
  input: { message: string } | { url: string }
): Promise<IngestResult> {
  if ("message" in input) {
    return { source: "MESSAGE", text: input.message.trim() };
  }

  const html = await safeFetch(input.url);
  const text = htmlToText(html);
  if (text.length < 50) {
    throw new Error("Fetched page contains too little text to be a job posting");
  }
  return { source: "URL", text, sourceUrl: input.url };
}

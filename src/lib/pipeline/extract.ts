import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ApplyMethod, JobSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Zod schema for LLM output — validated before any DB write
const ExtractionSchema = z.object({
  company: z.string().nullable(),
  title: z.string().nullable(),
  location: z.string().nullable(),
  jdSummary: z.string().nullable(),
  externalJobId: z.string().nullable(),
  applyMethod: z.enum(["EMAIL", "PORTAL", "UNKNOWN"]),
  contactEmail: z.string().nullable(),
  portalUrl: z.string().nullable(),
  skills: z.array(z.string()),
  qualifications: z.array(z.string()),
});

type Extraction = z.infer<typeof ExtractionSchema>;

const SYSTEM_PROMPT = `You are a job-posting parser. Extract structured fields from job postings.

Return ONLY a valid JSON object with these exact keys (use null for missing fields):
{
  "company": string | null,
  "title": string | null,
  "location": string | null,
  "jdSummary": string | null,            // 2-3 sentence summary of the role
  "externalJobId": string | null,         // the posting's job/requisition ID exactly as printed (e.g. "JR-10293", "R2024-441", "Job ID: 8841"). Look for labels like "Job ID", "Req ID", "Requisition", "Reference". null if none shown
  "applyMethod": "EMAIL" | "PORTAL" | "UNKNOWN",
  "contactEmail": string | null,          // set when applyMethod is EMAIL
  "portalUrl": string | null,            // set when applyMethod is PORTAL
  "skills": string[],                     // concrete technical/professional skills the role calls for, e.g. "TypeScript", "system design", "SQL" — short phrases, no duplicates, [] if none mentioned
  "qualifications": string[]              // required/preferred qualifications, e.g. "3+ years backend experience", "BS in CS or equivalent" — short phrases, [] if none mentioned
}

Rules for applyMethod:
- EMAIL: a contact email address is explicitly present (e.g. "send CV to careers@co.com")
- PORTAL: there is a link to an ATS / careers page to apply through
- UNKNOWN: neither is clear

Return no markdown fences, no explanation — raw JSON only.`;

async function callLLM(jobText: string): Promise<Extraction> {
  const response = await client.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: jobText.slice(0, 15_000),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      // Long skills/qualifications lists were getting truncated at 1024,
      // producing invalid JSON and a failed extraction.
      maxOutputTokens: 2048,
    },
  });

  const rawText = response.text ?? "";

  // Strip any accidental markdown fences
  const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned non-JSON output: ${cleaned.slice(0, 200)}`);
  }

  const result = ExtractionSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`LLM output failed validation: ${result.error.message}`);
  }
  return result.data;
}

export async function extractAndStore(
  userId: string,
  source: "MESSAGE" | "URL",
  text: string,
  sourceUrl?: string
) {
  const extraction = await callLLM(text);

  // When the posting came from a URL, that URL is itself an apply portal.
  // Use it to fill the gaps the LLM leaves: a PORTAL method with no link, or
  // an UNKNOWN method when no contact email was found. This keeps "Apply via"
  // pointing at the link the user pasted instead of showing nothing.
  let applyMethod = extraction.applyMethod;
  let portalUrl = extraction.portalUrl;
  if (source === "URL" && sourceUrl && applyMethod !== "EMAIL") {
    // Always point "Apply via" at the exact link the user pasted, rather than
    // whatever link the LLM happened to pull out of the page body. The only
    // exception is a clear apply-by-email posting, which keeps its address.
    applyMethod = "PORTAL";
    portalUrl = sourceUrl;
  }

  const job = await prisma.job.create({
    data: {
      userId,
      source: source as JobSource,
      rawText: text,
      sourceUrl: sourceUrl ?? null,
      company: extraction.company,
      title: extraction.title,
      location: extraction.location,
      jdSummary: extraction.jdSummary,
      externalJobId: extraction.externalJobId,
      applyMethod: applyMethod as ApplyMethod,
      contactEmail: extraction.contactEmail,
      portalUrl: portalUrl,
      skills: extraction.skills,
      qualifications: extraction.qualifications,
    },
  });

  return job;
}

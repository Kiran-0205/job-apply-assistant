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
  applyMethod: z.enum(["EMAIL", "PORTAL", "UNKNOWN"]),
  contactEmail: z.string().nullable(),
  portalUrl: z.string().nullable(),
});

type Extraction = z.infer<typeof ExtractionSchema>;

const SYSTEM_PROMPT = `You are a job-posting parser. Extract structured fields from job postings.

Return ONLY a valid JSON object with these exact keys (use null for missing fields):
{
  "company": string | null,
  "title": string | null,
  "location": string | null,
  "jdSummary": string | null,            // 2-3 sentence summary of the role
  "applyMethod": "EMAIL" | "PORTAL" | "UNKNOWN",
  "contactEmail": string | null,          // set when applyMethod is EMAIL
  "portalUrl": string | null             // set when applyMethod is PORTAL
}

Rules for applyMethod:
- EMAIL: a contact email address is explicitly present (e.g. "send CV to careers@co.com")
- PORTAL: there is a link to an ATS / careers page to apply through
- UNKNOWN: neither is clear

Return no markdown fences, no explanation — raw JSON only.`;

async function callLLM(jobText: string): Promise<Extraction> {
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: jobText.slice(0, 15_000),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 1024,
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
      applyMethod: extraction.applyMethod as ApplyMethod,
      contactEmail: extraction.contactEmail,
      portalUrl: extraction.portalUrl,
    },
  });

  return job;
}

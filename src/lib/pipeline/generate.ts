import { GoogleGenAI } from "@google/genai";
import { ArtifactType, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { splitArtifactContent } from "@/lib/artifact";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface JobContext {
  id: string;
  company: string | null;
  title: string | null;
  location: string | null;
  jdSummary: string | null;
  applyMethod: string;
  contactEmail: string | null;
  portalUrl: string | null;
  rawText: string;
}

// Render the candidate's saved profile into a bullet block for the prompt.
// Only includes fields the user actually filled in, so empty profiles don't
// inject "null" noise. Returns "" if nothing meaningful is set.
function candidateBlock(user: User): string {
  const lines: string[] = [];
  if (user.name) lines.push(`Name: ${user.name}`);
  if (user.email) lines.push(`Email: ${user.email}`);
  if (user.headline) lines.push(`Headline: ${user.headline}`);
  if (user.location) lines.push(`Location: ${user.location}`);
  if (user.school) lines.push(`School: ${user.school}`);
  if (user.summary) lines.push(`Background: ${user.summary}`);
  if (user.skills) lines.push(`Skills: ${user.skills}`);
  if (user.githubUrl) lines.push(`GitHub: ${user.githubUrl}`);
  if (user.linkedinUrl) lines.push(`LinkedIn: ${user.linkedinUrl}`);
  if (user.websiteUrl) lines.push(`Website: ${user.websiteUrl}`);
  return lines.join("\n");
}

async function llm(system: string, user: string): Promise<string> {
  const response = await client.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: user,
    config: {
      systemInstruction: system,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingBudget: -1 },
    },
  });
  return (response.text ?? "").trim();
}

// When the user has saved a template for this artifact type, ask the model
// to adapt it for this job rather than writing from scratch — preserves the
// candidate's own voice/format.
function templateInstruction(template: string | null): string {
  if (!template?.trim()) return "";
  return `\n\nThe candidate has provided this template as a starting point. Adapt it for this specific job — keep its structure, tone, and format, but tailor the details:\n"""\n${template.trim()}\n"""`;
}

// Strict output contract: the sendable text and any commentary must be
// separable, so the UI can offer copy on exactly what gets sent and nothing else.
const OUTPUT_FORMAT = `

OUTPUT FORMAT (strict):
- Put the exact, ready-to-send text inside <message></message> tags. No preamble like "Here's a draft", no closing remarks — only what the recipient should receive.
- If you have comments for the candidate (placeholders they must fill, caveats, suggestions), put them inside <notes></notes> tags after the message. Omit the tags if you have nothing to add.
- Output nothing outside these tags.`;

function jobContextBlock(job: JobContext): string {
  return `Company: ${job.company ?? "Unknown"}
Role: ${job.title ?? "Unknown"}
Location: ${job.location ?? "Unknown"}
Apply method: ${job.applyMethod}
Contact email: ${job.contactEmail ?? "N/A"}
Portal URL: ${job.portalUrl ?? "N/A"}
JD summary: ${job.jdSummary ?? "N/A"}`;
}

async function generateEmailDraft(job: JobContext, candidate: string, template: string | null): Promise<string> {
  const system = `You are a job application assistant helping a candidate apply for a role.

About the candidate:
${candidate}

Write a concise, professional cold-application email. Guidelines:
- Subject line first, formatted as: Subject: <subject>
- Blank line, then the email body
- 3-4 short paragraphs: hook, why this role, relevant skills/projects, call to action
- Tone: confident and direct, not sycophantic
- End with the candidate's name and contact info
- Do not invent projects or experience not mentioned above${templateInstruction(template)}${OUTPUT_FORMAT}`;

  const user = `Write an application email for this job:

${jobContextBlock(job)}

Full JD (for context):
${job.rawText.slice(0, 8_000)}`;

  return llm(system, user);
}

async function generateReferralRequest(job: JobContext, candidate: string, template: string | null): Promise<string> {
  const system = `You are helping a candidate write a referral request message for a job.

About the candidate:
${candidate}

Write a short, friendly referral request (~150 words). Should:
- Mention the specific role and company
- Briefly say why the candidate is a fit
- Ask directly but politely if the contact would be comfortable referring them
- Offer to share resume
- Not be sycophantic or excessively long${templateInstruction(template)}${OUTPUT_FORMAT}`;

  const user = `Write a referral request message for this job:

${jobContextBlock(job)}`;

  return llm(system, user);
}

async function generateConnectionNote(job: JobContext, candidate: string, template: string | null): Promise<string> {
  const system = `You are helping a candidate write a LinkedIn connection request note.

HARD CONSTRAINT: The note MUST be under 300 characters (LinkedIn's limit). Be direct and personalized.

About the candidate:
${candidate}${templateInstruction(template)}${OUTPUT_FORMAT}`;

  const user = `Write a LinkedIn connection note to someone who works at ${job.company ?? "this company"} for the role of ${job.title ?? "software engineer"}.

Keep it under 300 characters. Mention the role. Be specific, not generic.`;

  return llm(system, user);
}

export type GenerateResult = { id: string; type: ArtifactType; content: string; notes: string | null };

// Each artifact type is generated independently and on demand — the user
// picks which materials they need for a given job, rather than us deciding
// based on applyMethod.
export async function generateArtifact(jobId: string, type: ArtifactType): Promise<GenerateResult> {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { user: true },
  });

  const candidate = candidateBlock(job.user);
  if (!candidate.trim()) {
    throw new Error(
      "Your profile is empty. Add your details on the Profile page so materials can be written for you."
    );
  }

  const ctx: JobContext = {
    id: job.id,
    company: job.company,
    title: job.title,
    location: job.location,
    jdSummary: job.jdSummary,
    applyMethod: job.applyMethod,
    contactEmail: job.contactEmail,
    portalUrl: job.portalUrl,
    rawText: job.rawText,
  };

  let raw: string;
  switch (type) {
    case "EMAIL_DRAFT":
      raw = await generateEmailDraft(ctx, candidate, job.user.emailTemplate);
      break;
    case "REFERRAL_REQUEST":
      raw = await generateReferralRequest(ctx, candidate, job.user.referralTemplate);
      break;
    case "CONNECTION_NOTE":
      raw = await generateConnectionNote(ctx, candidate, job.user.connectionTemplate);
      break;
  }

  // Separate the sendable message from any model commentary, so the stored
  // content is exactly what the user will copy and send.
  const { message, notes } = splitArtifactContent(raw);

  // Append-only: create a new row, never overwrite existing artifacts
  const created = await prisma.generatedArtifact.create({
    data: { type, content: message, notes, jobId: job.id },
  });

  // Bump applicationStatus to DRAFTED if still at SAVED
  if (job.applicationStatus === "SAVED") {
    await prisma.job.update({
      where: { id: job.id },
      data: { applicationStatus: "DRAFTED" },
    });
  }

  return { id: created.id, type: created.type, content: created.content, notes: created.notes };
}

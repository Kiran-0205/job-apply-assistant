import { GoogleGenAI } from "@google/genai";
import { ArtifactType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PROFILE } from "@/lib/profile";

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

async function llm(system: string, user: string): Promise<string> {
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: user,
    config: {
      systemInstruction: system,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingBudget: -1 },
    },
  });
  return (response.text ?? "").trim();
}

function jobContextBlock(job: JobContext): string {
  return `Company: ${job.company ?? "Unknown"}
Role: ${job.title ?? "Unknown"}
Location: ${job.location ?? "Unknown"}
Apply method: ${job.applyMethod}
Contact email: ${job.contactEmail ?? "N/A"}
Portal URL: ${job.portalUrl ?? "N/A"}
JD summary: ${job.jdSummary ?? "N/A"}`;
}

async function generateEmailDraft(job: JobContext): Promise<string> {
  const system = `You are a job application assistant helping ${PROFILE.name} apply for software engineering roles.

About the candidate:
- ${PROFILE.degree}
- ${PROFILE.transition}
- Tech stack: ${PROFILE.stack}
- ${PROFILE.competitive}
- ${PROFILE.experience}
- GitHub: ${PROFILE.github}
- LinkedIn: ${PROFILE.linkedin}

Write a concise, professional cold-application email. Guidelines:
- Subject line first, formatted as: Subject: <subject>
- Blank line, then the email body
- 3-4 short paragraphs: hook, why this role, relevant skills/projects, call to action
- Tone: confident and direct, not sycophantic
- End with the candidate's name and contact info
- Do not invent projects or experience not mentioned above`;

  const user = `Write an application email for this job:

${jobContextBlock(job)}

Full JD (for context):
${job.rawText.slice(0, 8_000)}`;

  return llm(system, user);
}

async function generateReferralRequest(job: JobContext): Promise<string> {
  const system = `You are helping ${PROFILE.name} write a referral request message for a job.

About the candidate:
- ${PROFILE.degree}
- ${PROFILE.transition}
- Tech stack: ${PROFILE.stack}
- ${PROFILE.competitive}
- ${PROFILE.experience}

Write a short, friendly referral request (~150 words). Should:
- Mention the specific role and company
- Briefly say why the candidate is a fit
- Ask directly but politely if the contact would be comfortable referring them
- Offer to share resume
- Not be sycophantic or excessively long`;

  const user = `Write a referral request message for this job:

${jobContextBlock(job)}`;

  return llm(system, user);
}

async function generateConnectionNote(job: JobContext): Promise<string> {
  const system = `You are helping ${PROFILE.name} write a LinkedIn connection request note.

HARD CONSTRAINT: The note MUST be under 300 characters (LinkedIn's limit). Be direct and personalized.

About the candidate:
- ${PROFILE.degree}, transitioning to SDE
- Stack: ${PROFILE.stack}`;

  const user = `Write a LinkedIn connection note to someone who works at ${job.company ?? "this company"} for the role of ${job.title ?? "software engineer"}.

Keep it under 300 characters. Mention the role. Be specific, not generic.`;

  return llm(system, user);
}

export type GenerateResult = {
  artifacts: Array<{ type: ArtifactType; content: string; id: string }>;
};

export async function generateArtifacts(jobId: string): Promise<GenerateResult> {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });

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

  const artifactsToCreate: Array<{ type: ArtifactType; content: string }> = [];

  if (job.applyMethod === "EMAIL") {
    const content = await generateEmailDraft(ctx);
    artifactsToCreate.push({ type: "EMAIL_DRAFT", content });
  } else {
    // PORTAL or UNKNOWN — generate referral + connection note
    const [referral, note] = await Promise.all([
      generateReferralRequest(ctx),
      generateConnectionNote(ctx),
    ]);
    artifactsToCreate.push(
      { type: "REFERRAL_REQUEST", content: referral },
      { type: "CONNECTION_NOTE", content: note }
    );
  }

  // Append-only: create new rows, never overwrite existing artifacts
  const created = await prisma.$transaction(
    artifactsToCreate.map((a) =>
      prisma.generatedArtifact.create({ data: { ...a, jobId: job.id } })
    )
  );

  // Bump applicationStatus to DRAFTED if still at SAVED
  if (job.applicationStatus === "SAVED") {
    await prisma.job.update({
      where: { id: job.id },
      data: { applicationStatus: "DRAFTED" },
    });
  }

  return { artifacts: created.map((a) => ({ type: a.type, content: a.content, id: a.id })) };
}

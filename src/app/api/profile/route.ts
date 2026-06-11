import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppUser } from "@/lib/user";

export async function GET() {
  const user = await getAppUser();
  return NextResponse.json(user);
}

// Every field is optional; an empty string clears the field (stored as null).
const emptyToNull = (s: string) => (s.trim() === "" ? null : s.trim());
const optionalText = z.string().transform(emptyToNull).nullable().optional();

const ProfileSchema = z.object({
  name: optionalText,
  email: z.string().email("must be a valid email").or(z.literal("")).optional(),
  headline: optionalText,
  location: optionalText,
  school: optionalText,
  summary: optionalText,
  skills: optionalText,
  githubUrl: optionalText,
  linkedinUrl: optionalText,
  websiteUrl: optionalText,
});

export async function PUT(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const user = await getAppUser();
  const { email, ...rest } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: user.id },
    // Only overwrite email when a non-empty one was provided — email is required
    // and unique, so we never null it out.
    data: { ...rest, ...(email ? { email } : {}) },
  });

  return NextResponse.json(updated);
}

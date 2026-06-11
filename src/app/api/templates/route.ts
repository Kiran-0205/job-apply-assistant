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

const TemplatesSchema = z.object({
  emailTemplate: optionalText,
  referralTemplate: optionalText,
  connectionTemplate: optionalText,
});

export async function PUT(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = TemplatesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const user = await getAppUser();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

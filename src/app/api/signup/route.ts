import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PLACEHOLDER_EMAIL } from "@/lib/user";

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  // First-ever signup: claim the seeded placeholder user instead of creating
  // a second one, so any existing jobs/profile data carry over.
  const [totalUsers, placeholder] = await Promise.all([
    prisma.user.count(),
    prisma.user.findFirst({
      where: { email: PLACEHOLDER_EMAIL, password: null, accounts: { none: {} } },
    }),
  ]);

  if (totalUsers === 1 && placeholder) {
    await prisma.user.update({
      where: { id: placeholder.id },
      data: { email, name, password: hashed },
    });
  } else {
    await prisma.user.create({ data: { email, name, password: hashed } });
  }

  return NextResponse.json({ ok: true });
}

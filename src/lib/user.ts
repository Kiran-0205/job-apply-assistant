import { prisma } from "@/lib/prisma";

// This is a single-user, local-first app: there's exactly one candidate whose
// profile drives generation. Rather than hardcoding a personal email anywhere,
// we treat the first user row as "the app user", creating a blank one on first
// run. The user then fills in their details on the Profile page.
const PLACEHOLDER_EMAIL = "you@example.com";

export async function getAppUser() {
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.user.create({ data: { email: PLACEHOLDER_EMAIL } });
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Identifies the seeded single-user placeholder account so the Google
// sign-in flow can claim it on first real login (see src/auth.ts).
export const PLACEHOLDER_EMAIL = "you@example.com";

// Resolves the signed-in user's row, which drives every page and API route.
// Pages that call this should be reachable only when authenticated — proxy.ts
// redirects unauthenticated requests to /signin before they get here, but we
// redirect too as a defense in depth.
export async function getAppUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/signin");

  return user;
}

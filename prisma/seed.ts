import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed a single blank app user. Real details are entered through the
  // Profile page in the UI — nothing personal is hardcoded here.
  const existing = await prisma.user.findFirst();
  const user =
    existing ??
    (await prisma.user.create({ data: { email: "you@example.com" } }));
  console.log("App user ready:", user.id, user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

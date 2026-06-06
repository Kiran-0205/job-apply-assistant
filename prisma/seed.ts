import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "saikiran@example.com" },
    update: {},
    create: {
      email: "saikiran@example.com",
      name: "Poreddy Sai Kiran Reddy",
    },
  });
  console.log("Seeded user:", user.id, user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

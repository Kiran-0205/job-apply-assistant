import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PLACEHOLDER_EMAIL } from "@/lib/user";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // allowDangerousEmailAccountLinking: this is a personal, local-first app —
    // an existing user row with a matching email is the same person signing
    // in a different way, not an account-takeover risk.
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    // First-ever sign-in via Google: if this app only has the seeded
    // placeholder user (no password, no linked accounts), claim it instead
    // of creating a second user — so existing jobs/profile carry over.
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          const [totalUsers, placeholder] = await Promise.all([
            prisma.user.count(),
            prisma.user.findFirst({
              where: { email: PLACEHOLDER_EMAIL, password: null, accounts: { none: {} } },
            }),
          ]);
          if (totalUsers === 1 && placeholder) {
            await prisma.user.update({
              where: { id: placeholder.id },
              data: { email: user.email, name: user.name ?? placeholder.name, image: user.image },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});

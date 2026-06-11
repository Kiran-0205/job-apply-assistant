import type { NextAuthConfig } from "next-auth";

// Edge-safe base config: no Prisma adapter or providers here, since proxy.ts
// runs on the Edge runtime and the Prisma client isn't Edge-compatible. The
// full config (with adapter + providers) lives in src/auth.ts and extends this.
export const authConfig = {
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;

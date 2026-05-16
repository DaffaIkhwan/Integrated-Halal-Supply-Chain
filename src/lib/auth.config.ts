import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || "default-secret-key-for-next-auth-v5-123456789",
  providers: [], // Add providers in auth.ts instead
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.orgId = (user as any).orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as any).orgId = token.orgId as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

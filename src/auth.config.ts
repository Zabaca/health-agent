import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.type = (user as any).type;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.onboarded = (user as any).onboarded;
      }
      if (trigger === 'update' && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword;
      }
      if (trigger === 'update' && session?.onboarded !== undefined) {
        token.onboarded = session.onboarded;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.type = token.type as 'patient' | 'agent' | 'admin';
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      session.user.onboarded = token.onboarded as boolean | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;

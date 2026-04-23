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
        token.isAgent = (user as any).isAgent;
        token.isPda = (user as any).isPda;
        token.isPatient = (user as any).isPatient;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.onboarded = (user as any).onboarded;
        token.disabled = (user as any).disabled;
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
      session.user.type = token.type as 'admin' | 'user';
      session.user.isAgent = token.isAgent as boolean;
      session.user.isPda = token.isPda as boolean;
      session.user.isPatient = token.isPatient as boolean;
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      session.user.onboarded = token.onboarded as boolean | undefined;
      session.user.disabled = token.disabled as boolean;
      return session;
    },
  },
} satisfies NextAuthConfig;

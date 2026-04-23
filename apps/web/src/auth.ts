import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { users, zabacaAgentRoles, patientDesignatedAgents, patientAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth-helpers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user) return null;

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        const [agentRole, pdaRelation, patientAssignment] = await Promise.all([
          db.query.zabacaAgentRoles.findFirst({ where: eq(zabacaAgentRoles.userId, user.id) }),
          db.query.patientDesignatedAgents.findFirst({
            where: and(
              eq(patientDesignatedAgents.agentUserId, user.id),
              eq(patientDesignatedAgents.status, 'accepted'),
            ),
            columns: { id: true },
          }),
          db.query.patientAssignments.findFirst({
            where: eq(patientAssignments.patientId, user.id),
            columns: { id: true },
          }),
        ]);

        return {
          id: user.id,
          email: user.email,
          type: user.type,
          isAgent: !!agentRole,
          isPda: !!pdaRelation,
          isPatient: !!patientAssignment,
          mustChangePassword: user.mustChangePassword,
          onboarded: user.onboarded,
          disabled: user.disabled,
        };
      },
    }),
  ],
});

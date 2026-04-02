import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { staffInvites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import StaffInviteAcceptForm from "@/components/auth/StaffInviteAcceptForm";
import { Center, Paper, Title, Text, Stack } from "@mantine/core";

export const metadata = { title: "Accept Staff Invitation" };

async function getInvite(token: string) {
  const invite = await db.query.staffInvites.findFirst({
    where: and(eq(staffInvites.token, token), eq(staffInvites.status, "pending")),
  });

  if (!invite) return null;

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role as "admin" | "agent",
    firstName: invite.firstName,
    lastName: invite.lastName,
    expired: new Date(invite.tokenExpiresAt) < new Date(),
  };
}

export default async function StaffInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

  if (!invite) notFound();

  if (invite.expired) {
    return (
      <Center style={{ minHeight: "100vh" }}>
        <Paper p="xl" radius="md" withBorder style={{ maxWidth: 480, width: "100%" }}>
          <Stack align="center" gap="sm">
            <Title order={3}>Invitation Expired</Title>
            <Text c="dimmed" ta="center">
              This invite link has expired. Please ask your admin to resend the invitation.
            </Text>
          </Stack>
        </Paper>
      </Center>
    );
  }

  return <StaffInviteAcceptForm token={token} invite={invite} />;
}

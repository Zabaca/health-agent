import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Title, Text, Stack, Paper, Group, Avatar, ThemeIcon } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";

export const metadata = { title: "Select Patient" };

export default async function RepresentingIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const relations = await db.query.patientDesignatedAgents.findMany({
    where: and(
      eq(patientDesignatedAgents.agentUserId, session.user.id),
      eq(patientDesignatedAgents.status, "accepted"),
    ),
    with: { patient: true },
  });

  if (relations.length === 1) {
    redirect(`/representing/${relations[0].patientId}`);
  }

  if (relations.length === 0) {
    return (
      <Stack align="center" mt="xl">
        <Title order={3}>No patients found</Title>
        <Text c="dimmed">You are not currently representing any patients.</Text>
      </Stack>
    );
  }

  return (
    <Stack mt="xl" maw={600}>
      <div>
        <Title order={2}>Select a patient</Title>
        <Text c="dimmed" mt={4}>Choose whose records you&apos;d like to access.</Text>
      </div>
      <Stack gap="sm">
        {relations.map((r) => {
          const name =
            [r.patient?.firstName, r.patient?.lastName].filter(Boolean).join(" ") ||
            r.patient?.email ||
            "Patient";
          const initials =
            `${r.patient?.firstName?.[0] ?? ""}${r.patient?.lastName?.[0] ?? ""}`.toUpperCase() || "?";
          return (
            <Paper
              key={r.patientId}
              component={Link}
              href={`/representing/${r.patientId}`}
              p="md"
              radius="md"
              withBorder
              style={{ display: "block", textDecoration: "none", cursor: "pointer" }}
            >
              <Group justify="space-between">
                <Group gap="sm">
                  <Avatar size="md" radius="xl" color="teal">{initials}</Avatar>
                  <div>
                    <Text fw={500}>{name}</Text>
                    {r.relationship && (
                      <Text size="sm" c="dimmed">{r.relationship}</Text>
                    )}
                  </div>
                </Group>
                <ThemeIcon variant="subtle" color="gray" size="sm">
                  <IconChevronRight size={14} />
                </ThemeIcon>
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}

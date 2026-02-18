import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Button, Group, Title } from "@mantine/core";
import Link from "next/link";
import ReleaseList from "@/components/dashboard/ReleaseList";
import type { ReleaseSummary } from "@/types/release";

export const metadata = { title: "Dashboard — Medical Record Release" };

export default async function DashboardPage() {
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) return null;

  const releases = await db
    .select({
      id: releasesTable.id,
      firstName: releasesTable.firstName,
      lastName: releasesTable.lastName,
      createdAt: releasesTable.createdAt,
      updatedAt: releasesTable.updatedAt,
    })
    .from(releasesTable)
    .where(eq(releasesTable.userId, userId))
    .orderBy(desc(releasesTable.updatedAt));

  const serialized: ReleaseSummary[] = releases.map((r) => ({
    ...r,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>My Releases</Title>
        <Button component={Link} href="/releases/new">
          + New Release
        </Button>
      </Group>
      <ReleaseList releases={serialized} />
    </>
  );
}

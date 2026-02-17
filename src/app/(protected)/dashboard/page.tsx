import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button, Group, Title } from "@mantine/core";
import Link from "next/link";
import ReleaseList from "@/components/dashboard/ReleaseList";
import type { ReleaseSummary } from "@/types/release";

export const metadata = { title: "Dashboard — Medical Record Release" };

export default async function DashboardPage() {
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) return null;

  const releases = await prisma.release.findMany({
    where: { userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const serialized: ReleaseSummary[] = releases.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
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

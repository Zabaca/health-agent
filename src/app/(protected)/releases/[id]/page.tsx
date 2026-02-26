import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  Stack, Group, Title, Paper, SimpleGrid, Text, Divider,
  Badge, Checkbox, Button, Alert,
} from "@mantine/core";
import Link from "next/link";
import { IconArrowLeft, IconBan } from "@tabler/icons-react";
import VoidReleaseButton from "@/components/release-view/VoidReleaseButton";
import PrintButton from "@/components/release-view/PrintButton";
import SignReleaseSection from "@/components/release-view/SignReleaseSection";
import SsnDisplay from "@/components/fields/SsnDisplay";
import { decryptPii } from "@/lib/crypto";

export const dynamic = 'force-dynamic';
export const metadata = { title: "View Release — Medical Record Release" };

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={500}>{label}</Text>
      <Text size="sm">{value || "—"}</Text>
    </Stack>
  );
}

export default async function ViewReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) notFound();

  const release = await db.query.releases.findFirst({
    where: and(eq(releasesTable.id, id), eq(releasesTable.userId, userId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
  });

  if (!release) notFound();

  const { ssn, dateOfBirth, ...releaseRest } = decryptPii(release);

  const recordLabels: Record<string, string> = {
    historyPhysical: "History & Physical",
    diagnosticResults: "Diagnostic Results",
    treatmentProcedure: "Treatment/Procedure Notes",
    prescriptionMedication: "Prescription/Medication",
    imagingRadiology: "Imaging/Radiology",
    dischargeSummaries: "Discharge Summaries",
    specificRecords: "Specific Records",
  };

  return (
    <Stack gap="xl">
      <Title order={2} ta="center" className="print-only">Authorization for the Release of Protected Health Information</Title>
      <Group justify="space-between" align="center" className="no-print">
        <Group gap="sm">
          <Button component={Link} href="/dashboard" variant="subtle" leftSection={<IconArrowLeft size={16} />} px={0}>
            Dashboard
          </Button>
          <Title order={2}>{release.firstName} {release.lastName}</Title>
        </Group>
        {!release.voided && (
          <Group gap="xs">
            <PrintButton />
            <VoidReleaseButton releaseId={id} />
          </Group>
        )}
      </Group>

      {release.voided && (
        <Alert icon={<IconBan size={16} />} color="orange" variant="light">
          This release was voided on {new Date(release.updatedAt).toLocaleString()}.
        </Alert>
      )}

      {/* Patient Information */}
      <Paper withBorder p="md" radius="md" className="section-patient-info">
        <Title order={4} mb="md">Patient Information</Title>
        <Stack gap="md">
          <SimpleGrid cols={3}>
            <Field label="First Name" value={release.firstName} />
            <Field label="Middle Name" value={release.middleName} />
            <Field label="Last Name" value={release.lastName} />
            <Field label="Date of Birth" value={dateOfBirth} />
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500}>Social Security Number</Text>
              {ssn ? <SsnDisplay ssn={ssn} /> : <Text size="sm">—</Text>}
            </Stack>
          </SimpleGrid>
          <Field label="Mailing Address" value={release.mailingAddress} />
        </Stack>
      </Paper>

      {/* Healthcare Providers */}
      <Paper withBorder p="md" radius="md" className="section-providers">
        <Title order={4} mb="md">Healthcare Providers</Title>
        <Stack gap="lg">
          {release.providers.map((p, i) => (
            <Stack key={p.id} gap="md">
              {i > 0 && <Divider />}
              <Group gap="sm">
                <Title order={5}>{p.providerName}</Title>
                <Badge variant="light">{p.providerType}</Badge>
              </Group>
              <Field label="Provider Type" value={p.providerType} />

              {p.providerType === "Hospital" && p.patientId && (
                <Field label="Patient ID" value={p.patientId} />
              )}

              {p.providerType === "Medical Group" && (
                <SimpleGrid cols={3}>
                  <Field label="Insurance" value={p.insurance} />
                  <Field label="Insurance Member ID" value={p.patientMemberId} />
                  <Field label="Insurance Group ID" value={p.groupId} />
                  <Field label="Insurance Plan Name" value={p.planName} />
                </SimpleGrid>
              )}

              <SimpleGrid cols={3}>
                <Field label="Phone" value={p.phone} />
                <Field label="Fax" value={p.fax} />
                <Field label="Email" value={p.providerEmail} />
              </SimpleGrid>
              <Field label="Address" value={p.address} />

              {(p.membershipIdFront || p.membershipIdBack) && (
                <SimpleGrid cols={2}>
                  {p.membershipIdFront && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={500}>Membership Card (Front)</Text>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.membershipIdFront} alt="Membership Front" style={{ maxWidth: 200, borderRadius: 4, border: "1px solid #dee2e6" }} />
                    </Stack>
                  )}
                  {p.membershipIdBack && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={500}>Membership Card (Back)</Text>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.membershipIdBack} alt="Membership Back" style={{ maxWidth: 200, borderRadius: 4, border: "1px solid #dee2e6" }} />
                    </Stack>
                  )}
                </SimpleGrid>
              )}

              <Divider variant="dashed" />
              <Title order={6}>Records to Release</Title>
              <SimpleGrid cols={3}>
                {Object.entries(recordLabels).map(([key, label]) => (
                  <Checkbox
                    key={key}
                    label={label}
                    checked={!!p[key as keyof typeof p]}
                    readOnly
                  />
                ))}
              </SimpleGrid>
              {p.specificRecords && p.specificRecordsDesc && (
                <Field label="Specific Records Description" value={p.specificRecordsDesc} />
              )}

              <Title order={6}>Date Range</Title>
              {p.allAvailableDates ? (
                <Text size="sm">All available dates</Text>
              ) : (
                <SimpleGrid cols={2}>
                  <Field label="From" value={p.dateRangeFrom} />
                  <Field label="To" value={p.dateRangeTo} />
                </SimpleGrid>
              )}

              {p.purpose && <Field label="Purpose of Release" value={p.purpose === "Other" ? `Other — ${p.purposeOther}` : p.purpose} />}
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* Authorization */}
      <Paper withBorder p="md" radius="md" className="section-authorization">
        <Title order={4} mb="md">Authorization</Title>
        <Stack gap="md">
          <Text size="sm" fs="italic">
            {release.firstName} {release.lastName} hereby authorizes{" "}
            {release.releaseAuthAgent
              ? <>
                  {[release.authAgentFirstName, release.authAgentLastName].filter(Boolean).join(" ")}
                  {release.authAgentOrganization ? ` of ${release.authAgentOrganization}` : ""}{" "}
                  as the acting agent for {release.firstName} {release.lastName} in requesting medical records on the patient&apos;s behalf.
                </>
              : <>the release of their medical records as described in this document.</>
            }
          </Text>

          {release.releaseAuthAgent && (
            <Paper withBorder p="sm" radius="md">
              <Stack gap="md">
                <Title order={6}>Individual/Organization to Receive the Information</Title>
                <SimpleGrid cols={3}>
                  <Field label="First Name" value={release.authAgentFirstName} />
                  <Field label="Last Name" value={release.authAgentLastName} />
                  <Field label="Relationship to Patient" value="Authorized Representative" />
                  <Field label="Organization" value={release.authAgentOrganization} />
                  <Field label="Phone Number" value={release.authAgentPhone} />
                  <Field label="Email" value={release.authAgentEmail} />
                </SimpleGrid>
                <Field label="Address" value={release.authAgentAddress} />
              </Stack>
            </Paper>
          )}

          <Paper withBorder p="sm" radius="md">
            <Stack gap="xs">
              <Title order={6}>Release Code</Title>
              <Text size="sm" fw={600} ff="monospace">{release.releaseCode ?? "—"}</Text>
            </Stack>
          </Paper>

          <SimpleGrid cols={2}>
            <Field label="Authorization Expiration Date" value={release.authExpirationDate} />
            <Field label="Expiration Event" value={release.authExpirationEvent} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <Field label="Patient Printed Name" value={release.authPrintedName} />
            <Field label="Date" value={release.authDate} />
          </SimpleGrid>

          {release.authSignatureImage && (
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500}>Patient Signature</Text>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={release.authSignatureImage}
                alt="Signature"
                className="signature-img"
                style={{ maxWidth: 400 }}
              />
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Signature required — shown when release was created by staff and not yet signed */}
      {!release.authSignatureImage && !release.voided && (
        <SignReleaseSection releaseId={id} />
      )}

      <Group justify="flex-end" className="section-footer">
        <Text size="xs" c="dimmed">
          Created {new Date(release.createdAt).toLocaleDateString()} · Updated {new Date(release.updatedAt).toLocaleDateString()}
        </Text>
      </Group>
    </Stack>
  );
}

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable, patientAssignments, releaseRequestLog, users } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  Stack, Group, Title, Paper, SimpleGrid, Text, Divider,
  Badge, Checkbox, Button, Alert,
} from "@mantine/core";
import Link from "next/link";
import { IconArrowLeft, IconBan } from "@tabler/icons-react";
import StaffVoidReleaseButton from "@/components/staff/StaffVoidReleaseButton";
import PrintButton from "@/components/release-view/PrintButton";
import ExportTiffButton from "@/components/release-view/ExportTiffButton";
import FaxButton from "@/components/release-view/FaxButton";
import ReleaseRequestLogTable from "@/components/release-view/ReleaseRequestLogTable";
import SsnDisplay from "@/components/fields/SsnDisplay";
import { decryptPii } from "@/lib/crypto";

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={500}>{label}</Text>
      <Text size="sm">{value || "—"}</Text>
    </Stack>
  );
}

export default async function AgentReleaseViewPage({
  params,
}: {
  params: Promise<{ id: string; releaseId: string }>;
}) {
  const session = await auth();
  const { id: patientId, releaseId } = await params;

  if (!session?.user?.id) notFound();

  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, patientId),
      eq(patientAssignments.assignedToId, session.user.id)
    ),
  });
  if (!assignment) notFound();

  const release = await db.query.releases.findFirst({
    where: and(eq(releasesTable.id, releaseId), eq(releasesTable.userId, patientId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
  });

  if (!release) notFound();

  const agentUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const requestLogs = await db
    .select()
    .from(releaseRequestLog)
    .where(eq(releaseRequestLog.releaseId, releaseId))
    .orderBy(desc(releaseRequestLog.createdAt));

  const { ssn, dateOfBirth } = decryptPii(release);


  return (
    <Stack gap="xl" className="release-content">
      <Title order={2} ta="center" className="print-only">Authorization for the Release of Protected Health Information</Title>
      <Group justify="space-between" align="center" className="no-print">
        <Group gap="sm">
          <Button component={Link} href={`/agent/patients/${patientId}`} variant="subtle" leftSection={<IconArrowLeft size={16} />} px={0}>
            Back
          </Button>
          <Title order={2}>{release.firstName} {release.lastName}</Title>
        </Group>
        {!release.voided && (
          <Group gap="xs">
            <FaxButton
              releaseId={releaseId}
              releaseCode={release.releaseCode}
              defaultFaxNumber={release.providers[0]?.fax ?? null}
              providerName={release.providers[0]?.providerName ?? null}
              patientName={[release.firstName, release.lastName].filter(Boolean).join(" ")}
              agentName={[agentUser?.firstName, agentUser?.lastName].filter(Boolean).join(" ") || null}
              agentEmail={agentUser?.email ?? null}
              agentPhone={agentUser?.phoneNumber ?? null}
            />
            <ExportTiffButton releaseCode={release.releaseCode} />
            <PrintButton releaseCode={release.releaseCode} />
            <StaffVoidReleaseButton mode="agent" patientId={patientId} releaseId={releaseId} />
          </Group>
        )}
      </Group>

      {release.voided && (
        <Alert icon={<IconBan size={16} />} color="orange" variant="light">
          This release was voided on {new Date(release.updatedAt).toLocaleString()}.
        </Alert>
      )}

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

      <Paper withBorder p="md" radius="md" className="section-providers">
        <Title order={4} mb="md">Healthcare Provider</Title>
        <Stack gap="lg">
          {release.providers.map((p, i) => (
            <Stack key={p.id} gap="md">
              {i > 0 && <Divider />}
              <Group gap="sm">
                <Title order={5}>{p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName}</Title>
                <Badge variant="light" className="no-print">{p.providerType}</Badge>
              </Group>
              {p.providerType === "Insurance" && (
                <>
                  <SimpleGrid cols={3}>
                    <Field label="Insurance" value={p.insurance} />
                    <Field label="Insurance Member ID" value={p.patientMemberId} />
                    <Field label="Insurance Group ID" value={p.groupId} />
                    <Field label="Insurance Plan Name" value={p.planName} />
                  </SimpleGrid>
                </>
              )}
              <SimpleGrid cols={3}>
                <Field label="Phone" value={p.phone} />
                <Field label="Fax" value={p.fax} />
                <Field label="Email" value={p.providerEmail} />
              </SimpleGrid>
              {p.providerType !== "Insurance" && <Field label="Address" value={p.address} />}
              <Divider variant="dashed" />
              <Title order={6}>Records to Release</Title>
              {p.providerType === "Insurance" && (
                <SimpleGrid cols={3}>
                  <Checkbox label="Benefits and Coverage" checked={p.benefitsCoverage} readOnly />
                  <Checkbox label="Claims and Payment" checked={p.claimsPayment} readOnly />
                  <Checkbox label="Eligibility and Enrollment" checked={p.eligibilityEnrollment} readOnly />
                  <Checkbox label="Financial/Billing Information" checked={p.financialBilling} readOnly />
                </SimpleGrid>
              )}
              {(p.providerType === "Hospital" || p.providerType === "Facility") && (
                <>
                  <SimpleGrid cols={3}>
                    <Checkbox label="Medical Records" checked={p.medicalRecords} readOnly />
                    <Checkbox label="Dental Records" checked={p.dentalRecords} readOnly />
                    <Checkbox label="Other Non-Specific" checked={p.otherNonSpecific} readOnly />
                  </SimpleGrid>
                  {p.otherNonSpecific && p.otherNonSpecificDesc && (
                    <Field label="Other Non-Specific Details" value={p.otherNonSpecificDesc} />
                  )}
                </>
              )}
              {p.providerType !== "Insurance" && p.providerType !== "Hospital" && p.providerType !== "Facility" && (
                <>
                  <SimpleGrid cols={3}>
                    <Checkbox label="History & Physical" checked={p.historyPhysical} readOnly />
                    <Checkbox label="Diagnostic Results" checked={p.diagnosticResults} readOnly />
                    <Checkbox label="Treatment/Procedure Notes" checked={p.treatmentProcedure} readOnly />
                    <Checkbox label="Prescription/Medication" checked={p.prescriptionMedication} readOnly />
                    <Checkbox label="Imaging/Radiology" checked={p.imagingRadiology} readOnly />
                    <Checkbox label="Discharge Summaries" checked={p.dischargeSummaries} readOnly />
                    <Checkbox label="Specific Records" checked={p.specificRecords} readOnly />
                  </SimpleGrid>
                  {p.specificRecords && p.specificRecordsDesc && (
                    <Field label="Specific Records Description" value={p.specificRecordsDesc} />
                  )}
                </>
              )}
              {(p.providerType === "Insurance" || p.providerType === "Hospital" || p.providerType === "Facility") && (
                <>
                  <Title order={6}>Sensitive Information to be Disclosed</Title>
                  <SimpleGrid cols={3}>
                    <Checkbox label="Communicable Diseases" checked={p.sensitiveCommDiseases} readOnly />
                    <Checkbox label="Reproductive Health" checked={p.sensitiveReproductiveHealth} readOnly />
                    <Checkbox label="HIV/AIDS status or testing results" checked={p.sensitiveHivAids} readOnly />
                    <Checkbox label="Mental Health / Behavior Health records" checked={p.sensitiveMentalHealth} readOnly />
                    <Checkbox label="Substance Use Disorder (Alcohol/Drug treatment)" checked={p.sensitiveSubstanceUse} readOnly />
                    <Checkbox label="Psychotherapy Notes" checked={p.sensitivePsychotherapy} readOnly />
                    <Checkbox label="Other (Specify)" checked={p.sensitiveOther} readOnly />
                  </SimpleGrid>
                  {p.sensitiveOther && p.sensitiveOtherDesc && (
                    <Field label="Sensitive Other Details" value={p.sensitiveOtherDesc} />
                  )}
                </>
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

      <Paper withBorder p="md" radius="md" className="section-authorization">
        <Title order={4} mb="md">Authorization</Title>
        <Stack gap="md">
          <Text size="sm" fs="italic">
            {release.firstName} {release.lastName} (Patient) hereby authorizes{" "}
            {release.releaseAuthAgent
              ? <>
                  {[release.authAgentFirstName, release.authAgentLastName].filter(Boolean).join(" ")}{" "}
                  (Authorized Representative) as the acting agent in requesting medical records on the patient&apos;s behalf.
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
              <img src={release.authSignatureImage} alt="Signature" className="signature-img" style={{ maxWidth: 400 }} />
            </Stack>
          )}
        </Stack>
      </Paper>

      <Group justify="flex-end" className="section-footer">
        <Text size="xs" c="dimmed">
          Created {new Date(release.createdAt).toLocaleDateString()} · Updated {new Date(release.updatedAt).toLocaleDateString()}
        </Text>
      </Group>

      <ReleaseRequestLogTable logs={requestLogs} />

    </Stack>
  );
}

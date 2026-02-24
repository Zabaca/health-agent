import { Paper, Title, SimpleGrid, Stack, Text } from "@mantine/core";
import SsnDisplay from "@/components/fields/SsnDisplay";

interface Patient {
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  email: string;
  dateOfBirth: string | null;
  address: string | null;
  phoneNumber: string | null;
  ssn: string | null;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={500}>{label}</Text>
      <Text size="sm">{value}</Text>
    </Stack>
  );
}

export default function PatientInfoCard({ patient }: { patient: Patient }) {
  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={4} mb="md">Patient Information</Title>
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Field label="First Name" value={patient.firstName} />
          <Field label="Middle Name" value={patient.middleName} />
          <Field label="Last Name" value={patient.lastName} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Field label="Email" value={patient.email} />
          <Field label="Phone" value={patient.phoneNumber} />
        </SimpleGrid>

        <Field label="Address" value={patient.address} />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Field label="Date of Birth" value={patient.dateOfBirth} />
          {patient.ssn && (
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500}>Social Security Number</Text>
              <SsnDisplay ssn={patient.ssn} />
            </Stack>
          )}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

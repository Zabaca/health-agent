import { Stack, Text, Group, Title, Code, Divider, Badge } from "@mantine/core";
import { summarizeFhir, type StoredClinicalRecord } from "@health-agent/types";

/**
 * Resilient FHIR record view. Renders the defensively-extracted common fields
 * (title/status/date/value) and always includes the raw FHIR JSON as a
 * fallback so nothing is hidden.
 *
 * TODO(fhir): add per-type polished layouts (lab Observation reference range +
 * abnormal flag, Medication dosage, Immunization, Allergy reaction) and validate
 * against real linked-provider data on a device before relying on them.
 */
export default function FhirRecordView({ record }: { record: StoredClinicalRecord }) {
  const s = summarizeFhir(record);
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Title order={4}>{s.title}</Title>
        <Badge variant="light">{s.resourceType}</Badge>
      </Group>
      <Group gap="lg">
        {s.status && (
          <Text size="sm">
            <Text span fw={500}>Status:</Text> {s.status}
          </Text>
        )}
        {s.date && (
          <Text size="sm">
            <Text span fw={500}>Date:</Text> {s.date}
          </Text>
        )}
      </Group>
      {s.value && <Text fw={600}>{s.value}</Text>}
      {s.fields.map((f) => (
        <Group key={f.label} gap="xs">
          <Text size="sm" fw={500}>{f.label}:</Text>
          <Text size="sm">{f.value}</Text>
        </Group>
      ))}
      <Divider my="xs" label="Raw FHIR" labelPosition="left" />
      <Code block style={{ whiteSpace: "pre-wrap", maxHeight: 400, overflow: "auto" }}>
        {JSON.stringify(record.fhirData, null, 2)}
      </Code>
    </Stack>
  );
}

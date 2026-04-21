import { Text } from "@mantine/core";

export default function SsnDisplay({ ssn }: { ssn: string | null | undefined }) {
  if (!ssn) return null;
  const last4 = ssn.replace(/\D/g, '').slice(-4);
  return (
    <Text size="sm" style={{ fontFamily: 'monospace' }}>
      xxx-xx-{last4}
    </Text>
  );
}

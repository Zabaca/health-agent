"use client";

import { Text } from "@mantine/core";

export default function SsnDisplay({ ssn }: { ssn: string }) {
  const last4 = ssn.replace(/\D/g, '').slice(-4).padStart(4, '0');
  return (
    <Text size="sm" style={{ fontFamily: 'monospace' }}>
      xxx-xx-{last4}
    </Text>
  );
}

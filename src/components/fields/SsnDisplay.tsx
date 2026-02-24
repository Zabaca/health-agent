"use client";

import { useState } from "react";
import { Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

const PRINT_STYLES = `
  @media print {
    .ssn-interactive { display: none !important; }
    .ssn-print-only  { display: inline !important; }
  }
  .ssn-print-only { display: none; }
`;

function maskSsn(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length === 9) return `***-**-${digits.slice(5)}`;
  return `***-**-${ssn.slice(-4)}`;
}

export default function SsnDisplay({ ssn }: { ssn: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <style>{PRINT_STYLES}</style>
      {/* Print-only: always shows full SSN */}
      <span className="ssn-print-only" style={{ fontFamily: 'monospace', fontSize: 14 }}>
        {ssn}
      </span>
      {/* Screen-only: masked with toggle */}
      <Group gap="xs" align="center" className="ssn-interactive" wrap="nowrap">
        <Text size="sm" style={{ fontFamily: 'monospace' }}>
          {visible ? ssn : maskSsn(ssn)}
        </Text>
        <Tooltip label={visible ? 'Hide' : 'Show'}>
          <ActionIcon
            variant="subtle"
            size="sm"
            color="gray"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide SSN' : 'Show SSN'}
          >
            {visible ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          </ActionIcon>
        </Tooltip>
      </Group>
    </>
  );
}

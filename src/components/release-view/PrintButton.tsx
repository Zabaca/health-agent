"use client";
import { Button } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";

export default function PrintButton() {
  return (
    <Button
      variant="light"
      leftSection={<IconPrinter size={16} />}
      className="no-print"
      onClick={() => window.print()}
    >
      Print
    </Button>
  );
}

"use client";
import { Button } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";

interface Props {
  releaseCode?: string | null;
}

export default function PrintButton({ releaseCode }: Props) {
  const handlePrint = () => {
    const styleId = "print-footer-dynamic";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    const code = releaseCode ?? "—";
    style.textContent = `
      @page {
        margin-bottom: 1.5cm;
        @bottom-right {
          content: "${code}  ·  Page " counter(page) " of " counter(pages);
          font-size: 8pt;
          color: #555;
          font-family: monospace;
        }
      }
    `;
    window.print();
  };

  return (
    <Button
      variant="light"
      leftSection={<IconPrinter size={16} />}
      className="no-print"
      onClick={handlePrint}
    >
      Print
    </Button>
  );
}

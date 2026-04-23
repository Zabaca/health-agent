"use client";

import { useState } from "react";
import { Button, Group, Modal, Stack, Text, Textarea, TextInput, ThemeIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconSend } from "@tabler/icons-react";

// 8.5" at 96 CSS DPI
const PRINT_WIDTH_PX = 816;
// 200 DPI — standard fax fine resolution
const DPI = 200;
const SCALE = DPI / 96;
// Bottom margin matching @page { margin-bottom: 1.5cm } used by PrintButton
const PAGE_MARGIN_BOTTOM_IN = 1.5 / 2.54; // ~0.591"

const PRINT_CSS = `
  body { background: white !important; line-height: 1.3 !important; }
  * { line-height: inherit; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .no-print   { display: none !important; }
  .print-only { display: block !important; }

  /* SSN: hide the masked toggle, reveal the full value */
  .ssn-interactive { display: none !important; }
  .ssn-print-only  { display: inline !important; }

  /* Section ordering (matches print CSS order) */
  .section-patient-info  { order: 1; }
  .section-authorization { order: 2; }
  .section-providers     { order: 3; }
  .section-footer        { order: 4; }

  .mantine-Paper-root {
    box-shadow: none !important;
    border: 1px solid #c4d9ee !important;
  }

  .mantine-Badge-root {
    background: none !important;
    color: #1e3a5f !important;
    border: 1px solid #2d6da4 !important;
  }

  .mantine-Checkbox-input {
    background: white !important;
    border: 1.5px solid #000 !important;
  }
  .mantine-Checkbox-input:checked { background: #000 !important; }
  .mantine-Checkbox-icon          { display: none; }

  .signature-img { max-width: 200px !important; }

  .print-only {
    display: block !important;
    color: #1e3a5f !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
    border-bottom: 2px solid #1e3a5f !important;
    padding-bottom: 10px !important;
    font-size: 10pt !important;
    white-space: nowrap !important;
  }

  .section-patient-info,
  .section-providers,
  .section-authorization { border-top: 3px solid #1e3a5f !important; }

  .section-patient-info h4,
  .section-providers h4,
  .section-authorization h4 {
    color: #1e3a5f !important;
    border-bottom: 1px solid #c4d9ee !important;
    padding-bottom: 8px !important;
  }

  .section-providers h5,
  .section-authorization h5 { color: #1e3a5f !important; }

  .section-providers h6,
  .section-authorization h6 { color: #2d6da4 !important; }

  .mantine-Divider-root { border-color: #c4d9ee !important; }

  .section-authorization .mantine-Paper-root {
    background: #f0f7fd !important;
    border-color: #2d6da4 !important;
  }

  .section-footer {
    border-top: 1px solid #c4d9ee !important;
    padding-top: 6px !important;
  }

  div:has(> .section-patient-info) { gap: 10px !important; }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildCoverLetterHtml({
  today,
  recipient,
  faxNumber,
  agentName,
  agentEmail,
  agentPhone,
  patientName,
  comment,
  totalPages,
}: {
  today: string;
  recipient: string;
  faxNumber: string;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  patientName?: string | null;
  comment: string;
  totalPages: number;
}): string {
  const fromLines = [agentName || "—", agentEmail, agentPhone]
    .filter((v): v is string => !!v)
    .map(escapeHtml)
    .join("<br>");

  const commentRow = comment.trim()
    ? `<tr><td style="font-weight:bold;width:120px;padding:8px 0;vertical-align:top">COMMENTS:</td><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(comment.trim())}</td></tr>`
    : "";

  return `
    <div style="width:816px;background:white;padding:48px;box-sizing:border-box;font-family:Arial,sans-serif;font-size:12pt;color:#000">
      <div style="background:#1e3a5f;color:white;padding:16px 24px;margin:-48px -48px 32px;font-size:18pt;font-weight:bold;letter-spacing:0.05em">
        RELEASE REQUEST
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
        <tr><td style="font-weight:bold;width:120px;padding:8px 0;vertical-align:top">DATE:</td><td style="padding:8px 0">${escapeHtml(today)}</td></tr>
        <tr><td style="font-weight:bold;padding:8px 0;vertical-align:top">TOTAL PAGES:</td><td style="padding:8px 0">${totalPages}</td></tr>
        <tr><td style="font-weight:bold;padding:8px 0;vertical-align:top">TO:</td><td style="padding:8px 0">${escapeHtml(recipient || "—")}<br>${escapeHtml(faxNumber)}</td></tr>
        <tr><td style="font-weight:bold;padding:8px 0;vertical-align:top">FROM:</td><td style="padding:8px 0">${fromLines}</td></tr>
        <tr><td style="font-weight:bold;padding:8px 0;vertical-align:top">PATIENT:</td><td style="padding:8px 0">${escapeHtml(patientName || "—")}</td></tr>
        ${commentRow}
      </table>
      <hr style="border:none;border-top:2px solid #1e3a5f;margin-bottom:32px">
      <p style="font-size:9pt;color:#444;line-height:1.6;font-style:italic">
        CONFIDENTIALITY NOTICE: The documents accompanying this facsimile transmission contain confidential information, belonging to the sender, that is legally privileged. This information is intended only for the use of the individual or entity named above. If you are not the intended recipient, you are hereby notified that any disclosure, copying, distribution, or action taken in reliance on the contents of these documents is strictly prohibited. If you have received this transmission in error, please notify us immediately by telephone and destroy the original documents.
      </p>
    </div>
  `;
}

function splitCanvasIntoPageCanvases(
  canvas: HTMLCanvasElement,
  forcedBreakAtCanvasPx: number | null = null,
): { canvases: HTMLCanvasElement[]; sliceStarts: number[] } {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d")!;
  // Full page canvas height (11")
  const pageCanvasHeightPx = Math.round(11 * DPI);
  // Content area height — reserves bottom margin to match @page { margin-bottom: 1.5cm }
  const contentHeightPx = Math.round((11 - PAGE_MARGIN_BOTTOM_IN) * DPI);
  const searchWindow = Math.round(1 * DPI);
  const topMarginPx  = Math.round(48 * SCALE);

  const cuts: number[] = [];
  let scanPos = 0;
  let pageIdx = 0;
  let pendingForced = forcedBreakAtCanvasPx;
  while (scanPos + contentHeightPx < height) {
    const usable = pageIdx === 0 ? contentHeightPx : contentHeightPx - topMarginPx;
    const ideal  = scanPos + usable;

    if (pendingForced !== null && pendingForced > scanPos && pendingForced < ideal) {
      const cut = findBestCut(ctx, width, pendingForced, searchWindow);
      cuts.push(cut);
      scanPos = cut;
      pendingForced = null;
    } else {
      const cut = findBestCut(ctx, width, ideal, searchWindow);
      cuts.push(cut);
      scanPos = cut;
    }

    pageIdx++;
  }

  const sliceStarts = [0, ...cuts];
  const sliceEnds   = [...cuts, height];

  const canvases = sliceStarts.map((yStart, i) => {
    const sliceHeight = sliceEnds[i] - yStart;
    const topOffset   = i === 0 ? 0 : topMarginPx;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width  = width;
    pageCanvas.height = pageCanvasHeightPx;
    const pageCtx = pageCanvas.getContext("2d")!;
    pageCtx.fillStyle = "#ffffff";
    pageCtx.fillRect(0, 0, width, pageCanvasHeightPx);
    pageCtx.drawImage(canvas, 0, yStart, width, sliceHeight, 0, topOffset, width, sliceHeight);
    return pageCanvas;
  });

  return { canvases, sliceStarts };
}

function findBestCut(
  ctx: CanvasRenderingContext2D,
  width: number,
  idealCut: number,
  searchWindow: number,
): number {
  const from = Math.max(0, idealCut - searchWindow);
  const windowHeight = idealCut - from;
  if (windowHeight <= 0) return idealCut;

  const { data } = ctx.getImageData(0, from, width, windowHeight);
  const stride = width * 4;

  for (let row = windowHeight - 1; row >= 0; row--) {
    let allWhite = true;
    const rowOff = row * stride;
    for (let x = 0; x < stride; x += 4) {
      if (data[rowOff + x] < 240 || data[rowOff + x + 1] < 240 || data[rowOff + x + 2] < 240) {
        allWhite = false;
        break;
      }
    }
    if (allWhite) return from + row;
  }
  return idealCut;
}

function drawPageFooter(
  ctx: CanvasRenderingContext2D,
  pageWidth: number,
  pageHeightPx: number,
  releaseCode: string | null | undefined,
  pageNum: number,
  totalPages: number,
) {
  const margin = Math.round(48 * SCALE);
  const fontSize = Math.round(8 * DPI / 72);
  // Footer sits in the bottom margin zone, matching @page @bottom-right baseline
  const contentEndPx = Math.round((11 - PAGE_MARGIN_BOTTOM_IN) * DPI);
  const baseline = contentEndPx + Math.round((pageHeightPx - contentEndPx) * 0.6);

  ctx.save();
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "#555555";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${releaseCode ?? "—"}  ·  Page ${pageNum} of ${totalPages}`,
    pageWidth - margin,
    baseline,
  );
  ctx.restore();
}

export default function FaxButton({
  releaseCode,
  defaultFaxNumber,
  providerName,
  releaseId,
  agentName,
  agentEmail,
  agentPhone,
  patientName,
}: {
  releaseCode?: string | null;
  defaultFaxNumber?: string | null;
  providerName?: string | null;
  releaseId: string;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  patientName?: string | null;
}) {
  const [opened, setOpened] = useState(false);
  const [faxNumber, setFaxNumber] = useState(defaultFaxNumber?.trim() ?? "");
  const [recipient, setRecipient] = useState(providerName ?? "");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const faxDigits = faxNumber.replace(/\D/g, "");
  const faxValid  = faxDigits.length === 10;
  const faxError  = faxNumber.trim() && !faxValid
    ? "Must be 10 digits (3-digit area code + 7-digit number)"
    : null;

  const buildFaxPdf = async () => {
    const element = document.querySelector(".release-content") as HTMLElement | null;
    if (!element) throw new Error("Release content element not found");

    const { default: html2canvas } = await import("html2canvas");

    const today = new Date().toLocaleString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "UTC", timeZoneName: "short",
    });

    const coverHtmlOptions = {
      today,
      recipient: recipient.trim(),
      faxNumber: faxNumber.trim(),
      agentName,
      agentEmail,
      agentPhone,
      patientName,
      comment,
    };

    const captureCover = async (pages: number) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:fixed;left:-9999px;top:0;";
      wrapper.innerHTML = buildCoverLetterHtml({ ...coverHtmlOptions, totalPages: pages });
      document.body.appendChild(wrapper);
      const canvas = await html2canvas(wrapper.firstElementChild as HTMLElement, {
        scale: SCALE,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: PRINT_WIDTH_PX,
      });
      document.body.removeChild(wrapper);
      return canvas;
    };

    // Capture signature image src + its CSS position in the printed layout before capture,
    // then replace it with a blank spacer so html2canvas doesn't JPEG-compress it.
    const sigSrc = (element.querySelector("img.signature-img") as HTMLImageElement | null)?.src ?? null;
    let sigCssPos: { x: number; y: number; w: number; h: number } | null = null;

    // Capture release content first so we know its page count
    let forcedBreakAtCanvasPx: number | null = null;
    const contentCanvas = await html2canvas(element, {
      scale: SCALE,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: PRINT_WIDTH_PX,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement("style");
        style.textContent = PRINT_CSS;
        clonedDoc.head.appendChild(style);

        const content = clonedDoc.querySelector(".release-content") as HTMLElement | null;
        if (content) {
          content.style.width = `${PRINT_WIDTH_PX}px`;
          content.style.maxWidth = `${PRINT_WIDTH_PX}px`;
          content.style.padding = "48px";
          content.style.boxSizing = "border-box";
          content.style.background = "white";
        }

        // Force a page break before .section-providers
        const providers = clonedDoc.querySelector(".section-providers") as HTMLElement | null;
        if (content && providers) {
          const contentRect = content.getBoundingClientRect();
          const providersRect = providers.getBoundingClientRect();
          const cssPx = providersRect.top - contentRect.top;
          if (cssPx > 0) {
            forcedBreakAtCanvasPx = Math.round(cssPx * SCALE);
          }
        }

        // Replace the signature img with a blank spacer and record its CSS position.
        // This keeps it out of the JPEG canvas so we can overlay it as lossless PNG later.
        const sig = clonedDoc.querySelector("img.signature-img") as HTMLImageElement | null;
        if (sig && content && sigSrc) {
          const sigRect = sig.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          sigCssPos = {
            x: sigRect.left - contentRect.left,
            y: sigRect.top - contentRect.top,
            w: sigRect.width,
            h: sigRect.height,
          };
          const spacer = clonedDoc.createElement("div");
          spacer.style.cssText = `display:block;width:${sigRect.width}px;height:${sigRect.height}px;`;
          sig.parentNode?.replaceChild(spacer, sig);
        }
      },
    });
    const { canvases: contentPageCanvases, sliceStarts: contentSliceStarts } =
      splitCanvasIntoPageCanvases(contentCanvas, forcedBreakAtCanvasPx);

    // First cover pass: count how many pages the cover itself takes
    const coverCountCanvas = await captureCover(0);
    const { canvases: coverCountPageCanvases } = splitCanvasIntoPageCanvases(coverCountCanvas);
    const coverPageCount = coverCountPageCanvases.length;

    // Now we know the real total — render cover again with the correct number
    const totalPages = coverPageCount + contentPageCanvases.length;
    const coverCanvas = await captureCover(totalPages);
    const { canvases: coverPageCanvases } = splitCanvasIntoPageCanvases(coverCanvas);

    // Draw footers on all pages
    const allPageCanvases = [...coverPageCanvases, ...contentPageCanvases];
    for (let i = 0; i < allPageCanvases.length; i++) {
      const pc = allPageCanvases[i];
      const ctx = pc.getContext("2d")!;
      drawPageFooter(ctx, pc.width, pc.height, releaseCode, i + 1, totalPages);
    }

    // Build PDF from canvas pages
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
    for (let i = 0; i < allPageCanvases.length; i++) {
      if (i > 0) pdf.addPage();
      const imgData = allPageCanvases[i].toDataURL("image/jpeg", 0.92);
      pdf.addImage(imgData, "JPEG", 0, 0, 8.5, 11);
    }

    // Overlay the signature as lossless PNG at its exact position on the correct page.
    if (sigSrc && sigCssPos) {
      const { x: cssX, y: cssY, w: cssW, h: cssH } = sigCssPos as { x: number; y: number; w: number; h: number };
      const sigCanvasY = cssY * SCALE;
      const pageCanvasHeightPx = Math.round(11 * DPI);
      const topMarginPx = Math.round(48 * SCALE);

      for (let pi = 0; pi < contentSliceStarts.length; pi++) {
        const sliceEnd = pi < contentSliceStarts.length - 1
          ? contentSliceStarts[pi + 1]
          : contentCanvas.height;
        if (sigCanvasY >= contentSliceStarts[pi] && sigCanvasY < sliceEnd) {
          const topOffset = pi === 0 ? 0 : topMarginPx;
          const yOnPage = sigCanvasY - contentSliceStarts[pi] + topOffset;

          const xIn = (cssX * SCALE / contentCanvas.width) * 8.5;
          const yIn = (yOnPage / pageCanvasHeightPx) * 11;
          const wIn = (cssW * SCALE / contentCanvas.width) * 8.5;
          const hIn = (cssH * SCALE / pageCanvasHeightPx) * 11;

          pdf.setPage(coverPageCanvases.length + pi + 1);
          pdf.addImage(sigSrc, "PNG", xIn, yIn, wIn, hIn);
          break;
        }
      }
    }

    return pdf;
  };

  const handleSend = async () => {
    if (!faxValid) return;

    setLoading(true);
    try {
      const pdf = await buildFaxPdf();
      const fileData = pdf.output("datauristring").split(",")[1];

      const res = await fetch("/api/fax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faxNumber:     faxNumber.trim(),
          recipientName: recipient.trim(),
          fileData,
          fileName:  `release-${releaseCode ?? "document"}.pdf`,
          releaseId,
        }),
      });

      if (res.ok) {
        notifications.show({ title: "Fax sent", message: "The fax was sent successfully.", color: "green" });
        setOpened(false);
      } else {
        const { error } = await res.json();
        notifications.show({ title: "Fax failed", message: error ?? "Unknown error", color: "red" });
      }
    } catch (err) {
      console.error("Fax failed:", err);
      notifications.show({ title: "Fax failed", message: "Unexpected error. Please try again.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const pdf = await buildFaxPdf();
      pdf.save(`testfax.pdf`);
    } catch (err) {
      console.error("Download failed:", err);
      notifications.show({ title: "Download failed", message: "Unexpected error. Please try again.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconSend size={16} />}
        className="no-print"
        onClick={() => {
          setFaxNumber(defaultFaxNumber?.trim() ?? "");
          setRecipient(providerName ?? "");
          setComment("");
          setOpened(true);
        }}
      >
        Fax Request
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        centered
        withCloseButton
        styles={{
          content: { overflow: "hidden" },
          header: {
            background: "linear-gradient(135deg, var(--mantine-primary-color-9) 0%, var(--mantine-primary-color-7) 100%)",
            padding: "var(--mantine-spacing-lg)",
          },
          title: { width: "100%" },
          close: { color: "white", opacity: 0.8 },
        }}
        title={
          <Group gap="md" align="center">
            <ThemeIcon size={42} radius="xl" color="white" variant="white"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <IconSend size={22} color="#1e3a5f" />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw={700} size="lg" c="white">Send Fax</Text>
              <Text size="xs" c="rgba(255,255,255,0.75)">Transmit release via Faxage</Text>
            </Stack>
          </Group>
        }
      >
        <Stack pt="sm" pb="xs">
        <TextInput
          label="Recipient"
          placeholder="Provider name"
          value={recipient}
          onChange={(e) => setRecipient(e.currentTarget.value)}
          mb="sm"
          data-autofocus
        />
        <TextInput
          label="Fax number"
          placeholder="e.g. 555-123-4567"
          description="10-digit number — area code + 7-digit phone number"
          value={faxNumber}
          onChange={(e) => setFaxNumber(e.currentTarget.value)}
          error={faxError}
          mb="sm"
        />
        <Textarea
          label="Comment / Additional Details"
          placeholder="Optional notes for the recipient..."
          value={comment}
          onChange={(e) => setComment(e.currentTarget.value)}
          autosize
          minRows={3}
          mb="lg"
        />
        <Group justify="space-between">
          <Button
            variant="subtle"
            leftSection={<IconDownload size={16} />}
            loading={loading}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
          <Group gap="xs">
            <Button variant="default" onClick={() => setOpened(false)} disabled={loading}>Cancel</Button>
            <Button
              leftSection={<IconSend size={16} />}
              loading={loading}
              disabled={!faxValid}
              onClick={handleSend}
            >
              Send
            </Button>
          </Group>
        </Group>
        </Stack>
      </Modal>
    </>
  );
}

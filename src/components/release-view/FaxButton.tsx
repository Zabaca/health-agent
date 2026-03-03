"use client";

import { useState } from "react";
import { Button, Group, Modal, Stack, Text, TextInput, ThemeIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSend } from "@tabler/icons-react";

// 8.5" at 96 CSS DPI
const PRINT_WIDTH_PX = 816;
// Target 600 DPI → scale = 600 / 96
const DPI = 600;
const SCALE = DPI / 96;

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

function buildMultiPageTiff(pageBuffers: ArrayBuffer[]): ArrayBuffer {
  if (pageBuffers.length === 0) throw new Error("No pages");
  if (pageBuffers.length === 1) return pageBuffers[0];

  const firstByte = new Uint8Array(pageBuffers[0])[0];
  const le = firstByte === 0x49;

  const r16 = (b: Uint8Array, o: number) =>
    le ? (b[o] | (b[o + 1] << 8)) >>> 0
       : ((b[o] << 8) | b[o + 1]) >>> 0;

  const r32 = (b: Uint8Array, o: number) =>
    le
      ? (b[o] | (b[o+1] << 8) | (b[o+2] << 16) | (b[o+3] << 24)) >>> 0
      : ((b[o] << 24) | (b[o+1] << 16) | (b[o+2] << 8) | b[o+3]) >>> 0;

  const w32 = (b: Uint8Array, o: number, v: number) => {
    if (le) {
      b[o]   =  v         & 0xff;
      b[o+1] = (v >>>  8) & 0xff;
      b[o+2] = (v >>> 16) & 0xff;
      b[o+3] = (v >>> 24) & 0xff;
    } else {
      b[o]   = (v >>> 24) & 0xff;
      b[o+1] = (v >>> 16) & 0xff;
      b[o+2] = (v >>>  8) & 0xff;
      b[o+3] =  v         & 0xff;
    }
  };

  const TYPE_SIZE: Record<number, number> = {
    1:1, 2:1, 3:2, 4:4, 5:8, 6:1, 7:1, 8:2, 9:4, 10:8, 11:4, 12:8,
  };

  const pages = pageBuffers.map(b => new Uint8Array(b.slice(0)));
  const starts: number[] = [];
  let cum = 0;
  for (const p of pages) { starts.push(cum); cum += p.byteLength; }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const base = starts[i];

    const ifdOff   = r32(page, 4);
    const nEntries = r16(page, ifdOff);

    for (let e = 0; e < nEntries; e++) {
      const eOff  = ifdOff + 2 + e * 12;
      const tag   = r16(page, eOff);
      const type  = r16(page, eOff + 2);
      const count = r32(page, eOff + 4);
      const bytes = (TYPE_SIZE[type] ?? 1) * count;

      if (bytes > 4) {
        const oldPtr = r32(page, eOff + 8);
        w32(page, eOff + 8, oldPtr + base);

        if (tag === 273 && type === 4) {
          for (let s = 0; s < count; s++) {
            const addr = r32(page, oldPtr + s * 4);
            w32(page, oldPtr + s * 4, addr + base);
          }
        }
      } else if (tag === 273) {
        const addr = r32(page, eOff + 8);
        w32(page, eOff + 8, addr + base);
      }
    }

    const nextPtrOff = ifdOff + 2 + nEntries * 12;
    if (i < pages.length - 1) {
      const nextIfdOff = r32(pages[i + 1], 4);
      w32(page, nextPtrOff, starts[i + 1] + nextIfdOff);
    }
  }

  const total = pages.reduce((s, p) => s + p.byteLength, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of pages) { out.set(p, pos); pos += p.byteLength; }
  return out.buffer;
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
  const baseline = pageHeightPx - Math.round(DPI * 0.5);

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

async function encodeTiffDeflate(
  rgbaData: Uint8Array,
  w: number,
  h: number,
  dpi: number,
): Promise<ArrayBuffer> {
  // RGBA → RGB
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    rgb[i * 3]     = rgbaData[i * 4];
    rgb[i * 3 + 1] = rgbaData[i * 4 + 1];
    rgb[i * 3 + 2] = rgbaData[i * 4 + 2];
  }

  // Horizontal differencing predictor (right-to-left per row)
  for (let row = 0; row < h; row++) {
    for (let col = w - 1; col > 0; col--) {
      const i = (row * w + col) * 3;
      rgb[i]     = (rgb[i]     - rgb[i - 3]) & 0xFF;
      rgb[i + 1] = (rgb[i + 1] - rgb[i - 2]) & 0xFF;
      rgb[i + 2] = (rgb[i + 2] - rgb[i - 1]) & 0xFF;
    }
  }

  // Compress with browser-native CompressionStream (zlib = TIFF type 8)
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(rgb);
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const compLen = chunks.reduce((s, c) => s + c.length, 0);
  const compressed = new Uint8Array(compLen);
  let coff = 0;
  for (const chunk of chunks) { compressed.set(chunk, coff); coff += chunk.length; }

  // TIFF layout (little-endian, 14 IFD entries):
  //   0  : header (8 bytes)
  //   8  : IFD — 2 + 14×12 + 4 = 174 bytes → ends at 182
  // 182  : t258 data [8,8,8] — 6 bytes
  // 188  : t282 XResolution rational — 8 bytes
  // 196  : t283 YResolution rational — 8 bytes
  // 204  : compressed strip data
  const T258 = 182, T282 = 188, T283 = 196, DATA = 204;
  const buf = new ArrayBuffer(DATA + compLen);
  const dv  = new DataView(buf);
  const u8  = new Uint8Array(buf);

  // Header
  dv.setUint8(0, 0x49); dv.setUint8(1, 0x49); // 'II' (little-endian)
  dv.setUint16(2, 42, true);
  dv.setUint32(4, 8, true);

  // IFD
  let pos = 8;
  dv.setUint16(pos, 14, true); pos += 2;
  const e = (tag: number, type: number, count: number, val: number) => {
    dv.setUint16(pos, tag, true);   pos += 2;
    dv.setUint16(pos, type, true);  pos += 2;
    dv.setUint32(pos, count, true); pos += 4;
    dv.setUint32(pos, val, true);   pos += 4;
  };
  e(256, 4, 1, w);       // ImageWidth
  e(257, 4, 1, h);       // ImageLength
  e(258, 3, 3, T258);    // BitsPerSample → offset
  e(259, 3, 1, 8);       // Compression = Deflate (zlib)
  e(262, 3, 1, 2);       // PhotometricInterp = RGB
  e(273, 4, 1, DATA);    // StripOffsets
  e(277, 3, 1, 3);       // SamplesPerPixel
  e(278, 4, 1, h);       // RowsPerStrip
  e(279, 4, 1, compLen); // StripByteCounts
  e(282, 5, 1, T282);    // XResolution → offset
  e(283, 5, 1, T283);    // YResolution → offset
  e(284, 3, 1, 1);       // PlanarConfig = chunky
  e(296, 3, 1, 2);       // ResolutionUnit = inch
  e(317, 3, 1, 2);       // Predictor = horizontal differencing
  dv.setUint32(pos, 0, true); // next IFD = 0

  // External data
  dv.setUint16(T258, 8, true); dv.setUint16(T258 + 2, 8, true); dv.setUint16(T258 + 4, 8, true);
  dv.setUint32(T282, dpi, true); dv.setUint32(T282 + 4, 1, true);
  dv.setUint32(T283, dpi, true); dv.setUint32(T283 + 4, 1, true);

  u8.set(compressed, DATA);
  return buf;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + 8192)));
  }
  return btoa(binary);
}

export default function FaxButton({
  releaseCode,
  defaultFaxNumber,
  providerName,
  releaseId,
}: {
  releaseCode?: string | null;
  defaultFaxNumber?: string | null;
  providerName?: string | null;
  releaseId: string;
}) {
  const [opened, setOpened] = useState(false);
  const [faxNumber, setFaxNumber] = useState(defaultFaxNumber?.trim() ?? "");
  const [recipient, setRecipient] = useState(providerName ?? "");
  const [loading, setLoading] = useState(false);

  const faxDigits = faxNumber.replace(/\D/g, "");
  const faxValid  = faxDigits.length === 10;
  const faxError  = faxNumber.trim() && !faxValid
    ? "Must be 10 digits (3-digit area code + 7-digit number)"
    : null;

  const handleSend = async () => {
    if (!faxValid) return;

    setLoading(true);
    try {
      const element = document.querySelector(".release-content") as HTMLElement | null;
      if (!element) return;

      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(element, {
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
        },
      });

      const { width, height } = canvas;
      const ctx = canvas.getContext("2d")!;

      const pageHeightPx = Math.round(11 * DPI);
      const searchWindow = Math.round(1 * DPI);
      const topMarginPx  = Math.round(48 * SCALE);

      const cuts: number[] = [];
      let scanPos = 0;
      let pageIdx = 0;
      while (scanPos + pageHeightPx < height) {
        const usable = pageIdx === 0 ? pageHeightPx : pageHeightPx - topMarginPx;
        const ideal  = scanPos + usable;
        const cut    = findBestCut(ctx, width, ideal, searchWindow);
        cuts.push(cut);
        scanPos = cut;
        pageIdx++;
      }

      const sliceStarts = [0, ...cuts];
      const sliceEnds   = [...cuts, height];
      const pageBuffers: ArrayBuffer[] = [];
      const totalPages = sliceStarts.length;

      for (let i = 0; i < sliceStarts.length; i++) {
        const yStart      = sliceStarts[i];
        const sliceHeight = sliceEnds[i] - yStart;
        const topOffset   = i === 0 ? 0 : topMarginPx;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width  = width;
        pageCanvas.height = pageHeightPx;
        const pageCtx = pageCanvas.getContext("2d")!;
        pageCtx.fillStyle = "#ffffff";
        pageCtx.fillRect(0, 0, width, pageHeightPx);
        pageCtx.drawImage(canvas, 0, yStart, width, sliceHeight, 0, topOffset, width, sliceHeight);

        drawPageFooter(pageCtx, width, pageHeightPx, releaseCode, i + 1, totalPages);

        const rgba = new Uint8Array(
          pageCtx.getImageData(0, 0, width, pageHeightPx).data.buffer
        );

        pageBuffers.push(await encodeTiffDeflate(rgba, width, pageHeightPx, DPI));
      }

      const tiffBuffer = pageBuffers.length === 1 ? pageBuffers[0] : buildMultiPageTiff(pageBuffers);
      const fileData = arrayBufferToBase64(tiffBuffer);

      const res = await fetch("/api/fax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faxNumber:     faxNumber.trim(),
          recipientName: recipient.trim(),
          fileData,
          fileName:  `release-${releaseCode ?? "document"}.tiff`,
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

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconSend size={16} />}
        className="no-print"
        onClick={() => {
          setFaxNumber(defaultFaxNumber?.trim() ?? "");
          setRecipient(providerName ?? "");
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
          mb="lg"
        />
        <Group justify="flex-end">
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
        </Stack>
      </Modal>
    </>
  );
}

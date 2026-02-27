"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { IconFileDownload } from "@tabler/icons-react";

// 8.5" at 96 CSS DPI
const PRINT_WIDTH_PX = 816;
// Target 600 DPI → scale = 600 / 96
const DPI = 600;
const SCALE = DPI / 96;

// Print-equivalent styles applied to the html2canvas clone.
// Mirrors @media print in globals.css + SSN rules from SsnDisplay.tsx.
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

/**
 * Scan the rendered canvas upward from `idealCut` within a search window to find
 * the nearest row where every pixel is near-white (i.e. a gap between elements).
 * Returns `idealCut` unchanged if no such row is found (fallback).
 */
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

  // Scan upward from idealCut; return the first fully-white row found.
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

/**
 * Combine multiple single-page TIFF ArrayBuffers (as produced by UTIF.encodeImage)
 * into a single multi-page TIFF by:
 *  1. Rebasing all file-relative offsets in each page's IFD entries by that page's
 *     cumulative start position in the combined output.
 *  2. Linking pages via the "next IFD" pointer at the end of each IFD.
 *  3. Concatenating the patched page buffers.
 *
 * Handles both big-endian (MM) and little-endian (II) TIFFs.
 */
function buildMultiPageTiff(pageBuffers: ArrayBuffer[]): ArrayBuffer {
  if (pageBuffers.length === 0) throw new Error("No pages");
  if (pageBuffers.length === 1) return pageBuffers[0];

  // Detect byte order from the first page's magic bytes ('II' = LE, 'MM' = BE)
  const firstByte = new Uint8Array(pageBuffers[0])[0];
  const le = firstByte === 0x49; // 'I'

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

  // Bytes per element for each TIFF type code
  const TYPE_SIZE: Record<number, number> = {
    1:1, 2:1, 3:2, 4:4, 5:8, 6:1, 7:1, 8:2, 9:4, 10:8, 11:4, 12:8,
  };

  // Make writable copies and record each page's start offset in the final file
  const pages = pageBuffers.map(b => new Uint8Array(b.slice(0)));
  const starts: number[] = [];
  let cum = 0;
  for (const p of pages) { starts.push(cum); cum += p.byteLength; }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const base = starts[i]; // how far into the combined file this page sits

    const ifdOff   = r32(page, 4);
    const nEntries = r16(page, ifdOff);

    for (let e = 0; e < nEntries; e++) {
      const eOff  = ifdOff + 2 + e * 12;
      const tag   = r16(page, eOff);
      const type  = r16(page, eOff + 2);
      const count = r32(page, eOff + 4);
      const bytes = (TYPE_SIZE[type] ?? 1) * count;

      if (bytes > 4) {
        // The 4-byte value field holds a pointer to external data — rebase it.
        const oldPtr = r32(page, eOff + 8);
        w32(page, eOff + 8, oldPtr + base);

        // StripOffsets (tag 273): the external array contains file addresses of
        // the actual pixel strips, so those values must also be rebased.
        if (tag === 273 && type === 4) {
          for (let s = 0; s < count; s++) {
            const addr = r32(page, oldPtr + s * 4);
            w32(page, oldPtr + s * 4, addr + base);
          }
        }
      } else if (tag === 273) {
        // Inline strip offset (count === 1, 4 bytes fits in the value field)
        const addr = r32(page, eOff + 8);
        w32(page, eOff + 8, addr + base);
      }
    }

    // "Next IFD" pointer is the 4 bytes immediately after the last entry.
    const nextPtrOff = ifdOff + 2 + nEntries * 12;
    if (i < pages.length - 1) {
      const nextIfdOff = r32(pages[i + 1], 4);
      w32(page, nextPtrOff, starts[i + 1] + nextIfdOff);
    }
    // Last page: leave next-IFD as 0 (already zero from encodeImage).
  }

  // Concatenate all patched pages into one buffer.
  const total = pages.reduce((s, p) => s + p.byteLength, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of pages) { out.set(p, pos); pos += p.byteLength; }
  return out.buffer;
}

/**
 * Draw the page footer (separator line + "releaseCode · Page X of Y") into the
 * bottom margin of a page canvas, matching the print-view footer style.
 */
function drawPageFooter(
  ctx: CanvasRenderingContext2D,
  pageWidth: number,
  pageHeightPx: number,
  releaseCode: string | null | undefined,
  pageNum: number,
  totalPages: number,
) {
  // Match the 48 CSS-px padding applied to .release-content in onclone
  const margin = Math.round(48 * SCALE);
  // Font: 8pt converted to canvas pixels at 600 DPI
  const fontSize = Math.round(8 * DPI / 72);
  // Baseline sits 0.5" from the bottom of the page
  const baseline = pageHeightPx - Math.round(DPI * 0.5);

  ctx.save();

  // Footer text right-aligned, monospace, #555
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

interface Props {
  releaseCode?: string | null;
}

export default function ExportTiffButton({ releaseCode }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const element = document.querySelector(".release-content") as HTMLElement | null;
      if (!element) return;

      const [{ default: html2canvas }, UTIF] = await Promise.all([
        import("html2canvas"),
        import("utif"),
      ]);

      const canvas = await html2canvas(element, {
        scale: SCALE,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        // Render at 8.5" page width so layout matches print view
        windowWidth: PRINT_WIDTH_PX,
        onclone: (clonedDoc) => {
          // Apply print-equivalent styles
          const style = clonedDoc.createElement("style");
          style.textContent = PRINT_CSS;
          clonedDoc.head.appendChild(style);

          // Pin the content element to 8.5" with 0.5" margins on each side
          const content = clonedDoc.querySelector(".release-content") as HTMLElement | null;
          if (content) {
            content.style.width = `${PRINT_WIDTH_PX}px`;
            content.style.maxWidth = `${PRINT_WIDTH_PX}px`;
            content.style.padding = "48px"; // ≈ 0.5" at 96 DPI
            content.style.boxSizing = "border-box";
            content.style.background = "white";
          }

        },
      });

      const { width, height } = canvas;
      const ctx = canvas.getContext("2d")!;

      // 11" page height at 600 DPI; search up to 1" upward for a whitespace cut.
      const pageHeightPx = Math.round(11 * DPI);
      const searchWindow = Math.round(1  * DPI); // 1" = 600 canvas px
      // Top margin injected on pages 2+ so moved elements aren't flush against the top.
      // Matches the 48 CSS-px padding on .release-content (48 × SCALE = 300 canvas px).
      const topMarginPx  = Math.round(48 * SCALE);

      // Compute smart page-break positions: scan upward from each ideal cut
      // to find the nearest all-white row (gap between elements).
      // Pages 2+ have a topMarginPx offset injected when drawing, so the usable
      // content height is reduced by that amount to prevent overflow.
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

      // Build [start, end] pairs for each page slice.
      const sliceStarts = [0, ...cuts];
      const sliceEnds   = [...cuts, height];

      const pageBuffers: ArrayBuffer[] = [];

      const totalPages = sliceStarts.length;

      for (let i = 0; i < sliceStarts.length; i++) {
        const yStart     = sliceStarts[i];
        const sliceHeight = sliceEnds[i] - yStart;

        // Each output page is a full 8.5 × 11" canvas; content sits at the top
        // and any remaining space is filled with white.
        // Pages 2+ get a topMarginPx offset so moved elements aren't flush against the top.
        const topOffset = i === 0 ? 0 : topMarginPx;
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width  = width;
        pageCanvas.height = pageHeightPx;
        const pageCtx = pageCanvas.getContext("2d")!;
        pageCtx.fillStyle = "#ffffff";
        pageCtx.fillRect(0, 0, width, pageHeightPx);
        pageCtx.drawImage(canvas, 0, yStart, width, sliceHeight, 0, topOffset, width, sliceHeight);

        // Footer: release code + page number in the bottom margin
        drawPageFooter(pageCtx, width, pageHeightPx, releaseCode, i + 1, totalPages);

        const rgba = new Uint8Array(
          pageCtx.getImageData(0, 0, width, pageHeightPx).data.buffer
        );

        pageBuffers.push(
          UTIF.encodeImage(rgba, width, pageHeightPx, {
            "t282": [DPI],
            "t283": [DPI],
            "t296": [2],
          } as unknown as import("utif").IFD)
        );
      }

      const tiff = pageBuffers.length === 1 ? pageBuffers[0] : buildMultiPageTiff(pageBuffers);

      const blob = new Blob([tiff], { type: "image/tiff" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `release-${releaseCode ?? "document"}.tiff`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("TIFF export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="light"
      leftSection={<IconFileDownload size={16} />}
      className="no-print"
      loading={loading}
      onClick={handleExport}
    >
      Export TIFF
    </Button>
  );
}

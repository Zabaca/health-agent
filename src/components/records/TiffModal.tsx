'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Group, ActionIcon, Text, Center, Loader, Tooltip } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut, IconZoomReset } from '@tabler/icons-react';
import UTIF from 'utif';

interface TiffModalProps {
  filePath: string;
  opened: boolean;
  onClose: () => void;
}

const ZOOM_STEP = 0.125;
const ZOOM_MIN  = 0.25;
const ZOOM_MAX  = 4;

export default function TiffModal({ filePath, opened, onClose }: TiffModalProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const dragState    = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [ifds, setIfds]     = useState<UTIF.IFD[]>([]);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [page, setPage]     = useState(0);
  const [zoom, setZoom]     = useState(1);
  const [fitZoom, setFitZoom] = useState(1); // zoom level that fits modal width
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Load all pages when modal opens
  useEffect(() => {
    if (!opened) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setPage(0);
      try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const decoded = UTIF.decode(buf);
        for (const ifd of decoded) UTIF.decodeImage(buf, ifd);
        if (cancelled) return;

        // Compute fit-to-width zoom from available container width
        const containerWidth = scrollRef.current?.clientWidth ?? 700;
        const pageWidth = decoded[0]?.width ?? 1;
        const fit = Math.min(1, containerWidth / pageWidth);

        setBuffer(buf);
        setIfds(decoded);
        setFitZoom(fit);
        setZoom(fit);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filePath, opened]);

  // Draw current page onto canvas at natural resolution
  useEffect(() => {
    if (!canvasRef.current || !ifds.length || !buffer) return;
    const ifd = ifds[page];
    const canvas = canvasRef.current;
    canvas.width  = ifd.width;
    canvas.height = ifd.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rgba    = UTIF.toRGBA8(ifd);
    const clamped = new Uint8ClampedArray(rgba.length);
    clamped.set(rgba);
    ctx.putImageData(new ImageData(clamped, ifd.width, ifd.height), 0, 0);
  }, [ifds, buffer, page]);

  const totalPages = ifds.length;
  const ifd        = ifds[page];

  // 100% = natural pixel dimensions of the document
  const displayPct = Math.round(zoom * 100);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    const el = scrollRef.current;
    if (!ds || !el) return;
    el.scrollLeft = ds.scrollLeft - (e.clientX - ds.x);
    el.scrollTop  = ds.scrollTop  - (e.clientY - ds.y);
  }, []);

  const onMouseUp = useCallback(() => {
    dragState.current = null;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = '';
    }
  }, []);

  return (
    <Modal opened={opened} onClose={onClose} size="xl" title="Document" centered>
      {loading && <Center py="xl"><Loader size="sm" /></Center>}
      {error   && <Text c="red" size="sm">{error}</Text>}

      {!loading && !error && totalPages > 0 && (
        <>
          {/* Toolbar */}
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <ActionIcon variant="subtle" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <IconChevronLeft size={16} />
              </ActionIcon>
              <Text size="sm">Page {page + 1} of {totalPages}</Text>
              <ActionIcon variant="subtle" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>

            <Group gap="xs">
              <Tooltip label="Zoom out">
                <ActionIcon
                  variant="subtle"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom(z => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(2))))}
                >
                  <IconZoomOut size={16} />
                </ActionIcon>
              </Tooltip>
              <Text size="sm" w={52} ta="center">{displayPct}%</Text>
              <Tooltip label="Zoom in">
                <ActionIcon
                  variant="subtle"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom(z => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(2))))}
                >
                  <IconZoomIn size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Actual size (100%)">
                <ActionIcon variant="subtle" onClick={() => setZoom(1)}>
                  <IconZoomReset size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Scrollable canvas area */}
          <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ overflow: 'auto', maxHeight: '70vh', background: '#f0f0f0', borderRadius: 4, padding: 8, cursor: 'grab' }}
          >
            {/* width:fit-content + margin:auto centers when smaller than container,
                but left-aligns when wider so the scroll origin stays at the left edge */}
            <div style={{ width: 'fit-content', margin: '0 auto' }}>
              <canvas
                ref={canvasRef}
                style={{
                  display: 'block',
                  width:  ifd ? ifd.width  * zoom : undefined,
                  height: ifd ? ifd.height * zoom : undefined,
                }}
              />
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

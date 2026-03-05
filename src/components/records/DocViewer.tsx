'use client';

import { useEffect, useRef, useState } from 'react';
import { Text, Center, Loader, Tooltip, ThemeIcon, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileTypePdf } from '@tabler/icons-react';
import UTIF from 'utif';
import DocModal from './DocModal';

interface DocViewerProps {
  fileURL: string;
}

export default function DocViewer({ fileURL }: DocViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpened, { open, close }] = useDisclosure(false);

  const isPdf = fileURL.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (isPdf) { setLoading(false); return; }

    let cancelled = false;

    async function loadFirstPage() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(fileURL);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const buffer = await res.arrayBuffer();

        const ifds = UTIF.decode(buffer);
        if (!ifds.length) throw new Error('No pages found in TIFF');

        UTIF.decodeImage(buffer, ifds[0]);

        if (cancelled || !containerRef.current) return;

        setTotalPages(ifds.length);
        containerRef.current.innerHTML = '';

        const ifd = ifds[0];
        const rgba = UTIF.toRGBA8(ifd);
        const canvas = document.createElement('canvas');
        canvas.width = ifd.width;
        canvas.height = ifd.height;
        canvas.style.width = `${ifd.width * 0.2}px`;
        canvas.style.height = `${ifd.height * 0.2}px`;
        canvas.style.display = 'block';

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const clamped = new Uint8ClampedArray(rgba.length);
          clamped.set(rgba);
          ctx.putImageData(new ImageData(clamped, ifd.width, ifd.height), 0, 0);
        }

        containerRef.current.appendChild(canvas);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load TIFF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFirstPage();
    return () => { cancelled = true; };
  }, [fileURL, isPdf]);

  if (isPdf) {
    return (
      <>
        <Tooltip label="Click to view PDF" position="bottom">
          <Stack
            align="center"
            gap="xs"
            onClick={open}
            style={{
              cursor: 'zoom-in',
              padding: '20px 12px',
              border: '1px solid #dee2e6',
              borderRadius: 8,
              background: '#fff5f5',
            }}
          >
            <ThemeIcon color="red" variant="light" size="xl" radius="xl">
              <IconFileTypePdf size={24} />
            </ThemeIcon>
            <Text size="xs" c="red.7" fw={500}>PDF Document</Text>
            <Text size="xs" c="dimmed">Click to view</Text>
          </Stack>
        </Tooltip>
        <DocModal fileURL={fileURL} opened={modalOpened} onClose={close} />
      </>
    );
  }

  return (
    <>
      <Tooltip label="Click to view full document" position="bottom" disabled={loading || !!error}>
        <div
          onClick={!loading && !error ? open : undefined}
          style={{
            position: 'relative',
            minHeight: loading ? 80 : undefined,
            cursor: !loading && !error ? 'zoom-in' : 'default',
          }}
        >
          {loading && (
            <Center style={{ position: 'absolute', inset: 0 }}>
              <Loader size="sm" />
            </Center>
          )}
          {error && <Text c="red" size="sm">{error}</Text>}
          <div ref={containerRef} style={{ width: '100%' }} />
        </div>
      </Tooltip>

      {!loading && !error && totalPages > 0 && (
        <Text size="xs" c="dimmed" mt={4}>
          {totalPages} {totalPages === 1 ? 'page' : 'pages'}
        </Text>
      )}

      <DocModal fileURL={fileURL} opened={modalOpened} onClose={close} />
    </>
  );
}

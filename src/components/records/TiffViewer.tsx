'use client';

import { useEffect, useRef, useState } from 'react';
import { Text, Center, Loader, Tooltip, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import UTIF from 'utif';
import TiffModal from './TiffModal';

interface TiffViewerProps {
  filePath: string;
}

export default function TiffViewer({ filePath }: TiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const buffer = await res.arrayBuffer();

        const ifds = UTIF.decode(buffer);
        if (!ifds.length) throw new Error('No pages found in TIFF');

        // Decode only the first page for the thumbnail
        UTIF.decodeImage(buffer, ifds[0]);

        if (cancelled || !containerRef.current) return;

        setTotalPages(ifds.length);
        containerRef.current.innerHTML = '';

        const ifd = ifds[0];
        const rgba = UTIF.toRGBA8(ifd);
        const canvas = document.createElement('canvas');
        canvas.width = ifd.width;
        canvas.height = ifd.height;

        // Fixed 20% scale
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
  }, [filePath]);

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

      <TiffModal filePath={filePath} opened={modalOpened} onClose={close} />
    </>
  );
}

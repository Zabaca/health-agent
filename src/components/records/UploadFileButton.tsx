'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { IconUpload } from '@tabler/icons-react';
import Uppy, { type Meta, type Body } from '@uppy/core';
import UppyDashboard from '@uppy/react/dashboard';
import Transloadit from '@uppy/transloadit';

import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';

export default function UploadFileButton() {
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();
  const closeRef = useRef(close);
  const routerRef = useRef(router);
  useEffect(() => { closeRef.current = close; routerRef.current = router; });

  const uppy = useMemo(
    () =>
      new Uppy<Meta, Body>({
        restrictions: {
          allowedFileTypes: ['image/*', '.pdf', '.tif', '.tiff'],
        },
        autoProceed: false,
      }),
    [],
  );

  useEffect(() => {
    async function setup() {
      const res = await fetch('/api/transloadit/signature');
      const { params, signature } = (await res.json()) as { params: string; signature: string };

      if (uppy.getPlugin('Transloadit')) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (uppy as any).use(Transloadit, {
        waitForEncoding: true,
        assemblyOptions: {
          params,
          signature,
        },
      });

      uppy.on('transloadit:complete', (assembly) => {
        const upload = assembly.uploads?.[0];
        const fileURL = upload?.ssl_url;
        if (!fileURL) return;

        const ext = fileURL.split('.').pop()?.toLowerCase() ?? 'bin';
        const originalName = (upload as { name?: string }).name ?? fileURL.split('/').pop() ?? 'unknown';

        fetch('/api/records/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileURL, fileType: ext, originalName }),
        }).then((res) => {
          if (!res.ok) return;
          closeRef.current();
          routerRef.current.refresh();
        });
      });
    }

    setup();

    return () => {
      const plugin = uppy.getPlugin('Transloadit');
      if (plugin) uppy.removePlugin(plugin);
    };
  }, [uppy]);

  return (
    <>
      <Button leftSection={<IconUpload size={16} />} onClick={open}>
        Upload File
      </Button>

      <Modal opened={opened} onClose={close} title="Upload File" size="xl" centered>
        <UppyDashboard uppy={uppy} width="100%" height={400} />
      </Modal>
    </>
  );
}

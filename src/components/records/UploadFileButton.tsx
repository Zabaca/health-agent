'use client';

import { useState } from 'react';
import { Button, Modal, Stack, Text, ThemeIcon, Box, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { IconUpload, IconX, IconCheck } from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';

export default function UploadFileButton() {
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    setError('');
    setSuccess(false);
    close();
  };

  const onDrop = async (accepted: File[], rejected: { file: File }[]) => {
    if (rejected.length > 0) {
      setError('Invalid file type.');
      return;
    }
    const file = accepted[0];
    if (!file) return;

    setError('');
    setSuccess(false);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url: fileURL } = await uploadRes.json();

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const recordRes = await fetch('/api/records/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileURL, fileType: ext, originalName: file.name }),
      });
      if (!recordRes.ok) throw new Error('Failed to save record');

      setSuccess(true);
      router.refresh();
      setTimeout(() => handleClose(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted, rejected) => onDrop(accepted, rejected.map((r) => ({ file: r.file }))),
    accept: { 'image/*': [], 'application/pdf': ['.pdf'], 'image/tiff': ['.tif', '.tiff'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <>
      <Button leftSection={<IconUpload size={16} />} onClick={open}>
        Upload File
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Upload File" size="lg" centered>
        <Stack gap="md">
          <Box
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--mantine-color-blue-5)' : '#ced4da'}`,
              borderRadius: 8,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: isDragActive ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <input {...getInputProps()} />
            <Stack gap={8} align="center">
              <ThemeIcon size="xl" variant="light" color={success ? 'green' : isDragActive ? 'blue' : 'gray'} radius="xl">
                {success ? <IconCheck size={20} /> : <IconUpload size={20} />}
              </ThemeIcon>
              <Text size="sm" c={isDragActive ? 'blue' : 'dimmed'}>
                {uploading ? 'Uploading…' : success ? 'Uploaded!' : isDragActive ? 'Drop file here' : 'Click or drag & drop'}
              </Text>
              <Text size="xs" c="dimmed">Images, PDF, TIFF</Text>
            </Stack>
          </Box>

          {error && (
            <Group gap={4}>
              <IconX size={12} color="red" />
              <Text size="xs" c="red">{error}</Text>
            </Group>
          )}
        </Stack>
      </Modal>
    </>
  );
}

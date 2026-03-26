'use client';

import { useState, useMemo } from 'react';
import { Button, Modal, Stack, Text, ThemeIcon, Box, Group, Progress, Combobox, useCombobox, InputBase, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { IconUpload, IconX, IconCheck } from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

interface ReleaseOption {
  id: string;
  releaseCode: string | null;
  providerNames?: string[];
}

interface Props {
  patientId?: string;
  releases?: ReleaseOption[];
}

export default function UploadFileButton({ patientId, releases }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedReleaseCode, setSelectedReleaseCode] = useState<string | null>(null);

  const handleClose = () => {
    if (uploading) return;
    setError('');
    setSuccess(false);
    setProgress(0);
    setSelectedReleaseCode(null);
    setReleaseSearch('');
    close();
  };

  const uploadWithProgress = (url: string, formData: FormData): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 80)); // up to 80% for upload
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Upload failed'));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.open('POST', url);
      xhr.send(formData);
    });
  };

  const onDrop = async (accepted: File[], rejected: { file: File; errors: { code: string }[] }[]) => {
    if (rejected.length > 0) {
      const err = rejected[0]?.errors[0];
      setError(err?.code === 'file-too-large' ? 'File exceeds 20MB limit.' : 'Invalid file type.');
      return;
    }
    const file = accepted[0];
    if (!file) return;

    setError('');
    setSuccess(false);
    setProgress(0);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url: fileURL } = await uploadWithProgress('/api/upload', formData);

      setProgress(90);

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const recordRes = await fetch('/api/records/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileURL,
          fileType: ext,
          originalName: file.name,
          patientId: patientId ?? undefined,
          releaseCode: selectedReleaseCode ?? undefined,
        }),
      });
      if (!recordRes.ok) throw new Error('Failed to save record');

      setProgress(100);
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
    onDrop: (accepted, rejected) => onDrop(accepted, rejected as unknown as { file: File; errors: { code: string }[] }[]),
    accept: { 'image/*': [], 'application/pdf': ['.pdf'], 'image/tiff': ['.tif', '.tiff'], 'application/zip': ['.zip'] },
    maxFiles: 1,
    maxSize: MAX_SIZE,
    disabled: uploading,
  });

  const [releaseSearch, setReleaseSearch] = useState('');
  const releaseCombobox = useCombobox({
    onDropdownClose: () => { releaseCombobox.resetSelectedOption(); setReleaseSearch(''); },
  });

  const releaseOptions = useMemo(() =>
    (releases ?? []).filter(r => r.releaseCode).map(r => ({
      releaseCode: r.releaseCode!,
      providerNames: r.providerNames ?? [],
    })),
  [releases]);

  const filteredReleases = useMemo(() => {
    if (!releaseSearch.trim()) return releaseOptions;
    const q = releaseSearch.toLowerCase();
    return releaseOptions.filter(o => {
      const combined = [o.releaseCode, ...o.providerNames].join(' ').toLowerCase();
      let qi = 0;
      for (let i = 0; i < combined.length && qi < q.length; i++) {
        if (combined[i] === q[qi]) qi++;
      }
      return qi === q.length;
    });
  }, [releaseSearch, releaseOptions]);

  const selectedRelease = releaseOptions.find(o => o.releaseCode === selectedReleaseCode);
  const releaseDisplayValue = selectedRelease
    ? `${selectedRelease.releaseCode}${selectedRelease.providerNames.length ? ` — ${selectedRelease.providerNames.join(', ')}` : ''}`
    : '';

  return (
    <>
      <Button leftSection={<IconUpload size={16} />} onClick={open}>
        Upload File
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Upload File" size="lg" centered closeOnClickOutside={!uploading} closeOnEscape={!uploading} withCloseButton={!uploading}>
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
                {success ? 'Uploaded!' : isDragActive ? 'Drop file here' : 'Click or drag & drop'}
              </Text>
              <Text size="xs" c="dimmed">Images, PDF, TIFF, ZIP · Max 20MB</Text>
            </Stack>
          </Box>

          {uploading && (
            <Stack gap={4}>
              <Text size="xs" c="dimmed">Uploading… {progress}%</Text>
              <Progress value={progress} animated size="sm" />
            </Stack>
          )}

          {releaseOptions.length > 0 && (
            <Combobox
              store={releaseCombobox}
              onOptionSubmit={val => { setSelectedReleaseCode(val); releaseCombobox.closeDropdown(); }}
            >
              <Combobox.Target>
                <InputBase
                  label="Associate with Release (optional)"
                  placeholder="Search by code or provider…"
                  value={releaseCombobox.dropdownOpened ? releaseSearch : releaseDisplayValue}
                  onChange={e => { setReleaseSearch(e.currentTarget.value); releaseCombobox.openDropdown(); }}
                  onClick={() => releaseCombobox.openDropdown()}
                  onFocus={() => releaseCombobox.openDropdown()}
                  rightSection={<Combobox.Chevron />}
                  rightSectionPointerEvents="none"
                  disabled={uploading}
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  <ScrollArea.Autosize mah={200} type="scroll">
                    {filteredReleases.length === 0 ? (
                      <Combobox.Empty>No releases found</Combobox.Empty>
                    ) : filteredReleases.map(o => (
                      <Combobox.Option key={o.releaseCode} value={o.releaseCode} active={selectedReleaseCode === o.releaseCode}>
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" fw={500} ff="monospace">{o.releaseCode}</Text>
                          {o.providerNames.length > 0 && (
                            <Text size="xs" c="dimmed" truncate>{o.providerNames.join(', ')}</Text>
                          )}
                        </Group>
                      </Combobox.Option>
                    ))}
                  </ScrollArea.Autosize>
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          )}

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

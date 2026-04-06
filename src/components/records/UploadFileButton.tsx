'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button, Modal, Stack, Text, ThemeIcon, Box, Group, Progress, Combobox, useCombobox, InputBase, ScrollArea, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { IconUpload, IconX, IconCheck, IconFile } from '@tabler/icons-react';
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

interface FileUploadState {
  file: File;
  progress: number;
  success: boolean;
  error: string;
}

export default function UploadFileButton({ patientId, releases }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedReleaseCode, setSelectedReleaseCode] = useState<string | null>(null);

  const handleClose = () => {
    if (uploading) return;
    setFileStates([]);
    setSelectedReleaseCode(null);
    setReleaseSearch('');
    close();
  };

  const uploadWithProgress = (url: string, formData: FormData, onProgress: (pct: number) => void): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 80));
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

  const updateFileState = useCallback((index: number, patch: Partial<FileUploadState>) => {
    setFileStates(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
  }, []);

  const uploadFile = async (file: File, index: number, releaseCode: string | null): Promise<boolean> => {
    updateFileState(index, { progress: 0, error: '', success: false });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url: fileURL } = await uploadWithProgress(
        '/api/upload',
        formData,
        (pct) => updateFileState(index, { progress: pct }),
      );

      updateFileState(index, { progress: 90 });

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const recordRes = await fetch('/api/records/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileURL,
          fileType: ext,
          originalName: file.name,
          patientId: patientId ?? undefined,
          releaseCode: releaseCode ?? undefined,
        }),
      });
      if (!recordRes.ok) throw new Error('Failed to save record');

      updateFileState(index, { progress: 100, success: true });
      return true;
    } catch (err) {
      updateFileState(index, { error: err instanceof Error ? err.message : 'Upload failed' });
      return false;
    }
  };

  const onDrop = async (accepted: File[], rejected: { file: File; errors: { code: string }[] }[]) => {
    const rejectedStates: FileUploadState[] = rejected.map(({ file, errors }) => ({
      file,
      progress: 0,
      success: false,
      error: errors[0]?.code === 'file-too-large' ? 'Exceeds 20MB limit' : 'Invalid file type',
    }));

    const acceptedStates: FileUploadState[] = accepted.map(file => ({
      file,
      progress: 0,
      success: false,
      error: '',
    }));

    const startIndex = fileStates.length;
    setFileStates(prev => [...prev, ...acceptedStates, ...rejectedStates]);

    if (accepted.length === 0) return;

    setUploading(true);
    const releaseCode = selectedReleaseCode;
    const results = await Promise.all(accepted.map((file, i) => uploadFile(file, startIndex + i, releaseCode)));
    setUploading(false);
    router.refresh();

    const allSucceeded = results.every(Boolean) && rejected.length === 0;
    if (allSucceeded) {
      setTimeout(() => handleClose(), 1200);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted, rejected) => onDrop(accepted, rejected as unknown as { file: File; errors: { code: string }[] }[]),
    accept: { 'image/*': [], 'application/pdf': ['.pdf'], 'image/tiff': ['.tif', '.tiff'], 'application/zip': ['.zip'] },
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

  const hasFiles = fileStates.length > 0;
  const allDone = hasFiles && fileStates.every(s => s.success || s.error);

  return (
    <>
      <Button leftSection={<IconUpload size={16} />} onClick={open}>
        Upload Record
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Upload Records" size="lg" centered closeOnClickOutside={!uploading} closeOnEscape={!uploading} withCloseButton={!uploading}>
        <Stack gap="md">
          <Box
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--mantine-color-blue-5)' : '#ced4da'}`,
              borderRadius: 8,
              padding: '32px 24px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: isDragActive ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <input {...getInputProps()} />
            <Stack gap={8} align="center">
              <ThemeIcon size="xl" variant="light" color={allDone && !fileStates.some(s => s.error) ? 'green' : isDragActive ? 'blue' : 'gray'} radius="xl">
                {allDone && !fileStates.some(s => s.error) ? <IconCheck size={20} /> : <IconUpload size={20} />}
              </ThemeIcon>
              <Text size="sm" c={isDragActive ? 'blue' : 'dimmed'}>
                {isDragActive ? 'Drop files here' : 'Click or drag & drop — multiple files supported'}
              </Text>
              <Text size="xs" c="dimmed">Images, PDF, TIFF, ZIP · Max 20MB each</Text>
            </Stack>
          </Box>

          {hasFiles && (
            <Stack gap={6}>
              {fileStates.map((s, i) => (
                <Box key={i} style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, padding: '8px 12px' }}>
                  <Group justify="space-between" wrap="nowrap" mb={s.error || (!s.success && s.progress > 0) ? 4 : 0}>
                    <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                      <IconFile size={14} style={{ flexShrink: 0 }} />
                      <Text size="xs" truncate style={{ maxWidth: 280 }}>{s.file.name}</Text>
                    </Group>
                    {s.success && <Badge size="xs" color="green">Done</Badge>}
                    {s.error && <Badge size="xs" color="red">Failed</Badge>}
                    {!s.success && !s.error && s.progress > 0 && (
                      <Text size="xs" c="dimmed">{s.progress}%</Text>
                    )}
                  </Group>
                  {!s.success && !s.error && s.progress > 0 && (
                    <Progress value={s.progress} animated={s.progress < 100} size="xs" />
                  )}
                  {s.error && (
                    <Group gap={4}>
                      <IconX size={11} color="red" />
                      <Text size="xs" c="red">{s.error}</Text>
                    </Group>
                  )}
                </Box>
              ))}
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
        </Stack>
      </Modal>
    </>
  );
}

"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Text, Image, ThemeIcon, Stack, Group } from "@mantine/core";
import { IconUpload, IconFileTypePdf, IconX } from "@tabler/icons-react";

interface Props {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  required?: boolean;
  error?: string;
}

async function uploadToTransloadit(file: File): Promise<string> {
  const sigRes = await fetch("/api/transloadit/signature");
  if (!sigRes.ok) throw new Error("Failed to get upload signature");
  const { params, signature } = await sigRes.json();

  const formData = new FormData();
  formData.append("params", params);
  formData.append("signature", signature);
  formData.append("file", file);

  const res = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  const url = data.uploads?.[0]?.ssl_url;
  if (!url) throw new Error("No URL returned from upload");
  return url;
}

export default function FileUploadField({ label, value, onChange, required, error: fieldError }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = async (accepted: File[], rejected: typeof dropzone.fileRejections) => {
    if (rejected.length > 0) {
      setError("Invalid file type. Please upload an image or PDF.");
      return;
    }
    const file = accepted[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadToTransloadit(file);
      onChange(url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const dropzone = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  const { getRootProps, getInputProps, isDragActive } = dropzone;

  const isPdf = value?.toLowerCase().endsWith(".pdf");

  return (
    <Stack gap={6}>
      <Text size="sm" fw={500}>{label}{required && <span style={{ color: "var(--mantine-color-red-6)", marginLeft: 2 }}>*</span>}</Text>

      {value ? (
        <Box>
          <Box
            {...getRootProps()}
            style={{
              position: "relative",
              display: "inline-block",
              cursor: "pointer",
              borderRadius: 8,
              outline: isDragActive ? "2px solid var(--mantine-color-blue-5)" : "none",
            }}
          >
            <input {...getInputProps()} />
            {isPdf ? (
              <Box
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  border: "1px solid #dee2e6",
                  borderRadius: 6,
                  background: "#fff5f5",
                }}
              >
                <ThemeIcon color="red" variant="light" size="sm">
                  <IconFileTypePdf size={14} />
                </ThemeIcon>
                <Text size="xs" c="red.7">PDF uploaded</Text>
              </Box>
            ) : (
              <Image
                src={value}
                alt={label}
                maw={200}
                radius="sm"
                style={{ border: "1px solid #dee2e6", display: "block" }}
              />
            )}
            <Box
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.45)",
                borderRadius: 6,
                opacity: isDragActive ? 1 : 0,
                transition: "opacity 0.15s",
              }}
            >
              <Text size="xs" c="white" fw={600}>Drop to replace</Text>
            </Box>
          </Box>
          <Text
            size="xs"
            c="dimmed"
            mt={4}
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={getRootProps().onClick}
          >
            {uploading ? "Uploading…" : "Click or drop to replace"}
          </Text>
        </Box>
      ) : (
        <Box
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? "var(--mantine-color-blue-5)" : "#ced4da"}`,
            borderRadius: 8,
            padding: "20px 16px",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: isDragActive ? "var(--mantine-color-blue-0)" : "var(--mantine-color-gray-0)",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <input {...getInputProps()} />
          <Stack gap={6} align="center">
            <ThemeIcon size="lg" variant="light" color={isDragActive ? "blue" : "gray"} radius="xl">
              {uploading ? (
                <Box
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid currentColor",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
              ) : (
                <IconUpload size={16} />
              )}
            </ThemeIcon>
            <Text size="sm" c={isDragActive ? "blue" : "dimmed"}>
              {uploading ? "Uploading…" : isDragActive ? "Drop file here" : "Click or drag & drop"}
            </Text>
            <Text size="xs" c="dimmed">Images or PDF</Text>
          </Stack>
        </Box>
      )}

      {(error || fieldError) && (
        <Group gap={4}>
          <IconX size={12} color="red" />
          <Text size="xs" c="red">{error || fieldError}</Text>
        </Group>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Stack>
  );
}

"use client";

import { useState } from "react";
import { FileInput, Text, Stack, Image, Box } from "@mantine/core";

interface Props {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

export default function FileUploadField({ label, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setError("Upload failed. Please try again.");
        return;
      }

      const { url } = await res.json();
      onChange(url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack gap="xs">
      <FileInput
        label={label}
        placeholder={uploading ? "Uploading..." : "Click to upload"}
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}
      {value && (
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Uploaded:
          </Text>
          <Image
            src={value}
            alt={label}
            maw={200}
            radius="sm"
            style={{ border: "1px solid #dee2e6" }}
          />
        </Box>
      )}
    </Stack>
  );
}

"use client";

import { useState } from "react";
import { FileInput, Text, Stack, Image, Box } from "@mantine/core";

interface Props {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
}

export default function FileUploadField({ label, value, onChange }: Props) {
  const [error, setError] = useState("");

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) onChange(dataUrl);
    };
    reader.onerror = () => setError("Failed to read file. Please try again.");
    reader.readAsDataURL(file);
  };

  return (
    <Stack gap="xs">
      <FileInput
        label={label}
        placeholder="Click to upload"
        accept="image/*"
        onChange={handleFileChange}
      />
      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}
      {value && (
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Selected:
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

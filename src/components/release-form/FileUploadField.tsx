"use client";

import { useState } from "react";
import { FileInput, Text, Stack, Image, Box, ThemeIcon } from "@mantine/core";
import { IconFileTypePdf } from "@tabler/icons-react";

interface Props {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  accept?: string;
}

export default function FileUploadField({ label, value, onChange, accept = "image/*" }: Props) {
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

  const isPdf = value?.startsWith("data:application/pdf");

  return (
    <Stack gap="xs">
      <FileInput
        label={label}
        placeholder="Click to upload"
        accept={accept}
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
              style={{ border: "1px solid #dee2e6" }}
            />
          )}
        </Box>
      )}
    </Stack>
  );
}

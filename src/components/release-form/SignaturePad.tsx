"use client";

import { useRef, useState } from "react";
import { Box, Button, Group, Text, Stack } from "@mantine/core";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  error?: string;
}

export default function SignaturePad({ value, onChange, error }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      onChange(dataUrl);
      setIsEmpty(false);
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onChange("");
    setIsEmpty(true);
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Signature <span style={{ color: "red" }}>*</span>
      </Text>
      <Box
        style={{
          border: error ? "1px solid #fa5252" : "1px solid #ced4da",
          borderRadius: 4,
          background: "#fff",
          display: "inline-block",
        }}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 500,
            height: 150,
            style: { display: "block" },
          }}
          onEnd={handleEnd}
        />
      </Box>
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
      <Group>
        <Button variant="light" size="xs" onClick={handleClear}>
          Clear Signature
        </Button>
        {isEmpty && (
          <Text size="xs" c="dimmed">
            Draw your signature above
          </Text>
        )}
      </Group>
      {value && !value.startsWith("data:") && (
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Current signature:
          </Text>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Saved signature"
            style={{ border: "1px solid #dee2e6", borderRadius: 4, maxWidth: 500 }}
          />
        </Box>
      )}
    </Stack>
  );
}

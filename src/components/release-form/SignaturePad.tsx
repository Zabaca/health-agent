"use client";

import { useRef, useState, useEffect } from "react";
import { Box, Button, Group, Text, Stack } from "@mantine/core";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  error?: string;
}

export default function SignaturePad({ value, onChange, error }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [canvasWidth, setCanvasWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width > 0) {
        setCanvasWidth(width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const [hasDrawing, setHasDrawing] = useState(false);

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setHasDrawing(true);
    }
  };

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      onChange(dataUrl);
      setIsEmpty(false);
      setHasDrawing(false);
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onChange("");
    setIsEmpty(true);
    setHasDrawing(false);
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Signature <span style={{ color: "red" }}>*</span>
      </Text>
      <Box
        ref={containerRef}
        style={{
          border: error ? "1px solid #fa5252" : "1px solid #ced4da",
          borderRadius: 4,
          background: "#fff",
          width: "100%",
        }}
      >
        {canvasWidth > 0 && (
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{
              width: canvasWidth,
              height: 150,
              style: { display: "block" },
            }}
            onEnd={handleEnd}
          />
        )}
      </Box>
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
      <Group>
        {hasDrawing && (
          <Button variant="filled" size="xs" onClick={handleSave}>
            Save Signature
          </Button>
        )}
        <Button variant="light" size="xs" onClick={handleClear}>
          Clear Signature
        </Button>
        {isEmpty && !hasDrawing && (
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
            style={{ border: "1px solid #dee2e6", borderRadius: 4, maxWidth: "100%" }}
          />
        </Box>
      )}
    </Stack>
  );
}

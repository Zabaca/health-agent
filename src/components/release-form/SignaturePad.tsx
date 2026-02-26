"use client";

import { useRef, useState, useEffect } from "react";
import { Box, Button, Group, Text, Stack } from "@mantine/core";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  error?: string;
  typedName?: string;
}

export default function SignaturePad({ value, onChange, error, typedName }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hasDrawing, setHasDrawing] = useState(false);

  // Show the canvas when there is no saved signature; show preview otherwise.
  const [resignMode, setResignMode] = useState(!value);

  // Keep a ref to the value that was in place when the user entered resign mode,
  // so "Keep existing" can restore it if they change their mind.
  const priorValueRef = useRef(value ?? "");

  // Prevents the value-change effect from switching to preview mode when the
  // value update originated from our own auto-draw (typing a name).
  const isAutoDrawRef = useRef(false);

  // When true, the user clicked "Re-sign" to draw manually — typed-name
  // auto-draw will not override their drawing.
  const [isManualMode, setIsManualMode] = useState(false);

  // Set up the ResizeObserver only while the canvas container is mounted
  // (i.e. while resignMode is true).
  useEffect(() => {
    if (!resignMode) {
      setCanvasWidth(0);
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width > 0) setCanvasWidth(width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [resignMode]);

  // If the value prop is populated after initial mount (e.g. defaultValues resolved),
  // switch to preview mode so the saved signature is shown.
  // Skip when the update came from our own auto-draw so the canvas stays open while typing.
  useEffect(() => {
    if (isAutoDrawRef.current) {
      isAutoDrawRef.current = false;
      return;
    }
    if (value && resignMode) {
      setResignMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Auto-draw the typed name to an offscreen canvas and immediately switch to
  // preview — the user never has to click "Save Signature" for typed names.
  // Uses an offscreen canvas so it works regardless of resignMode.
  useEffect(() => {
    if (typedName === undefined || isManualMode || !typedName.trim()) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = 400;
    offscreen.height = 100;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.font = "italic 40px 'Segoe Script', 'Brush Script MT', cursive";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName.trim(), offscreen.width / 2, offscreen.height / 2);

    isAutoDrawRef.current = true;
    onChange(offscreen.toDataURL("image/png"));
    setResignMode(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedName, isManualMode]);

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setHasDrawing(true);
    }
  };

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      onChange(dataUrl);
      setResignMode(false);
      setHasDrawing(false);
      setIsManualMode(false);
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    setHasDrawing(false);
  };

  const handleResign = () => {
    priorValueRef.current = value ?? "";
    sigRef.current?.clear();
    setHasDrawing(false);
    setIsManualMode(true);
    setResignMode(true);
  };

  const handleKeepExisting = () => {
    // Restore the value that was in place before entering resign mode
    onChange(priorValueRef.current);
    sigRef.current?.clear();
    setHasDrawing(false);
    setIsManualMode(false);
    setResignMode(false);
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Patient Signature <span style={{ color: "red" }}>*</span>
      </Text>

      {/* Saved signature preview */}
      {!resignMode && value && (
        <Box
          style={{
            border: error ? "1px solid #fa5252" : "1px solid #ced4da",
            borderRadius: 4,
            background: "#fff",
            padding: 8,
            minHeight: 80,
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Saved signature" style={{ maxHeight: 100, display: "block" }} />
        </Box>
      )}

      {/* Drawing canvas */}
      {resignMode && (
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
      )}

      {error && <Text size="xs" c="red">{error}</Text>}

      <Group>
        {/* Canvas mode controls */}
        {resignMode && hasDrawing && (
          <Button variant="filled" size="xs" onClick={handleSave}>
            Save Signature
          </Button>
        )}
        {resignMode && (
          <Button variant="light" size="xs" onClick={handleClear}>
            Clear
          </Button>
        )}
        {resignMode && !hasDrawing && (
          <Text size="xs" c="dimmed">
            {typedName !== undefined
              ? "Type your name above to auto-sign, or draw here"
              : "Draw your signature above"}
          </Text>
        )}
        {resignMode && priorValueRef.current && (
          <Button variant="subtle" size="xs" onClick={handleKeepExisting}>
            Keep existing
          </Button>
        )}

        {/* Preview mode controls */}
        {!resignMode && value && (
          <Button variant="light" size="xs" onClick={handleResign}>
            Re-sign
          </Button>
        )}
      </Group>
    </Stack>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Button, Alert, Paper, Title, Text, TextInput, SimpleGrid } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconPencil } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api/client";

const SignaturePad = dynamic(() => import("@/components/release-form/SignaturePad"), { ssr: false });

export default function SignReleaseSection({ releaseId }: { releaseId: string }) {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sigValue, setSigValue] = useState("");
  const [printedName, setPrintedName] = useState("");
  const [authDate, setAuthDate] = useState<Date | null>(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");

  const handleSign = async () => {
    let valid = true;
    setNameError("");
    setDateError("");
    setError("");

    if (!printedName.trim()) {
      setNameError("Printed name is required");
      valid = false;
    }
    if (!authDate) {
      setDateError("Date is required");
      valid = false;
    }
    if (!sigValue) return;
    if (!valid) return;

    setLoading(true);
    try {
      let signatureUrl = sigValue;
      if (sigValue.startsWith("data:")) {
        const ext = sigValue.startsWith("data:image/png") ? "png" : "jpg";
        const uploadResult = await apiClient.upload({ body: { data: sigValue, extension: ext } });
        if (uploadResult.status === 200) signatureUrl = uploadResult.body.url;
      }

      const result = await apiClient.releases.sign({
        params: { id: releaseId },
        body: {
          signatureImage: signatureUrl,
          printedName: printedName.trim(),
          authDate: authDate!.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
        },
      });

      if (result.status === 200) {
        router.refresh();
      } else {
        setError("Failed to save signature. Please try again.");
      }
    } catch {
      setError("Failed to save signature. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Title order={4}>Sign Release</Title>
        <Alert color="yellow" variant="light">
          This release was prepared on your behalf and requires your signature to be complete.
        </Alert>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Printed Name"
            placeholder="Your full name"
            required
            value={printedName}
            onChange={(e) => setPrintedName(e.currentTarget.value)}
            error={nameError}
          />
          <DatePickerInput
            label="Date"
            required
            value={authDate}
            onChange={setAuthDate}
            popoverProps={{ withinPortal: true, zIndex: 300 }}
            error={dateError}
          />
        </SimpleGrid>
        <SignaturePad value={sigValue} onChange={setSigValue} />
        {error && <Text c="red" size="sm">{error}</Text>}
        <Button
          leftSection={<IconPencil size={16} />}
          onClick={handleSign}
          loading={loading}
          disabled={!sigValue}
        >
          Sign Release
        </Button>
      </Stack>
    </Paper>
  );
}

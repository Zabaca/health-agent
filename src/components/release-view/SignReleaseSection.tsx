"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Button, Alert, Paper, Title, Text } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api/client";

const SignaturePad = dynamic(() => import("@/components/release-form/SignaturePad"), { ssr: false });

export default function SignReleaseSection({ releaseId }: { releaseId: string }) {
  const router = useRouter();
  const [sigValue, setSigValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSign = async () => {
    if (!sigValue) return;
    setLoading(true);
    setError("");
    try {
      let signatureUrl = sigValue;
      if (sigValue.startsWith("data:")) {
        const ext = sigValue.startsWith("data:image/png") ? "png" : "jpg";
        const uploadResult = await apiClient.upload({ body: { data: sigValue, extension: ext } });
        if (uploadResult.status === 200) signatureUrl = uploadResult.body.url;
      }

      const result = await apiClient.releases.sign({
        params: { id: releaseId },
        body: { signatureImage: signatureUrl },
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

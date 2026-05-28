"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Modal, Stack, Title, Text, Checkbox, Anchor, Button, Alert } from "@mantine/core";
import { TERMS_URL, PRIVACY_URL, MINIMUM_AGE } from "@health-agent/types";
import IsoDatePickerInput from "@/components/shared/IsoDatePickerInput";

interface Props {
  /** When false, the user has no DOB on file (OAuth) and must supply one here. */
  hasDateOfBirth: boolean;
}

export default function ConsentModal({ hasDateOfBirth }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [tos, setTos] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dobOk = hasDateOfBirth || /^\d{4}-\d{2}-\d{2}$/.test(dob);
  const canSubmit = tos && privacy && dobOk;

  const onSubmit = async () => {
    setError("");
    // Don't block under-18 client-side: the row already exists (OAuth created it
    // at sign-in), so the DOB must reach the server, which purges the account and
    // returns 403 → signed out below.
    setLoading(true);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tosAccepted: true,
          privacyAccepted: true,
          ...(hasDateOfBirth ? {} : { dateOfBirth: dob }),
        }),
      });
      if (res.status === 403) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError((body as { error?: string } | null)?.error ?? "Something went wrong. Please try again.");
        return;
      }
      await update({ consentedAt: new Date().toISOString() });
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened
      onClose={() => {}}
      size="md"
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title={<Title order={4}>Before you continue</Title>}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Veladon is available to adults {MINIMUM_AGE} and over. Please review and accept our terms
          to continue.
        </Text>

        {!hasDateOfBirth && (
          <IsoDatePickerInput
            label="Date of Birth"
            required
            maxDate={new Date()}
            popoverProps={{ withinPortal: true, zIndex: 300 }}
            value={dob}
            onChange={setDob}
          />
        )}

        <Checkbox
          checked={tos}
          onChange={(e) => setTos(e.currentTarget.checked)}
          label={
            <Text size="sm">
              I agree to the{" "}
              <Anchor href={TERMS_URL} target="_blank" rel="noreferrer">
                Terms of Service
              </Anchor>
            </Text>
          }
        />
        <Checkbox
          checked={privacy}
          onChange={(e) => setPrivacy(e.currentTarget.checked)}
          label={
            <Text size="sm">
              I agree to the{" "}
              <Anchor href={PRIVACY_URL} target="_blank" rel="noreferrer">
                Privacy Policy
              </Anchor>
            </Text>
          }
        />

        {error && <Alert color="red">{error}</Alert>}

        <Button onClick={onSubmit} disabled={!canSubmit} loading={loading} fullWidth>
          Continue
        </Button>
      </Stack>
    </Modal>
  );
}

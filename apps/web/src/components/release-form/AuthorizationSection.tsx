"use client";

import { useEffect, useMemo, useState } from "react";
import { TextInput, Title, Paper, Stack, SimpleGrid, Text, Select, Badge } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";
import type { UseFormSetValue } from "react-hook-form";
import dynamic from "next/dynamic";
import type { ReleaseFormData } from "@/types/release";
import IsoDatePickerInput from "@/components/shared/IsoDatePickerInput";

const SignaturePad = dynamic(() => import("./SignaturePad"), { ssr: false });

export interface RecipientOption {
  id: string;
  type: 'agent' | 'pda';
  label: string;
  relationship?: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
}

interface StaffModeProps {
  mode: 'admin' | 'agent' | 'pda';
  agentInfo: {
    firstName: string;
    lastName: string;
    organization?: string;
    address: string;
    phone: string;
    email: string | null;
    relationship?: string | null;
  };
}

interface Props {
  recipients?: RecipientOption[];
  staffMode?: StaffModeProps;
}

function AgentField({ label, value }: { label: string; value?: string | null }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={500}>{label}</Text>
      <Text size="sm">{value || "—"}</Text>
    </Stack>
  );
}

// Sentinel value for the "release to myself" option (no PDA representative).
const SELF_RECIPIENT_ID = "self";

function populateRecipient(recipient: RecipientOption, setValue: UseFormSetValue<ReleaseFormData>) {
  setValue("releaseAuthAgent", true);
  setValue("designatedAgentId", recipient.type === "pda" ? recipient.id : undefined);
  setValue("authAgentFirstName", recipient.firstName ?? "");
  setValue("authAgentLastName", recipient.lastName ?? "");
  setValue("authAgentAddress", recipient.address ?? "");
  setValue("authAgentPhone", recipient.phoneNumber ?? "");
  setValue("authAgentEmail", recipient.email ?? "");
}

// "I'm making the request myself" — clear all agent fields so the release is
// stored as self-authorized (matches the mobile release wizard's "self" choice).
function populateSelf(setValue: UseFormSetValue<ReleaseFormData>) {
  setValue("releaseAuthAgent", false);
  setValue("designatedAgentId", undefined);
  setValue("authAgentFirstName", "");
  setValue("authAgentLastName", "");
  setValue("authAgentOrganization", "");
  setValue("authAgentAddress", "");
  setValue("authAgentPhone", "");
  setValue("authAgentEmail", "");
}

export default function AuthorizationSection({ recipients, staffMode }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext<ReleaseFormData>();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minExpirationDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 90);
    return d;
  }, []);

  const sigValue = watch("authSignatureImage");
  const printedName = watch("authPrintedName");

  // Patient mode: the "Give authorization to" picker always offers a "self"
  // option (default) followed by the patient's PDAs — mirroring the mobile
  // release wizard, where the patient can release to themselves even when a
  // designated agent exists.
  const patientRecipients = !staffMode ? (recipients ?? []) : [];
  const showPicker = patientRecipients.length > 0;

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(() => {
    // Preserve an existing agent selection when editing; otherwise default to self.
    if (!getValues("releaseAuthAgent")) return SELF_RECIPIENT_ID;
    const existingId = getValues("designatedAgentId");
    if (existingId && patientRecipients.some((r) => r.id === existingId)) return existingId;
    return patientRecipients[0]?.id ?? SELF_RECIPIENT_ID;
  });

  // Apply the initial selection to the form once on mount so the agent fields
  // stay consistent with the picker (self clears them; a PDA populates them).
  useEffect(() => {
    if (staffMode || !showPicker) return;
    if (selectedRecipientId === SELF_RECIPIENT_ID) {
      populateSelf(setValue);
    } else {
      const recipient = patientRecipients.find((r) => r.id === selectedRecipientId);
      if (recipient) populateRecipient(recipient, setValue);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRecipientSelect(id: string | null) {
    const next = id ?? SELF_RECIPIENT_ID;
    setSelectedRecipientId(next);
    if (next === SELF_RECIPIENT_ID) {
      populateSelf(setValue);
      return;
    }
    const recipient = patientRecipients.find((r) => r.id === next);
    if (recipient) populateRecipient(recipient, setValue);
  }

  // Staff mode: pre-populate from logged-in staff member's info (runs once on mount)
  useEffect(() => {
    if (!staffMode) return;
    setValue("releaseAuthAgent", true);
    setValue("authAgentFirstName", staffMode.agentInfo.firstName);
    setValue("authAgentLastName", staffMode.agentInfo.lastName);
    setValue("authAgentOrganization", staffMode.agentInfo.organization ?? "");
    setValue("authAgentAddress", staffMode.agentInfo.address);
    setValue("authAgentPhone", staffMode.agentInfo.phone);
    setValue("authAgentEmail", staffMode.agentInfo.email ?? "");
    setValue("authSignatureImage", "");
    if (staffMode.mode === 'admin') {
      setValue("releaseAuthZabaca", true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignatureChange = (dataUrl: string) => {
    setValue("authSignatureImage", dataUrl);
    trigger("authSignatureImage");
  };

  const selectedRecipient = patientRecipients.find(r => r.id === selectedRecipientId) ?? null;

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4} mb="md">
        Authorization
      </Title>
      <Stack gap="md">
        {/* Patient mode: "Give authorization to" picker — self (default) + PDAs */}
        {showPicker && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Individual/Organization to Receive the Information</Title>
              <Select
                label="Give authorization to"
                placeholder="Select a recipient"
                required
                allowDeselect={false}
                data={[
                  { value: SELF_RECIPIENT_ID, label: "Myself — I'm making the request" },
                  ...patientRecipients.map(r => ({ value: r.id, label: r.label })),
                ]}
                value={selectedRecipientId}
                onChange={handleRecipientSelect}
                renderOption={({ option }) => {
                  if (option.value === SELF_RECIPIENT_ID) {
                    return (
                      <Stack gap={2}>
                        <Text size="sm">{option.label}</Text>
                        <Badge size="xs" variant="light" color="blue">
                          You · No representative
                        </Badge>
                      </Stack>
                    );
                  }
                  const r = patientRecipients.find(x => x.id === option.value);
                  return (
                    <Stack gap={2}>
                      <Text size="sm">{option.label}</Text>
                      <Badge size="xs" variant="light" color={r?.type === 'agent' ? 'violet' : 'teal'}>
                        {r?.type === 'agent' ? 'Veladon Agent' : (r?.relationship ?? 'Representative')}
                      </Badge>
                    </Stack>
                  );
                }}
              />
              {selectedRecipient ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <AgentField label="First Name" value={selectedRecipient.firstName} />
                  <AgentField label="Last Name" value={selectedRecipient.lastName} />
                  <AgentField label="Email" value={selectedRecipient.email} />
                  <AgentField label="Phone" value={selectedRecipient.phoneNumber} />
                </SimpleGrid>
              ) : (
                <Text size="sm" c="dimmed">
                  The records will be released to you directly. No representative will be authorized to receive them on your behalf.
                </Text>
              )}
            </Stack>
          </Paper>
        )}

        {/* Staff mode: disabled inputs pre-filled from logged-in staff member */}
        {staffMode && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Individual/Organization to Receive the Information</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="First Name" disabled {...register("authAgentFirstName")} />
                <TextInput label="Last Name" disabled {...register("authAgentLastName")} />
              </SimpleGrid>
              <AgentField
                label="Relationship to Patient"
                value={
                  staffMode.agentInfo.relationship && staffMode.agentInfo.relationship !== 'Other'
                    ? `Authorized Representative (${staffMode.agentInfo.relationship})`
                    : "Authorized Representative"
                }
              />
              <TextInput label="Organization" disabled {...register("authAgentOrganization")} />
              <TextInput label="Address" disabled {...register("authAgentAddress")} />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="Phone Number" disabled {...register("authAgentPhone")} />
                <TextInput label="Email" type="email" disabled {...register("authAgentEmail")} />
              </SimpleGrid>
            </Stack>
          </Paper>
        )}

        {!staffMode && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Controller
                name="authExpirationDate"
                control={control}
                render={({ field }) => (
                  <IsoDatePickerInput
                    label="Authorization Expiration Date"
                    required
                    minDate={minExpirationDate}
                    popoverProps={{ withinPortal: true, zIndex: 300 }}
                    error={errors.authExpirationDate?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <TextInput
                label="Expiration Event"
                placeholder="e.g., Upon completion of treatment"
                error={errors.authExpirationEvent?.message}
                {...register("authExpirationEvent")}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Patient Printed Name"
                required
                error={errors.authPrintedName?.message}
                {...register("authPrintedName")}
              />
              <Controller
                name="authDate"
                control={control}
                render={({ field }) => (
                  <IsoDatePickerInput
                    label="Date"
                    required
                    minDate={today}
                    popoverProps={{ withinPortal: true, zIndex: 300 }}
                    error={errors.authDate?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </SimpleGrid>
          </>
        )}

        {staffMode ? (
          <TextInput label="Patient Signature" disabled placeholder="Patient will sign when reviewing" />
        ) : (
          <Controller
            name="authSignatureImage"
            control={control}
            render={() => (
              <SignaturePad
                value={sigValue}
                onChange={handleSignatureChange}
                error={errors.authSignatureImage?.message}
                typedName={printedName}
              />
            )}
          />
        )}
      </Stack>
    </Paper>
  );
}

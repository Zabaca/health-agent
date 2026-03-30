"use client";

import { useEffect, useMemo, useState } from "react";
import { TextInput, Title, Paper, Stack, SimpleGrid, Text, Select, Badge } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useFormContext, Controller } from "react-hook-form";
import type { UseFormSetValue } from "react-hook-form";
import dynamic from "next/dynamic";
import type { ReleaseFormData } from "@/types/release";

const SignaturePad = dynamic(() => import("./SignaturePad"), { ssr: false });

export interface RecipientOption {
  id: string;
  type: 'agent' | 'pda';
  label: string;
  relationship?: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
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
    email: string;
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

function populateRecipient(recipient: RecipientOption, setValue: UseFormSetValue<ReleaseFormData>) {
  setValue("releaseAuthAgent", true);
  setValue("authAgentFirstName", recipient.firstName ?? "");
  setValue("authAgentLastName", recipient.lastName ?? "");
  setValue("authAgentAddress", recipient.address ?? "");
  setValue("authAgentPhone", recipient.phoneNumber ?? "");
  setValue("authAgentEmail", recipient.email);
}

export default function AuthorizationSection({ recipients, staffMode }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
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

  // For patient mode: track selected recipient when there are multiple options
  const hasMultiple = !staffMode && (recipients?.length ?? 0) > 1;
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    hasMultiple ? null : (recipients?.[0]?.id ?? null)
  );

  // Patient mode: auto-populate when only one recipient (no selection needed)
  useEffect(() => {
    if (staffMode || hasMultiple) return;
    const recipient = recipients?.[0];
    if (!recipient) return;
    populateRecipient(recipient, setValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Patient mode: populate fields when user selects a recipient
  function handleRecipientSelect(id: string | null) {
    setSelectedRecipientId(id);
    if (!id) return;
    const recipient = recipients?.find(r => r.id === id);
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
    setValue("authAgentEmail", staffMode.agentInfo.email);
    setValue("authSignatureImage", "");
    if (staffMode.mode === 'admin') {
      setValue("releaseAuthZabaca", true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignatureChange = (dataUrl: string) => {
    setValue("authSignatureImage", dataUrl);
    trigger("authSignatureImage");
  };

  const selectedRecipient = recipients?.find(r => r.id === selectedRecipientId) ?? null;

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4} mb="md">
        Authorization
      </Title>
      <Stack gap="md">
        {/* Patient mode: multiple recipients — show dropdown */}
        {hasMultiple && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Individual/Organization to Receive the Information</Title>
              <Select
                label="Give authorization to"
                placeholder="Select a recipient"
                required
                allowDeselect={false}
                data={recipients!.map(r => ({
                  value: r.id,
                  label: r.label,
                }))}
                value={selectedRecipientId}
                onChange={handleRecipientSelect}
                renderOption={({ option }) => {
                  const r = recipients!.find(x => x.id === option.value);
                  return (
                    <Stack gap={2}>
                      <Text size="sm">{option.label}</Text>
                      <Badge size="xs" variant="light" color={r?.type === 'agent' ? 'violet' : 'teal'}>
                        {r?.type === 'agent' ? 'Zabaca Agent' : (r?.relationship ?? 'Representative')}
                      </Badge>
                    </Stack>
                  );
                }}
              />
              {selectedRecipient && (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <AgentField label="First Name" value={selectedRecipient.firstName} />
                  <AgentField label="Last Name" value={selectedRecipient.lastName} />
                  <AgentField label="Email" value={selectedRecipient.email} />
                  <AgentField label="Phone" value={selectedRecipient.phoneNumber} />
                </SimpleGrid>
              )}
            </Stack>
          </Paper>
        )}

        {/* Patient mode: single recipient — show as read-only */}
        {!hasMultiple && !staffMode && recipients?.[0] && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Individual/Organization to Receive the Information</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <AgentField label="First Name" value={recipients[0].firstName} />
                <AgentField label="Last Name" value={recipients[0].lastName} />
              </SimpleGrid>
              <AgentField label="Relationship to Patient" value="Authorized Representative" />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <AgentField label="Phone Number" value={recipients[0].phoneNumber} />
                <AgentField label="Email" value={recipients[0].email} />
              </SimpleGrid>
              <AgentField label="Address" value={recipients[0].address} />
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
                  <DatePickerInput
                    label="Authorization Expiration Date"
                    placeholder="MM/DD/YYYY"
                    required
                    minDate={minExpirationDate}
                    popoverProps={{ withinPortal: true, zIndex: 300 }}
                    error={errors.authExpirationDate?.message}
                    value={field.value && !isNaN(Date.parse(field.value)) ? new Date(field.value) : null}
                    onChange={(date) =>
                      field.onChange(
                        date
                          ? date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                          : ""
                      )
                    }
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
                  <DatePickerInput
                    label="Date"
                    placeholder="MM/DD/YYYY"
                    required
                    minDate={today}
                    popoverProps={{ withinPortal: true, zIndex: 300 }}
                    error={errors.authDate?.message}
                    value={field.value && !isNaN(Date.parse(field.value)) ? new Date(field.value) : null}
                    onChange={(date) =>
                      field.onChange(
                        date
                          ? date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                          : ""
                      )
                    }
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

"use client";

import { useEffect, useMemo } from "react";
import { TextInput, Title, Paper, Stack, SimpleGrid, Text } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useFormContext, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import type { ReleaseFormData } from "@/types/release";

const SignaturePad = dynamic(() => import("./SignaturePad"), { ssr: false });

interface AssignedAgent {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

interface StaffModeProps {
  mode: 'admin' | 'agent';
  agentInfo: {
    firstName: string;
    lastName: string;
    organization?: string;
    address: string;
    phone: string;
    email: string;
  };
}

interface Props {
  assignedAgent?: AssignedAgent | null;
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

export default function AuthorizationSection({ assignedAgent, staffMode }: Props) {
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

  // Patient mode: auto-populate agent fields from the assigned agent (runs once on mount)
  useEffect(() => {
    if (!assignedAgent || staffMode) return;
    setValue("releaseAuthAgent", true);
    setValue("authAgentFirstName", assignedAgent.firstName ?? "");
    setValue("authAgentLastName", assignedAgent.lastName ?? "");
    setValue("authAgentAddress", assignedAgent.address ?? "");
    setValue("authAgentPhone", assignedAgent.phoneNumber ?? "");
    setValue("authAgentEmail", assignedAgent.email);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4} mb="md">
        Authorization
      </Title>
      <Stack gap="md">
        {/* Patient mode: show assigned agent as read-only text */}
        {assignedAgent && !staffMode && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Agent Details</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <AgentField label="First Name" value={assignedAgent.firstName} />
                <AgentField label="Last Name" value={assignedAgent.lastName} />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <AgentField label="Phone Number" value={assignedAgent.phoneNumber} />
                <AgentField label="Email" value={assignedAgent.email} />
              </SimpleGrid>
              <AgentField label="Address" value={assignedAgent.address} />
            </Stack>
          </Paper>
        )}

        {/* Staff mode: disabled inputs pre-filled from logged-in staff member */}
        {staffMode && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Agent Details</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="First Name" disabled {...register("authAgentFirstName")} />
                <TextInput label="Last Name" disabled {...register("authAgentLastName")} />
              </SimpleGrid>
              <TextInput label="Organization" disabled {...register("authAgentOrganization")} />
              <TextInput label="Address" disabled {...register("authAgentAddress")} />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="Phone Number" disabled {...register("authAgentPhone")} />
                <TextInput label="Email" type="email" disabled {...register("authAgentEmail")} />
              </SimpleGrid>
            </Stack>
          </Paper>
        )}

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
                popoverProps={{ zIndex: 150 }}
                error={errors.authExpirationDate?.message}
                value={field.value ? new Date(field.value) : null}
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
            label="Printed Name"
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
                popoverProps={{ zIndex: 150 }}
                error={errors.authDate?.message}
                value={field.value ? new Date(field.value) : null}
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

        {staffMode ? (
          <TextInput label="Patient Signature" disabled placeholder="Patient Signature" />
        ) : (
          <Controller
            name="authSignatureImage"
            control={control}
            render={() => (
              <SignaturePad
                value={sigValue}
                onChange={handleSignatureChange}
                error={errors.authSignatureImage?.message}
              />
            )}
          />
        )}
      </Stack>
    </Paper>
  );
}

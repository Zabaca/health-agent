"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Modal,
  Stepper,
  Text,
  Title,
  Stack,
  Avatar,
  Group,
  List,
  ThemeIcon,
  Button,
  Box,
} from "@mantine/core";
import { IconCircleCheck, IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import ProfileForm from "@/components/profile/ProfileForm";
import MyProvidersForm from "@/components/my-providers/MyProvidersForm";
import ReleaseForm from "@/components/release-form/ReleaseForm";
import ScheduleCallForm from "@/components/schedule-call/ScheduleCallForm";
import { apiClient } from "@/lib/api/client";
import type { ProfileFormData } from "@/lib/schemas/profile";
import type { MyProviderFormData, ReleaseFormData } from "@/lib/schemas/release";

interface AssignedAgent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  avatarUrl: string | null;
}

interface Props {
  assignedAgent: AssignedAgent | null;
  initialProfileValues: ProfileFormData;
  initialProviderValues: MyProviderFormData[];
  releaseDefaultValues: Partial<ReleaseFormData>;
  initialReleaseId?: string;
}

export default function OnboardingModal({
  assignedAgent,
  initialProfileValues,
  initialProviderValues,
  releaseDefaultValues,
  initialReleaseId,
}: Props) {
  const router = useRouter();
  const { data: session, update } = useSession();

  // If the JWT already says onboarded (e.g. stale router cache), close immediately.
  const [completed, setCompleted] = useState(session?.user?.onboarded === true);
  const [activeStep, setActiveStep] = useState(0);

  // Per-step completion tracking
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileValues, setProfileValues] = useState<ProfileFormData>(initialProfileValues);
  const [providerValues, setProviderValues] = useState<MyProviderFormData[]>(initialProviderValues);
  const [savedReleaseId, setSavedReleaseId] = useState<string | undefined>(initialReleaseId);

  const agentName = assignedAgent
    ? [assignedAgent.firstName, assignedAgent.lastName].filter(Boolean).join(" ") || assignedAgent.email
    : null;

  // Bust the router cache on every mount. If the server no longer includes this
  // modal in its RSC output (user is onboarded), React will unmount it after refresh.
  useEffect(() => {
    router.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = async () => {
    await apiClient.onboarding.complete({});
    await update({ onboarded: true });
    setCompleted(true);
    router.refresh();
  };


  const goBack = () => setActiveStep((s) => Math.max(0, s - 1));

  const canGoBack = activeStep > 0;
  const canGoForward =
    (activeStep === 1 && profileSaved) ||
    (activeStep === 2 && providerValues.length > 0) ||
    (activeStep === 3 && savedReleaseId !== undefined);

  return (
    <Modal
      opened={!completed}
      onClose={() => {}}
      size="xl"
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: "50dvh",
          maxHeight: "90dvh",
        },
        body: {
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          padding: 0,
        },
      }}
    >
      {/* Top container: title + stepper + nav — never scrolls */}
      <Box
        px="md"
        pt="md"
        pb="sm"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}
      >
        <Title order={3} mb="md">Welcome to Your Health Portal</Title>

        <Stepper active={activeStep} w="100%" mb={canGoBack || canGoForward ? "sm" : 0}>
          <Stepper.Step label="Welcome" />
          <Stepper.Step label="Profile" />
          <Stepper.Step label="Providers" />
          <Stepper.Step label="Release" />
          <Stepper.Step label="Schedule" />
        </Stepper>

        {(canGoBack || canGoForward) && (
          <Group justify="space-between" w="100%">
            {canGoBack ? (
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={14} />}
                onClick={goBack}
                size="sm"
              >
                Back
              </Button>
            ) : <span />}
            {canGoForward && (
              <Button
                variant="subtle"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => setActiveStep((s) => s + 1)}
                size="sm"
              >
                Next
              </Button>
            )}
          </Group>
        )}
      </Box>

      {/* Bottom container: scrollable form content */}
      <Box style={{ flex: 1, minHeight: 0, overflowY: "auto" }} p="md">
        <Stack w="100%" gap="md">
          {/* Step 0: Welcome */}
          {activeStep === 0 && (
            <Stack w="100%" maw={560} mx="auto">
              <Title order={4}>Welcome to Your Health Portal!</Title>
              <Text>
                We&apos;re here to help you manage your medical records and connect you with your
                dedicated health agent. Let&apos;s get your account set up in just a few steps.
              </Text>

              {assignedAgent && (
                <Group
                  p="md"
                  style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: 8 }}
                >
                  <Avatar src={assignedAgent.avatarUrl ?? undefined} size={56} radius="50%">
                    {agentName?.[0]?.toUpperCase() ?? "A"}
                  </Avatar>
                  <Stack gap={2}>
                    <Text fw={600}>{agentName}</Text>
                    <Text size="sm" c="dimmed">Your dedicated agent</Text>
                    <Text size="sm">{assignedAgent.email}</Text>
                  </Stack>
                </Group>
              )}

              <Text fw={500}>Here&apos;s what we&apos;ll set up:</Text>
              <List
                spacing="xs"
                icon={
                  <ThemeIcon color="teal" size={20} radius="xl">
                    <IconCircleCheck size={14} />
                  </ThemeIcon>
                }
              >
                <List.Item>Your personal profile</List.Item>
                <List.Item>Your healthcare providers</List.Item>
                <List.Item>Your medical release authorization</List.Item>
                <List.Item>Schedule your first call with your agent</List.Item>
              </List>

              <Button onClick={() => setActiveStep(1)}>
                Get Started
              </Button>
            </Stack>
          )}

          {/* Step 1: Profile */}
          {activeStep === 1 && (
            <ProfileForm
              defaultValues={profileValues}
              maw="100%"
              onComplete={(data) => {
                setProfileValues(data);
                setProfileSaved(true);
                setActiveStep(2);
              }}
            />
          )}

          {/* Step 2: Providers */}
          {activeStep === 2 && (
            <MyProvidersForm
              defaultValues={providerValues}
              maw="100%"
              onComplete={(providers) => {
                setProviderValues(providers);
                setActiveStep(3);
              }}
            />
          )}

          {/* Step 3: Release */}
          {activeStep === 3 && (
            <ReleaseForm
              key={savedReleaseId ?? "new"}
              releaseId={savedReleaseId}
              defaultValues={
                // If an existing release was loaded from the server, use it as-is.
                // Otherwise, merge profile values saved in step 1 into the defaults
                // since the server-side snapshot may have been empty at initial render.
                savedReleaseId
                  ? releaseDefaultValues
                  : {
                      ...releaseDefaultValues,
                      firstName:      profileValues.firstName      || releaseDefaultValues.firstName      || "",
                      middleName:     profileValues.middleName     || releaseDefaultValues.middleName,
                      lastName:       profileValues.lastName       || releaseDefaultValues.lastName       || "",
                      dateOfBirth:    profileValues.dateOfBirth    || releaseDefaultValues.dateOfBirth    || "",
                      mailingAddress: profileValues.address        || releaseDefaultValues.mailingAddress || "",
                      phoneNumber:    profileValues.phoneNumber    || releaseDefaultValues.phoneNumber    || "",
                      ssn:            profileValues.ssn            || releaseDefaultValues.ssn            || "",
                    }
              }
              assignedAgent={assignedAgent}
              onComplete={(id) => {
                setSavedReleaseId(id);
                setActiveStep(4);
              }}
              onBack={goBack}
            />
          )}

          {/* Step 4: Schedule */}
          {activeStep === 4 && assignedAgent && (
            <ScheduleCallForm
              agentInfo={assignedAgent}
              onComplete={handleComplete}
              maw="100%"
            />
          )}
        </Stack>
      </Box>
    </Modal>
  );
}

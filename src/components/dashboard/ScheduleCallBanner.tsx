"use client";

import { Alert, Button, Tooltip } from "@mantine/core";
import { IconCalendarEvent } from "@tabler/icons-react";
import Link from "next/link";

interface Props {
  disabled?: boolean;
}

export default function ScheduleCallBanner({ disabled }: Props) {
  return (
    <Alert
      icon={<IconCalendarEvent size={16} />}
      title="Schedule a call with your agent"
      color="teal"
      mb="lg"
      style={disabled ? { opacity: 0.6 } : undefined}
    >
      Book a call with your assigned agent to get personalized help.{" "}
      {disabled ? (
        <Tooltip label="Complete your profile first">
          <span>
            <Button size="xs" variant="light" mt="xs" disabled>
              Schedule Call
            </Button>
          </span>
        </Tooltip>
      ) : (
        <Button component={Link} href="/schedule-call" size="xs" variant="light" mt="xs">
          Schedule Call
        </Button>
      )}
    </Alert>
  );
}

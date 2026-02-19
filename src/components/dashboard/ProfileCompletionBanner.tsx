"use client";

import { Alert, Button } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import Link from "next/link";

export default function ProfileCompletionBanner() {
  return (
    <Alert
      icon={<IconUser size={16} />}
      title="Complete your profile"
      color="blue"
      mb="lg"
    >
      Add your personal information to speed up future release requests.{" "}
      <Button component={Link} href="/profile" size="xs" variant="light" mt="xs">
        Complete Profile
      </Button>
    </Alert>
  );
}

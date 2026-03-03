"use client";

import { useState } from "react";
import { Modal, Stack, Text } from "@mantine/core";

export default function MembershipCardImage({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Stack gap={2}>
        <Text size="xs" c="dimmed" fw={500}>{label}</Text>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          onClick={() => setOpened(true)}
          style={{
            maxWidth: 200,
            borderRadius: 4,
            border: "1px solid #dee2e6",
            cursor: "pointer",
          }}
        />
      </Stack>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={label}
        centered
        size="auto"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          style={{ maxWidth: "80vw", maxHeight: "80vh", display: "block" }}
        />
      </Modal>
    </>
  );
}

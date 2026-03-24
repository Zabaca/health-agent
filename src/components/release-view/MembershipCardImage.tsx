"use client";

import { useState } from "react";
import { Modal, Button } from "@mantine/core";

function FilePreview({ src, label }: { src: string; label: string }) {
  const [useIframe, setUseIframe] = useState(false);

  if (useIframe) {
    return (
      <iframe
        src={src}
        title={label}
        style={{ width: "100%", height: "70vh", border: "none" }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      onError={() => setUseIframe(true)}
      style={{ maxWidth: "100%", display: "block" }}
    />
  );
}

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
      <Button variant="light" size="xs" onClick={() => setOpened(true)}>
        {label}
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={label}
        centered
        size="xl"
      >
        <FilePreview src={src} label={label} />
      </Modal>
    </>
  );
}

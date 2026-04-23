'use client';

import { useEffect, useState } from 'react';
import { Modal, Text, Button, Stack } from '@mantine/core';
import { signOut } from 'next-auth/react';

interface Props {
  isPatient: boolean;
}

export default function RevokedAccessModal({ isPatient }: Props) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    setOpened(true);
  }, []);

  const handleSignOut = () => signOut({ callbackUrl: '/login' });
  const handleContinue = () => {
    window.location.href = '/dashboard';
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title={<span style={{ color: '#1a1a2e', fontWeight: 600 }}>Access Revoked</span>}
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dark">
          Your access as a Patient Designated Agent has been revoked. You no longer have permission to represent this patient.
        </Text>
        {isPatient ? (
          <Button fullWidth onClick={handleContinue}>
            Continue as patient
          </Button>
        ) : (
          <Button fullWidth onClick={handleSignOut}>
            Sign out
          </Button>
        )}
      </Stack>
    </Modal>
  );
}

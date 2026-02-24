"use client";

import { SimpleGrid, UnstyledButton, Text } from "@mantine/core";

interface Props {
  value: string;            // "HH:MM"
  onChange: (t: string) => void;
  minTime?: string;         // "HH:MM" — slots before this are disabled
  startHour?: number;       // default 8
  endHour?: number;         // default 20 (exclusive)
  intervalMinutes?: number; // default 30
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatLabel(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function TimeGrid({
  value,
  onChange,
  minTime,
  startHour = 8,
  endHour = 20,
  intervalMinutes = 30,
}: Props) {
  const slots: string[] = [];
  for (let mins = startHour * 60; mins < endHour * 60; mins += intervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  const minMins = minTime ? toMinutes(minTime) : -1;

  return (
    <SimpleGrid cols={4} spacing="xs">
      {slots.map((slot) => {
        const disabled = toMinutes(slot) < minMins;
        const selected = slot === value;

        return (
          <UnstyledButton
            key={slot}
            onClick={() => !disabled && onChange(slot)}
            disabled={disabled}
            style={{
              padding: '6px 4px',
              borderRadius: 6,
              border: '1px solid',
              borderColor: selected ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-default-border)',
              backgroundColor: selected
                ? 'var(--mantine-color-blue-6)'
                : disabled
                ? 'var(--mantine-color-default-hover)'
                : 'var(--mantine-color-body)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Text size="xs" c={selected ? 'white' : disabled ? 'dimmed' : undefined} fw={selected ? 600 : undefined}>
              {formatLabel(slot)}
            </Text>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
}

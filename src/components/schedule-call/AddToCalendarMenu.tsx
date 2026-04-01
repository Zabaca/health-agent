"use client";

import { Menu, Button } from "@mantine/core";
import { IconCalendar, IconChevronDown, IconBrandGoogle } from "@tabler/icons-react";

interface Props {
  callId: string;
  scheduledAt: string;
  size?: "xs" | "sm" | "md";
}

function toGoogleDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export default function AddToCalendarMenu({ callId, scheduledAt, size = "sm" }: Props) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const title = encodeURIComponent("Scheduled Call");
  const description = encodeURIComponent("A health call has been scheduled.");
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}&dates=${toGoogleDate(start)}/${toGoogleDate(end)}&details=${description}`;

  const outlookUrl =
    `https://outlook.live.com/calendar/0/deeplink/compose` +
    `?subject=${title}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}&body=${description}`;

  const office365Url =
    `https://outlook.office.com/calendar/0/deeplink/compose` +
    `?subject=${title}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}&body=${description}`;

  const yahooUrl =
    `https://calendar.yahoo.com/?v=60&title=${title}` +
    `&st=${toGoogleDate(start)}&et=${toGoogleDate(end)}&desc=${description}`;

  const icsUrl = `/api/scheduled-calls/${callId}/ics`;

  return (
    <Menu shadow="md" width={210}>
      <Menu.Target>
        <Button
          variant="light"
          size={size}
          leftSection={<IconCalendar size={size === "xs" ? 12 : 16} />}
          rightSection={<IconChevronDown size={size === "xs" ? 12 : 14} />}
        >
          Add to Calendar
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Choose Calendar</Menu.Label>
        <Menu.Item
          component="a"
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          leftSection={<IconBrandGoogle size={16} />}
        >
          Google Calendar
        </Menu.Item>
        <Menu.Item
          component="a"
          href={outlookUrl}
          target="_blank"
          rel="noopener noreferrer"
          leftSection={<IconCalendar size={16} />}
        >
          Outlook (Personal)
        </Menu.Item>
        <Menu.Item
          component="a"
          href={office365Url}
          target="_blank"
          rel="noopener noreferrer"
          leftSection={<IconCalendar size={16} />}
        >
          Office 365
        </Menu.Item>
        <Menu.Item
          component="a"
          href={yahooUrl}
          target="_blank"
          rel="noopener noreferrer"
          leftSection={<IconCalendar size={16} />}
        >
          Yahoo Calendar
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          component="a"
          href={icsUrl}
          download
          leftSection={<IconCalendar size={16} />}
        >
          Download .ics (Apple / Other)
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

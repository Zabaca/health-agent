"use client";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { SessionProvider } from "next-auth/react";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import PostHogPageView from "@/components/analytics/PostHogPageView";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <PostHogProvider>
          <SessionProvider>
            <MantineProvider>
              <Notifications />
              <PostHogPageView />
              {children}
            </MantineProvider>
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

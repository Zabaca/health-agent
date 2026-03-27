"use client";

import { Group } from "@mantine/core";
import type { ReactNode } from "react";
import classes from "./PageHeader.module.css";

interface Props {
  breadcrumb: ReactNode;
  action?: ReactNode;
  mb?: string | number;
}

export default function BreadcrumbHeader({ breadcrumb, action, mb = "md" }: Props) {
  return (
    <Group justify="space-between" align="center" mb={mb} wrap="nowrap" className={classes.header}>
      {breadcrumb}
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </Group>
  );
}

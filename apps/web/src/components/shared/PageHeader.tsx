"use client";

import { Group, Title } from "@mantine/core";
import type { ReactNode } from "react";
import classes from "./PageHeader.module.css";

interface Props {
  title: string;
  titleOrder?: 1 | 2 | 3 | 4 | 5 | 6;
  action?: ReactNode;
  mb?: string | number;
}

export default function PageHeader({ title, titleOrder = 3, action, mb = "lg" }: Props) {
  return (
    <Group justify="space-between" align="center" mb={mb} className={classes.header}>
      <Title order={titleOrder}>{title}</Title>
      {action}
    </Group>
  );
}

"use client";

import { useState } from "react";
import { Accordion, Button, Paper, Title, Text } from "@mantine/core";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";
import ProviderCard from "./ProviderCard";

const defaultProvider = {
  providerName: "",
  providerType: "Facility" as const,
  historyPhysical: false,
  diagnosticResults: false,
  treatmentProcedure: false,
  prescriptionMedication: false,
  imagingRadiology: false,
  dischargeSummaries: false,
  specificRecords: false,
  allAvailableDates: false,
};

export default function ProviderList() {
  const { control } = useFormContext<ReleaseFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "providers",
  });

  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleAddProvider = () => {
    const newIndex = fields.length;
    append(defaultProvider);
    setOpenItems((prev) => [...prev, `provider-${newIndex}`]);
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4} mb="md">
        Healthcare Providers
      </Title>

      {fields.length === 0 && (
        <Text c="dimmed" size="sm" mb="md">
          No providers added yet. Click &ldquo;Add Provider&rdquo; to get started.
        </Text>
      )}

      <Accordion
        multiple
        value={openItems}
        onChange={setOpenItems}
        variant="separated"
        mb="md"
      >
        {fields.map((field, index) => (
          <ProviderCard
            key={field.id}
            index={index}
            onRemove={() => remove(index)}
          />
        ))}
      </Accordion>

      <Button variant="light" onClick={handleAddProvider}>
        + Add Provider
      </Button>
    </Paper>
  );
}

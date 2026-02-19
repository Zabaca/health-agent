"use client";

import { useState } from "react";
import { Accordion, Alert, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { myProviderSchema, type MyProvidersFormData, type MyProviderFormData } from "@/lib/schemas/release";
import MyProviderCard from "./MyProviderCard";

const schema = z.object({ providers: z.array(myProviderSchema) });

const defaultProvider: MyProviderFormData = {
  providerName: "",
  providerType: "" as unknown as "Medical Group" | "Facility",
};

interface Props {
  defaultValues: MyProviderFormData[];
}

export default function MyProvidersForm({ defaultValues }: Props) {
  const methods = useForm<MyProvidersFormData>({
    resolver: zodResolver(schema),
    defaultValues: { providers: defaultValues },
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "providers",
  });

  const [openItems, setOpenItems] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddProvider = () => {
    const newIndex = fields.length;
    append(defaultProvider);
    setOpenItems((prev) => [...prev, `provider-${newIndex}`]);
  };

  const onSubmit = async (data: MyProvidersFormData) => {
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/my-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers: data.providers }),
      });
      if (!res.ok) throw new Error("Failed to save providers");
      setSuccess(true);
    } catch {
      setError("Failed to save providers. Please try again.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Paper withBorder p="md" radius="md">
          <Title order={4} mb="md">
            My Providers
          </Title>

          {fields.length === 0 && (
            <Text c="dimmed" size="sm" mb="md">
              No providers saved yet. Click &quot;Add Provider&quot; to get started.
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
              <MyProviderCard
                key={field.id}
                index={index}
                onRemove={() => remove(index)}
              />
            ))}
          </Accordion>

          <Stack gap="sm">
            <Button variant="light" onClick={handleAddProvider} type="button">
              + Add Provider
            </Button>

            {success && (
              <Alert color="green" title="Saved">
                Your providers have been saved successfully.
              </Alert>
            )}
            {error && (
              <Alert color="red" title="Error">
                {error}
              </Alert>
            )}

            <Button type="submit" loading={methods.formState.isSubmitting}>
              Save Providers
            </Button>
          </Stack>
        </Paper>
      </form>
    </FormProvider>
  );
}

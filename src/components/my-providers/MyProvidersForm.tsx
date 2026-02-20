"use client";

import { useState } from "react";
import { Accordion, Alert, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

interface SortableItemProps {
  id: string;
  index: number;
  onRemove: () => void;
}

function SortableItem({ id, index, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
        marginBottom: 8,
      }}
    >
      <MyProviderCard
        index={index}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function MyProvidersForm({ defaultValues }: Props) {
  const methods = useForm<MyProvidersFormData>({
    resolver: zodResolver(schema),
    defaultValues: { providers: defaultValues },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: methods.control,
    name: "providers",
  });

  const [openItems, setOpenItems] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    move(oldIndex, newIndex);
    setOpenItems((prev) => {
      const openSet = new Set(prev);
      const booleans = fields.map((_, i) => openSet.has(`provider-${i}`));
      return arrayMove(booleans, oldIndex, newIndex)
        .map((isOpen, i) => (isOpen ? `provider-${i}` : null))
        .filter((v): v is string => v !== null);
    });
  };

  const handleAddProvider = () => {
    const newIndex = fields.length;
    append(defaultProvider);
    setOpenItems((prev) => [...prev, `provider-${newIndex}`]);
  };

  const handleRemove = (index: number) => {
    remove(index);
    setOpenItems((prev) =>
      prev
        .filter((v) => v !== `provider-${index}`)
        .map((v) => {
          const i = parseInt(v.split("-")[1]);
          return i > index ? `provider-${i - 1}` : v;
        })
    );
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

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <Accordion
                multiple
                value={openItems}
                onChange={setOpenItems}
                variant="separated"
                mb="md"
              >
                {fields.map((field, index) => (
                  <SortableItem
                    key={field.id}
                    id={field.id}
                    index={index}
                    onRemove={() => handleRemove(index)}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>

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

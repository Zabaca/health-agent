"use client";

import { useEffect, useState } from "react";
import { Accordion, Button, Paper, Title, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useFieldArray, useFormContext } from "react-hook-form";
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
import type { ReleaseFormData, ProviderFormData } from "@/types/release";
import type { UserProviderRow } from "@/lib/db/types";
import { apiClient } from "@/lib/api/client";
import ProviderCard from "./ProviderCard";
import AddProviderModal from "./AddProviderModal";

const defaultProvider: ProviderFormData = {
  providerName: "",
  providerType: "" as unknown as "Medical Group" | "Facility",
  historyPhysical: false,
  diagnosticResults: false,
  treatmentProcedure: false,
  prescriptionMedication: false,
  imagingRadiology: false,
  dischargeSummaries: false,
  specificRecords: false,
  allAvailableDates: false,
};

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
      <ProviderCard
        index={index}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function ProviderList() {
  const { control, formState: { errors } } = useFormContext<ReleaseFormData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "providers",
  });

  const [openItems, setOpenItems] = useState<string[]>([]);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [usedProviderIds, setUsedProviderIds] = useState<(string | null)[]>([]);
  const [savedProviders, setSavedProviders] = useState<UserProviderRow[]>([]);

  useEffect(() => {
    apiClient.myProviders.list({})
      .then((result) => {
        if (result.status === 200) setSavedProviders(result.body);
        else setSavedProviders([]);
      })
      .catch(() => setSavedProviders([]));
  }, []);

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
    setUsedProviderIds((prev) => arrayMove(prev, oldIndex, newIndex));
    setOpenItems((prev) => {
      const openSet = new Set(prev);
      const booleans = fields.map((_, i) => openSet.has(`provider-${i}`));
      return arrayMove(booleans, oldIndex, newIndex)
        .map((isOpen, i) => (isOpen ? `provider-${i}` : null))
        .filter((v): v is string => v !== null);
    });
  };

  const handleAddNew = () => {
    const newIndex = fields.length;
    append(defaultProvider);
    setOpenItems((prev) => [...prev, `provider-${newIndex}`]);
    setUsedProviderIds((prev) => [...prev, null]);
  };

  const handleSelect = (p: ProviderFormData, savedId: string) => {
    const newIndex = fields.length;
    append(p);
    setOpenItems((prev) => [...prev, `provider-${newIndex}`]);
    setUsedProviderIds((prev) => [...prev, savedId]);
  };

  const handleRemove = (index: number) => {
    remove(index);
    setUsedProviderIds((prev) => prev.filter((_, i) => i !== index));
    setOpenItems((prev) =>
      prev
        .filter((v) => v !== `provider-${index}`)
        .map((v) => {
          const i = parseInt(v.split("-")[1]);
          return i > index ? `provider-${i - 1}` : v;
        })
    );
  };

  const activeUsedIds = usedProviderIds.filter((id): id is string => id !== null);
  const availableSavedProviders = savedProviders.filter((p) => !activeUsedIds.includes(p.id));

  const handleOpenModal = () => {
    if (availableSavedProviders.length === 0) {
      handleAddNew();
    } else {
      openModal();
    }
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4} mb="md">
        Healthcare Providers
      </Title>

      {fields.length === 0 && (
        <Text c={errors.providers?.root?.message || errors.providers?.message ? "red" : "dimmed"} size="sm" mb="md">
          {errors.providers?.root?.message || errors.providers?.message || "No providers added yet. Click \"Add Provider\" to get started."}
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

      <Button variant="light" onClick={handleOpenModal}>
        + Add Provider
      </Button>

      <AddProviderModal
        opened={modalOpened}
        onClose={closeModal}
        onSelect={handleSelect}
        onAddNew={handleAddNew}
        providers={savedProviders}
        usedProviderIds={activeUsedIds}
      />
    </Paper>
  );
}

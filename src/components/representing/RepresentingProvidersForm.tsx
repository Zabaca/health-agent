"use client";

import MyProvidersForm from "@/components/my-providers/MyProvidersForm";
import type { MyProviderFormData } from "@/lib/schemas/release";

interface Props {
  defaultValues: MyProviderFormData[];
  patientId: string;
}

export default function RepresentingProvidersForm({ defaultValues, patientId }: Props) {
  const handleSave = async (providers: MyProviderFormData[]) => {
    const res = await fetch(`/api/representing/${patientId}/providers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providers }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Failed to save providers');
    }
  };

  return <MyProvidersForm defaultValues={defaultValues} onSave={handleSave} />;
}

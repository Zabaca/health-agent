"use client";

import { apiClient } from "@/lib/api/client";
import MyProvidersForm from "@/components/my-providers/MyProvidersForm";
import type { MyProviderFormData } from "@/lib/schemas/release";

interface Props {
  patientId: string;
  role: "admin" | "agent";
  defaultProviders: MyProviderFormData[];
}

export default function PatientProvidersPanel({ patientId, role, defaultProviders }: Props) {
  const handleSave = async (providers: MyProviderFormData[]) => {
    const result =
      role === "admin"
        ? await apiClient.admin.patientProviders.replace({
            params: { id: patientId },
            body: { providers },
          })
        : await apiClient.agent.patientProviders.replace({
            params: { id: patientId },
            body: { providers },
          });

    if (result.status !== 200) throw new Error("Failed to save providers");
  };

  return (
    <MyProvidersForm
      defaultValues={defaultProviders}
      onSave={handleSave}
      maw="100%"
    />
  );
}

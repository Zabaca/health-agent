"use client";

import { apiClient } from "@/lib/api/client";
import StaffProfileForm from "./StaffProfileForm";
import type { StaffProfileFormData } from "@/lib/schemas/profile";

interface Props {
  defaultValues?: Partial<StaffProfileFormData>;
  mode: 'admin' | 'agent';
}

export default function StaffProfileFormClient({ defaultValues, mode }: Props) {
  const handleSave = async (data: StaffProfileFormData) => {
    const result = mode === 'admin'
      ? await apiClient.admin.profile.update({ body: data })
      : await apiClient.agent.profile.update({ body: data });
    return { ok: result.status === 200 };
  };

  return <StaffProfileForm defaultValues={defaultValues} onSave={handleSave} />;
}

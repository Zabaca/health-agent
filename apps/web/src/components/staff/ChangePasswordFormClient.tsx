"use client";

import { apiClient } from "@/lib/api/client";
import ChangePasswordForm from "./ChangePasswordForm";

interface Props {
  mode: 'admin' | 'agent';
  redirectPath: string;
}

export default function ChangePasswordFormClient({ mode, redirectPath }: Props) {
  const handleSave = async (password: string) => {
    const result = mode === 'admin'
      ? await apiClient.admin.changePassword.update({ body: { password } })
      : await apiClient.agent.changePassword.update({ body: { password } });
    return { ok: result.status === 200 };
  };

  return <ChangePasswordForm onSave={handleSave} redirectPath={redirectPath} />;
}

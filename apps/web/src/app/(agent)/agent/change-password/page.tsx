import ChangePasswordFormClient from "@/components/staff/ChangePasswordFormClient";

export const metadata = { title: "Change Password — Agent Portal" };

export default function AgentChangePasswordPage() {
  return <ChangePasswordFormClient mode="agent" redirectPath="/agent/dashboard" />;
}

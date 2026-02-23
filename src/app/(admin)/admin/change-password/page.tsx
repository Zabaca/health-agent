import ChangePasswordFormClient from "@/components/staff/ChangePasswordFormClient";

export const metadata = { title: "Change Password — Admin Portal" };

export default function AdminChangePasswordPage() {
  return <ChangePasswordFormClient mode="admin" redirectPath="/admin/dashboard" />;
}

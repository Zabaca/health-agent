import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'Reset Password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ''} />;
}

import { auth } from "@/auth";
import ReleaseForm from "@/components/release-form/ReleaseForm";

export const metadata = { title: "New Release — Medical Record Release" };

export default async function NewReleasePage() {
  const session = await auth();
  return <ReleaseForm defaultValues={{ email: session?.user?.email ?? "" }} />;
}

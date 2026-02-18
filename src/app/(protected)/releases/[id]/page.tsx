import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ReleaseForm from "@/components/release-form/ReleaseForm";
import type { ReleaseFormData } from "@/types/release";

export const metadata = { title: "Edit Release — Medical Record Release" };

export default async function EditReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) notFound();

  const release = await prisma.release.findFirst({
    where: { id, userId },
    include: { providers: { orderBy: { order: "asc" } } },
  });

  if (!release) {
    notFound();
  }

  const defaultValues: ReleaseFormData = {
    firstName: release.firstName,
    middleName: release.middleName || undefined,
    lastName: release.lastName,
    dateOfBirth: release.dateOfBirth,
    mailingAddress: release.mailingAddress,
    phoneNumber: release.phoneNumber,
    email: release.email,
    ssn: release.ssn,
    authExpirationDate: release.authExpirationDate || "",
    authExpirationEvent: release.authExpirationEvent || undefined,
    authPrintedName: release.authPrintedName,
    authSignatureImage: release.authSignatureImage || undefined,
    authDate: release.authDate,
    authAgentName: release.authAgentName || undefined,
    providers: release.providers.map((p) => ({
      providerName: p.providerName,
      providerType: p.providerType as "Insurance" | "Facility",
      patientMemberId: p.patientMemberId || undefined,
      groupId: p.groupId || undefined,
      planName: p.planName || undefined,
      phone: p.phone || undefined,
      fax: p.fax || undefined,
      providerEmail: p.providerEmail || undefined,
      address: p.address || undefined,
      membershipIdFront: p.membershipIdFront || undefined,
      membershipIdBack: p.membershipIdBack || undefined,
      historyPhysical: p.historyPhysical,
      diagnosticResults: p.diagnosticResults,
      treatmentProcedure: p.treatmentProcedure,
      prescriptionMedication: p.prescriptionMedication,
      imagingRadiology: p.imagingRadiology,
      dischargeSummaries: p.dischargeSummaries,
      specificRecords: p.specificRecords,
      specificRecordsDesc: p.specificRecordsDesc || undefined,
      dateRangeFrom: p.dateRangeFrom || undefined,
      dateRangeTo: p.dateRangeTo || undefined,
      allAvailableDates: p.allAvailableDates,
      purpose: p.purpose || undefined,
      purposeOther: p.purposeOther || undefined,
    })),
  };

  return <ReleaseForm releaseId={id} defaultValues={defaultValues} />;
}

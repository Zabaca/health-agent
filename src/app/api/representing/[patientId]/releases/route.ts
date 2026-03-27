import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, releases, users, providers as providersTable } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { staffReleaseSchema } from "@/lib/schemas/release";
import { generateReleaseCode } from "@/lib/utils/releaseCode";

// GET /api/representing/[patientId]/releases — list releases where PDA is authorized agent
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, session.user.id),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });

  if (!relation || !relation.releasePermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pda = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { firstName: true, lastName: true, email: true },
  });

  const pdaFullName = [pda?.firstName, pda?.lastName].filter(Boolean).join(' ') || pda?.email || '';

  const rows = await db.query.releases.findMany({
    where: and(
      eq(releases.userId, patientId),
      eq(releases.releaseAuthAgent, true),
    ),
    with: { providers: { columns: { providerName: true, insurance: true, providerType: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
    orderBy: [desc(releases.updatedAt)],
  });

  // Filter to only releases where this PDA is the authorized agent
  const pdaReleases = rows.filter(r => {
    const agentName = [r.authAgentFirstName, r.authAgentLastName].filter(Boolean).join(' ');
    return agentName === pdaFullName || r.authAgentEmail === pda?.email;
  });

  return NextResponse.json(pdaReleases.map(r => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    voided: r.voided,
    authSignatureImage: r.authSignatureImage,
    releaseCode: r.releaseCode,
    releaseAuthAgent: r.releaseAuthAgent,
    authAgentFirstName: r.authAgentFirstName,
    authAgentLastName: r.authAgentLastName,
    providerNames: r.providers.map(p => p.providerType === 'Insurance' ? (p.insurance || p.providerName) : p.providerName),
  })));
}

// POST /api/representing/[patientId]/releases — create release (PDA editor only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, session.user.id),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });

  if (!relation || relation.releasePermission !== 'editor') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pda = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!pda) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = staffReleaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const now = new Date().toISOString();

  const releaseBase = {
    userId: patientId,
    firstName: data.firstName,
    middleName: data.middleName ?? null,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    mailingAddress: data.mailingAddress,
    phoneNumber: data.phoneNumber,
    email: data.email,
    ssn: data.ssn,
    releaseAuthAgent: true,
    releaseAuthZabaca: false,
    authAgentFirstName: pda.firstName ?? '',
    authAgentLastName: pda.lastName ?? '',
    authAgentAddress: pda.address ?? '',
    authAgentPhone: pda.phoneNumber ?? '',
    authAgentEmail: pda.email,
    authExpirationDate: data.authExpirationDate ?? null,
    authExpirationEvent: data.authExpirationEvent ?? null,
    authPrintedName: data.authPrintedName,
    authSignatureImage: null as null, // patient must sign
    authDate: data.authDate,
    createdAt: now,
    updatedAt: now,
  };

  const firstId = await db.transaction(async (tx) => {
    const ids: string[] = [];
    for (const p of data.providers) {
      const releaseId = nanoid();
      await tx.insert(releases).values({ id: releaseId, ...releaseBase, releaseCode: generateReleaseCode() });
      await tx.insert(providersTable).values({
        id: nanoid(),
        releaseId,
        order: 0,
        providerName: p.providerName ?? '',
        providerType: p.providerType,
        physicianName: p.physicianName ?? null,
        patientId: p.patientId ?? null,
        insurance: p.insurance ?? null,
        patientMemberId: p.patientMemberId ?? null,
        groupId: p.groupId ?? null,
        planName: p.planName ?? null,
        phone: p.phone ?? null,
        fax: p.fax ?? null,
        providerEmail: p.providerEmail ?? null,
        address: p.address ?? null,
        membershipIdFront: p.membershipIdFront ?? null,
        membershipIdBack: p.membershipIdBack ?? null,
        historyPhysical: p.historyPhysical,
        diagnosticResults: p.diagnosticResults,
        treatmentProcedure: p.treatmentProcedure,
        prescriptionMedication: p.prescriptionMedication,
        imagingRadiology: p.imagingRadiology,
        dischargeSummaries: p.dischargeSummaries,
        specificRecords: p.specificRecords,
        specificRecordsDesc: p.specificRecordsDesc ?? null,
        benefitsCoverage: p.benefitsCoverage,
        claimsPayment: p.claimsPayment,
        eligibilityEnrollment: p.eligibilityEnrollment,
        financialBilling: p.financialBilling,
        medicalRecords: p.medicalRecords,
        dentalRecords: p.dentalRecords,
        otherNonSpecific: p.otherNonSpecific,
        otherNonSpecificDesc: p.otherNonSpecificDesc ?? null,
        sensitiveCommDiseases: p.sensitiveCommDiseases,
        sensitiveReproductiveHealth: p.sensitiveReproductiveHealth,
        sensitiveHivAids: p.sensitiveHivAids,
        sensitiveMentalHealth: p.sensitiveMentalHealth,
        sensitiveSubstanceUse: p.sensitiveSubstanceUse,
        sensitivePsychotherapy: p.sensitivePsychotherapy,
        sensitiveOther: p.sensitiveOther,
        sensitiveOtherDesc: p.sensitiveOtherDesc ?? null,
        dateRangeFrom: p.dateRangeFrom ?? null,
        dateRangeTo: p.dateRangeTo ?? null,
        allAvailableDates: p.allAvailableDates,
        purpose: p.purpose ?? null,
        purposeOther: p.purposeOther ?? null,
      });
      ids.push(releaseId);
    }
    return ids[0];
  });

  return NextResponse.json({ id: firstId }, { status: 201 });
}

import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, FlaskConical, TriangleAlert } from "lucide-react-native";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/theme/ThemeProvider";
import { getMyRecord, getRepresentingRecord, type FhirRecord, type IncomingFile } from "@/lib/api";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;
type R = RouteProp<RecordsParamList, "RecordDetailFHIR">;

// ─── FHIR helpers ───────────────────────────────────────────────────────────

type Coding = { display?: string; code?: string; system?: string };
type CodeableConcept = { text?: string; coding?: Coding[] };
type Quantity = { value?: number; unit?: string; code?: string };
type Reference = { display?: string; reference?: string };

function codeText(cc: CodeableConcept | undefined | null): string | null {
  if (!cc) return null;
  if (cc.text) return cc.text;
  return cc.coding?.find((c) => c.display)?.display ?? null;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function fhirEffective(r: { effectiveDateTime?: string; effectivePeriod?: { start?: string }; onsetDateTime?: string; onsetPeriod?: { start?: string }; occurrenceDateTime?: string; recordedDate?: string }): string | null {
  return (
    r.effectiveDateTime ??
    r.effectivePeriod?.start ??
    r.onsetDateTime ??
    r.onsetPeriod?.start ??
    r.occurrenceDateTime ??
    r.recordedDate ??
    null
  );
}

// ─── Renderers per resource type ────────────────────────────────────────────

type RowProps = { label: string; value: string | null | undefined };
function Row({ label, value }: RowProps) {
  const t = useTheme();
  if (value === null || value === undefined || value === "") return null;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderTopWidth: 1,
        borderTopColor: t.colors.divider,
      }}
    >
      <Text style={[t.type.caption, { flex: 0.45, textTransform: "uppercase" }]}>{label}</Text>
      <Text style={[t.type.body, { flex: 0.55, textAlign: "right" }]}>{value}</Text>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderRadius: t.radius.card,
        borderWidth: 1,
        borderColor: t.colors.border,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

type FhirAny = Record<string, unknown>;

function ObservationView({ data }: { data: FhirAny }) {
  const t = useTheme();
  const code = data.code as CodeableConcept | undefined;
  const qty = data.valueQuantity as Quantity | undefined;
  const valueString = data.valueString as string | undefined;
  const valueCC = data.valueCodeableConcept as CodeableConcept | undefined;
  const range = (data.referenceRange as Array<{ low?: Quantity; high?: Quantity; text?: string }> | undefined)?.[0];
  const performer = (data.performer as Reference[] | undefined)?.[0]?.display;
  const interpretation = codeText((data.interpretation as CodeableConcept[] | undefined)?.[0]);

  const valueText = qty
    ? `${qty.value ?? ""}${qty.unit ? ` ${qty.unit}` : ""}`.trim()
    : valueString ?? codeText(valueCC) ?? null;
  const rangeText = range?.text
    ?? (range && (range.low?.value !== undefined || range.high?.value !== undefined)
      ? `${range.low?.value ?? ""}–${range.high?.value ?? ""} ${range.low?.unit ?? range.high?.unit ?? ""}`.trim()
      : null);
  const abnormal = interpretation && !/normal/i.test(interpretation);

  return (
    <View style={{ gap: 12 }}>
      <SectionCard>
        {valueText ? (
          <View style={{ padding: 16, alignItems: "center", gap: 4 }}>
            <Text style={[t.type.h1, { color: abnormal ? t.colors.accent : t.colors.textPrimary }]}>
              {valueText}
            </Text>
            {interpretation ? (
              <Badge label={interpretation} variant={abnormal ? "accent" : "success"} />
            ) : null}
          </View>
        ) : null}
        <Row label="Test" value={codeText(code)} />
        <Row label="Reference" value={rangeText} />
        <Row label="Status" value={(data.status as string | undefined) ?? null} />
        <Row label="Performer" value={performer ?? null} />
        <Row label="Date" value={formatDate(fhirEffective(data as never))} />
      </SectionCard>
      {abnormal ? (
        <View
          style={{
            backgroundColor: "#FFF4EE",
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <TriangleAlert size={18} color={t.colors.accent} />
          <Text style={[t.type.caption, { flex: 1, color: t.colors.accent }]}>
            Value outside normal range. Discuss with your provider.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ConditionView({ data }: { data: FhirAny }) {
  const clin = codeText((data.clinicalStatus as CodeableConcept | undefined));
  const verif = codeText((data.verificationStatus as CodeableConcept | undefined));
  const severity = codeText((data.severity as CodeableConcept | undefined));
  const recorder = (data.recorder as Reference | undefined)?.display;
  return (
    <SectionCard>
      <Row label="Condition" value={codeText(data.code as CodeableConcept | undefined)} />
      <Row label="Status" value={clin} />
      <Row label="Verified" value={verif} />
      <Row label="Severity" value={severity} />
      <Row label="Onset" value={formatDate(fhirEffective(data as never))} />
      <Row label="Recorded by" value={recorder ?? null} />
    </SectionCard>
  );
}

function MedicationView({ data }: { data: FhirAny }) {
  const med =
    codeText(data.medicationCodeableConcept as CodeableConcept | undefined) ??
    (data.medicationReference as Reference | undefined)?.display ??
    null;
  const dosage = (data.dosage as Array<{ text?: string }> | undefined)?.[0]?.text;
  return (
    <SectionCard>
      <Row label="Medication" value={med} />
      <Row label="Dosage" value={dosage ?? null} />
      <Row label="Status" value={(data.status as string | undefined) ?? null} />
      <Row label="Effective" value={formatDate(fhirEffective(data as never))} />
    </SectionCard>
  );
}

function ImmunizationView({ data }: { data: FhirAny }) {
  return (
    <SectionCard>
      <Row label="Vaccine" value={codeText(data.vaccineCode as CodeableConcept | undefined)} />
      <Row label="Date" value={formatDate(fhirEffective(data as never))} />
      <Row label="Status" value={(data.status as string | undefined) ?? null} />
      <Row label="Lot #" value={(data.lotNumber as string | undefined) ?? null} />
      <Row label="Manufacturer" value={(data.manufacturer as Reference | undefined)?.display ?? null} />
    </SectionCard>
  );
}

function AllergyView({ data }: { data: FhirAny }) {
  const reactions = data.reaction as Array<{ manifestation?: CodeableConcept[]; severity?: string }> | undefined;
  const reactionText = reactions?.flatMap((r) => r.manifestation?.map(codeText) ?? [])
    .filter(Boolean)
    .join(", ");
  const severities = reactions?.map((r) => r.severity).filter(Boolean).join(", ");
  return (
    <SectionCard>
      <Row label="Allergen" value={codeText(data.code as CodeableConcept | undefined)} />
      <Row label="Status" value={codeText(data.clinicalStatus as CodeableConcept | undefined)} />
      <Row label="Category" value={(data.category as string[] | undefined)?.join(", ") ?? null} />
      <Row label="Reactions" value={reactionText || null} />
      <Row label="Severity" value={severities || null} />
      <Row label="Recorded" value={formatDate((data.recordedDate as string | undefined) ?? null)} />
    </SectionCard>
  );
}

function GenericView({ data, recordType }: { data: FhirAny; recordType: string | null }) {
  return (
    <SectionCard>
      <Row label="Type" value={recordType ?? (data.resourceType as string | undefined) ?? null} />
      <Row label="Date" value={formatDate(fhirEffective(data as never))} />
      <Row label="Status" value={(data.status as string | undefined) ?? null} />
    </SectionCard>
  );
}

function renderResource(resourceType: string | undefined, data: FhirAny, recordType: string | null) {
  switch (resourceType) {
    case "Observation":
      return <ObservationView data={data} />;
    case "Condition":
      return <ConditionView data={data} />;
    case "MedicationStatement":
    case "MedicationRequest":
    case "MedicationOrder":
      return <MedicationView data={data} />;
    case "Immunization":
      return <ImmunizationView data={data} />;
    case "AllergyIntolerance":
      return <AllergyView data={data} />;
    default:
      return <GenericView data={data} recordType={recordType} />;
  }
}

// ─── Friendly labels ────────────────────────────────────────────────────────

const RECORD_TYPE_LABEL: Record<string, string> = {
  AllergyRecord: "Allergy",
  ConditionRecord: "Condition",
  ImmunizationRecord: "Immunization",
  LabResultRecord: "Lab Result",
  MedicationRecord: "Medication",
  ProcedureRecord: "Procedure",
  VitalSignRecord: "Vital Sign",
  CoverageRecord: "Coverage",
};

function recordLabel(recordType: string | null | undefined, fallback: string | null | undefined): string {
  if (recordType && RECORD_TYPE_LABEL[recordType]) return RECORD_TYPE_LABEL[recordType];
  if (fallback) return fallback;
  return "Record";
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function RecordDetailFHIR() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const [record, setRecord] = useState<FhirRecord | IncomingFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // When opened from the PDA "representing" flow, params.patientId is set and
    // we fetch through the PDA-scoped endpoint; otherwise it's the patient's own.
    const fetcher = params.patientId
      ? getRepresentingRecord(params.patientId, params.recordId)
      : getMyRecord(params.recordId);
    fetcher
      .then((r) => {
        if (!cancelled) setRecord(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load record");
      });
    return () => {
      cancelled = true;
    };
  }, [params.recordId, params.patientId]);

  const backLabel = params.patientId ? "Health Records" : "My Records";
  const Header = (
    <View style={{ paddingHorizontal: t.spacing.gutter, paddingTop: insets.top + 12, paddingBottom: 8 }}>
      <Pressable onPress={() => nav.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <ChevronLeft size={18} color={t.colors.primary} />
        <Text style={{ color: t.colors.primary, fontWeight: "600" }}>{backLabel}</Text>
      </Pressable>
    </View>
  );

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {Header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
          <TriangleAlert size={28} color={t.colors.accent} />
          <Text style={[t.type.body, { textAlign: "center" }]}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {Header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </View>
    );
  }

  const isFhir = record.source === "healthkitFHIR" && "fhirData" in record;
  const fhirData = isFhir ? ((record as FhirRecord).fhirData as FhirAny | null) ?? {} : {};
  const resourceType = (fhirData.resourceType as string | undefined) ?? record.type ?? undefined;
  const recordType = record.fhirRecordType ?? null;
  const title = record.fhirDisplayName ?? codeText(fhirData.code as CodeableConcept | undefined) ?? recordLabel(recordType, resourceType);
  const subtitleDate = formatDate(record.time ?? fhirEffective(fhirData as never) ?? record.createdAt);
  const sourceLabel = record.fhirSource ?? "Apple Health";

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {Header}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.spacing.gutter,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={t.type.h2}>{title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 2,
                paddingHorizontal: 8,
                borderRadius: t.radius.pill,
                backgroundColor: t.colors.primaryBg,
              }}
            >
              <FlaskConical size={12} color={t.colors.primary} />
              <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "600" }]}>
                {recordLabel(recordType, resourceType)}
              </Text>
            </View>
            {subtitleDate ? <Text style={t.type.caption}>{subtitleDate}</Text> : null}
            <Text style={t.type.caption}>· {sourceLabel}</Text>
          </View>
        </View>

        {isFhir ? renderResource(resourceType, fhirData, recordType) : (
          <SectionCard>
            <Row label="Type" value={record.type ?? null} />
            <Row label="Source" value={record.source} />
          </SectionCard>
        )}
      </ScrollView>
    </View>
  );
}

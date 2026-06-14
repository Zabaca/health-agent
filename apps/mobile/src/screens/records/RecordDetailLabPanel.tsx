import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, FlaskConical, TriangleAlert } from "lucide-react-native";
import { Badge } from "@/components/Badge";
import { ReferenceRangeBar } from "@/components/ReferenceRangeBar";
import { useTheme } from "@/theme/ThemeProvider";
import { getMyRecord, type FhirRecord } from "@/lib/api";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;
type R = RouteProp<RecordsParamList, "RecordDetailLabPanel">;

type Coding = { display?: string; code?: string };
type CodeableConcept = { text?: string; coding?: Coding[] };
type Quantity = { value?: number; unit?: string };

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

type ParsedRow = {
  id: string;
  name: string;
  value: string | null;
  unit: string | null;
  range: string | null;
  interpretation: string | null;
  abnormal: boolean;
  // Numeric trio for the reference-range bar (null when not chartable).
  numValue: number | null;
  low: number | null;
  high: number | null;
};

function parseRow(rec: FhirRecord): ParsedRow {
  const data = (rec.fhirData as Record<string, unknown> | null) ?? {};
  const code = data.code as CodeableConcept | undefined;
  const qty = data.valueQuantity as Quantity | undefined;
  const valueString = data.valueString as string | undefined;
  const valueCC = data.valueCodeableConcept as CodeableConcept | undefined;
  const range = (data.referenceRange as Array<{ low?: Quantity; high?: Quantity; text?: string }> | undefined)?.[0];
  const interp = codeText((data.interpretation as CodeableConcept[] | undefined)?.[0]);

  const name = rec.fhirDisplayName ?? codeText(code) ?? "—";
  const value = qty?.value !== undefined ? String(qty.value) : valueString ?? codeText(valueCC);
  const unit = qty?.unit ?? null;
  const rangeText = range?.text
    ?? (range && (range.low?.value !== undefined || range.high?.value !== undefined)
      ? `${range.low?.value ?? ""}–${range.high?.value ?? ""} ${range.low?.unit ?? range.high?.unit ?? ""}`.trim()
      : null);
  const numValue = qty?.value ?? null;
  let low = range?.low?.value ?? null;
  let high = range?.high?.value ?? null;
  // Many one-sided limits arrive only as text ("<130", "> OR = 60"): pull the
  // numeric threshold so we can still chart and flag them.
  if (low == null && high == null && range?.text) {
    const txt = range.text.trim();
    const num = txt.match(/-?[\d.]+/);
    if (num) {
      if (/^[<≤]/.test(txt)) high = parseFloat(num[0]);
      else if (/^[>≥]/.test(txt)) low = parseFloat(num[0]);
    }
  }
  // Out of range by the numbers OR flagged abnormal by the lab's interpretation.
  const outOfRange =
    numValue != null && ((low != null && numValue < low) || (high != null && numValue > high));
  const abnormal = !!(interp && !/normal/i.test(interp)) || outOfRange;

  return {
    id: rec.id,
    name,
    value,
    unit,
    range: rangeText,
    interpretation: interp,
    abnormal,
    numValue,
    low,
    high,
  };
}

export default function RecordDetailLabPanel() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(params.recordIds.map((id) => getMyRecord(id).catch(() => null)))
      .then((results) => {
        if (cancelled) return;
        const parsed: ParsedRow[] = [];
        for (const r of results) {
          if (!r) continue;
          if ("fhirData" in r) parsed.push(parseRow(r as FhirRecord));
        }
        // Surface out-of-range results first, then alphabetical within each group.
        parsed.sort((a, b) => {
          if (a.abnormal !== b.abnormal) return a.abnormal ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        setRows(parsed);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load panel");
      });
    return () => {
      cancelled = true;
    };
  }, [params.recordIds]);

  const Header = (
    <View style={{ paddingHorizontal: t.spacing.gutter, paddingTop: insets.top + 12, paddingBottom: 8 }}>
      <Pressable onPress={() => nav.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <ChevronLeft size={18} color={t.colors.primary} />
        <Text style={{ color: t.colors.primary, fontWeight: "600" }}>My Records</Text>
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

  if (!rows) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {Header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </View>
    );
  }

  const subtitleDate = formatDate(params.date);
  const sourceLabel = params.source ?? "Apple Health";
  const abnormalCount = rows.filter((r) => r.abnormal).length;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {Header}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 32, gap: 16 }}
      >
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={t.type.h2}>Lab Panel</Text>
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
                {rows.length} results
              </Text>
            </View>
            {subtitleDate ? <Text style={t.type.caption}>{subtitleDate}</Text> : null}
            <Text style={t.type.caption}>· {sourceLabel}</Text>
          </View>
        </View>

        {abnormalCount > 0 ? (
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
              {abnormalCount === 1
                ? "1 value outside normal range. Discuss with your doctor."
                : `${abnormalCount} values outside normal range. Discuss with your doctor.`}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          {rows.map((row, i) => (
            <Pressable
              key={row.id}
              onPress={() => nav.navigate("RecordDetailFHIR", { recordId: row.id })}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={[t.type.body, { flex: 1 }]} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: row.abnormal ? t.colors.accent : t.colors.textPrimary,
                  }}
                  numberOfLines={1}
                >
                  {row.value ?? "—"}
                  {row.unit ? ` ${row.unit}` : ""}
                </Text>
                {row.interpretation ? (
                  <Badge
                    label={row.interpretation}
                    variant={row.abnormal ? "accent" : "success"}
                  />
                ) : null}
              </View>
              {row.range ? (
                <Text style={t.type.caption} numberOfLines={1}>
                  Reference: {row.range}
                </Text>
              ) : null}
              {row.numValue != null &&
              (row.low != null || row.high != null) &&
              !(row.low != null && row.high != null && row.high <= row.low) ? (
                <View style={{ paddingTop: 8 }}>
                  <ReferenceRangeBar value={row.numValue} low={row.low} high={row.high} />
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

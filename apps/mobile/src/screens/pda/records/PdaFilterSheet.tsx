import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import type { PdaRecordsFilters, PdaRecordsParamList } from "@/navigation/types";
import type { RecordProvider } from "@/lib/api";

type Nav = NativeStackNavigationProp<PdaRecordsParamList>;
type R = RouteProp<PdaRecordsParamList, "PdaFilterSheet">;
type DateField = "from" | "to";

const FILE_TYPE_OPTIONS = ["pdf", "tiff", "jpg", "png", "gif", "webp", "zip"];

export const DEFAULT_PDA_FILTERS: PdaRecordsFilters = {
  dateFrom: null,
  dateTo: null,
  fileTypes: [],
  providers: [],
};

function isoToDate(iso: string | null): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(iso: string | null, placeholder: string): string {
  if (!iso) return placeholder;
  return isoToDate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PdaFilterSheet() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();

  const initialFilters = params?.current ?? DEFAULT_PDA_FILTERS;
  const [filters, setFilters] = useState<PdaRecordsFilters>(initialFilters);
  const [pickerField, setPickerField] = useState<DateField | null>(null);
  const [draftDate, setDraftDate] = useState<Date>(new Date());

  const openPicker = (field: DateField) => {
    const iso = field === "from" ? filters.dateFrom : filters.dateTo;
    setDraftDate(iso ? isoToDate(iso) : new Date());
    setPickerField(field);
  };

  const closePicker = () => setPickerField(null);

  const commitDate = (field: DateField, date: Date) => {
    setFilters((f) => ({
      ...f,
      [field === "from" ? "dateFrom" : "dateTo"]: dateToIso(date),
    }));
  };

  const onChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && date && pickerField) commitDate(pickerField, date);
      setPickerField(null);
      return;
    }
    if (date) setDraftDate(date);
  };

  const toggleType = (ext: string) =>
    setFilters((f) => ({
      ...f,
      fileTypes: f.fileTypes.includes(ext)
        ? f.fileTypes.filter((x) => x !== ext)
        : [...f.fileTypes, ext],
    }));

  const toggleProvider = (name: string) =>
    setFilters((f) => ({
      ...f,
      providers: f.providers.includes(name)
        ? f.providers.filter((x) => x !== name)
        : [...f.providers, name],
    }));

  const availableProviders: RecordProvider[] = params?.availableProviders ?? [];

  const clearAll = () => setFilters(DEFAULT_PDA_FILTERS);
  const revert = () => setFilters(initialFilters);
  const apply = () => nav.navigate("PdaRecords", { filters });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: t.spacing.gutter,
          paddingTop: 16,
        }}
      >
        <Text style={t.type.h3}>Filter Records</Text>
        <Pressable onPress={clearAll}>
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={[t.type.sectionLabel, { textTransform: "uppercase", paddingHorizontal: t.spacing.gutter, paddingTop: 18 }]}>
          DATE RANGE
        </Text>
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: t.spacing.gutter, paddingTop: 8 }}>
          {([
            { field: "from" as const, label: "FROM", iso: filters.dateFrom, placeholder: "Any" },
            { field: "to" as const, label: "TO", iso: filters.dateTo, placeholder: "Today" },
          ]).map((d) => {
            const active = !!d.iso;
            return (
              <Pressable
                key={d.field}
                onPress={() => openPicker(d.field)}
                style={{
                  flex: 1,
                  height: 52,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  justifyContent: "center",
                  gap: 2,
                  backgroundColor: active ? `${t.colors.primary}10` : t.colors.surfaceSubtle,
                  borderColor: active ? `${t.colors.primary}50` : t.colors.border,
                }}
              >
                <Text style={{ color: active ? t.colors.primary : t.colors.textSecondary, fontSize: 10, fontWeight: "600", letterSpacing: 0.5 }}>
                  {d.label}
                </Text>
                <Text style={{ color: active ? t.colors.primary : t.colors.textPrimary, fontSize: 14, fontWeight: "500" }}>
                  {formatDate(d.iso, d.placeholder)}
                </Text>
              </Pressable>
            );
          })}
          {(filters.dateFrom || filters.dateTo) ? (
            <Pressable
              onPress={() => setFilters((f) => ({ ...f, dateFrom: null, dateTo: null }))}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.colors.border,
                backgroundColor: t.colors.surfaceSubtle,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.colors.textSecondary, fontSize: 18 }}>×</Text>
            </Pressable>
          ) : null}
        </View>

        {availableProviders.length > 0 ? (
          <>
            <Text style={[t.type.sectionLabel, { textTransform: "uppercase", paddingHorizontal: t.spacing.gutter, paddingTop: 18 }]}>
              MY PROVIDERS
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: t.spacing.gutter, paddingTop: 8 }}>
              {availableProviders.map((p) => {
                const on = filters.providers.includes(p.id);
                return (
                  <Pressable key={p.id} onPress={() => toggleProvider(p.id)}>
                    <View
                      style={{
                        height: 34,
                        paddingHorizontal: 14,
                        borderRadius: t.radius.pill,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: on ? t.colors.primary : t.colors.surface,
                        borderWidth: 1,
                        borderColor: on ? t.colors.primary : t.colors.border,
                      }}
                    >
                      <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontSize: 13, fontWeight: on ? "600" : "500" }}>
                        {p.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={[t.type.sectionLabel, { textTransform: "uppercase", paddingHorizontal: t.spacing.gutter, paddingTop: 18 }]}>
          FILE TYPE
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: t.spacing.gutter, paddingTop: 8 }}>
          {FILE_TYPE_OPTIONS.map((ext) => {
            const on = filters.fileTypes.includes(ext);
            return (
              <Pressable key={ext} onPress={() => toggleType(ext)}>
                <View
                  style={{
                    height: 34,
                    paddingHorizontal: 14,
                    borderRadius: t.radius.pill,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: on ? t.colors.primary : "transparent",
                    borderWidth: 1,
                    borderColor: on ? t.colors.primary : t.colors.border,
                  }}
                >
                  <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontSize: 13, fontWeight: on ? "600" : "500" }}>
                    {ext.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Button label="Reset" variant="secondary" onPress={revert} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Apply Filters" onPress={apply} fullWidth />
        </View>
      </View>

      {pickerField !== null && Platform.OS === "android" ? (
        <DateTimePicker
          value={isoToDate(pickerField === "from" ? filters.dateFrom : filters.dateTo)}
          mode="date"
          display="default"
          maximumDate={pickerField === "from" && filters.dateTo ? isoToDate(filters.dateTo) : undefined}
          minimumDate={pickerField === "to" && filters.dateFrom ? isoToDate(filters.dateFrom) : undefined}
          onChange={onChange}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal visible={pickerField !== null} transparent animationType="fade" onRequestClose={closePicker}>
          <Pressable onPress={closePicker} style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "flex-end" }}>
            <Pressable
              onPress={() => { /* swallow inner taps */ }}
              style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: t.spacing.gutter,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Pressable onPress={closePicker}>
                  <Text style={{ color: t.colors.textSecondary, fontSize: 15 }}>Cancel</Text>
                </Pressable>
                <Text style={t.type.bodyStrong}>{pickerField === "from" ? "From date" : "To date"}</Text>
                <Pressable onPress={() => { if (pickerField) commitDate(pickerField, draftDate); closePicker(); }}>
                  <Text style={{ color: t.colors.primary, fontSize: 15, fontWeight: "600" }}>Done</Text>
                </Pressable>
              </View>
              {pickerField !== null ? (
                <DateTimePicker
                  value={draftDate}
                  mode="date"
                  display="spinner"
                  maximumDate={pickerField === "from" && filters.dateTo ? isoToDate(filters.dateTo) : undefined}
                  minimumDate={pickerField === "to" && filters.dateFrom ? isoToDate(filters.dateFrom) : undefined}
                  onChange={onChange}
                />
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

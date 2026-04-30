import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import type {
  RecordsFilters,
  RecordsParamList,
} from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;
type R = RouteProp<RecordsParamList, "FilterSheet">;
type DateField = "from" | "to";

// Common medical-record file types from /api/upload's ALLOWED_MIME_TYPES.
// We could derive from currently-loaded records, but that ties the filter UI
// to whichever page is loaded — this fixed list keeps the filter usable
// regardless of pagination state.
const FILE_TYPE_OPTIONS = ["pdf", "tiff", "jpg", "png", "gif", "webp", "zip"];

export const DEFAULT_FILTERS: RecordsFilters = {
  dateFrom: null,
  dateTo: null,
  fileTypes: [],
  providers: [],
};

function isoToDate(iso: string | null): Date {
  if (!iso) return new Date();
  // YYYY-MM-DD parsed in local time (avoids UTC off-by-one).
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

export default function FilterSheet() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  // Initial state seeded from current filters in RecordsList — so reopening
  // the sheet shows what's already applied. No pre-selected providers, no
  // pre-selected file types.
  const initialFilters = params?.current ?? DEFAULT_FILTERS;
  const [filters, setFilters] = useState<RecordsFilters>(initialFilters);
  const [pickerField, setPickerField] = useState<DateField | null>(null);
  // iOS uses an inline/spinner picker that we host inside a small modal so we
  // can show Cancel/Done. Android fires its own native dialog and reports back
  // via onChange — no host modal needed.
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
      // Android: dialog dismissed by user (Cancel/back) → event.type === "dismissed"
      if (event.type === "set" && date && pickerField) commitDate(pickerField, date);
      setPickerField(null);
      return;
    }
    // iOS spinner: just track the draft; user confirms via Done.
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

  const availableProviders = params?.availableProviders ?? [];

  // "Clear all" (top right) — wipe the sheet to empty defaults.
  const clearAll = () => setFilters(DEFAULT_FILTERS);
  // "Reset" (bottom button) — undo any in-sheet edits, revert to whatever
  // was applied when the sheet opened.
  const revert = () => setFilters(initialFilters);

  const apply = () => {
    // navigate('RecordsList', ...) in native-stack pops back to it with the
    // merged params. Avoids passing callbacks through route params.
    nav.navigate("RecordsList", { filters });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.colors.borderMuted,
          }}
        />
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* DATE RANGE — From/To fields, matches Pencil "03e - Records Filter Sheet". */}
        <Text
          style={[
            t.type.sectionLabel,
            {
              textTransform: "uppercase",
              paddingHorizontal: t.spacing.gutter,
              paddingTop: 18,
            },
          ]}
        >
          DATE RANGE
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: t.spacing.gutter,
            paddingTop: 8,
          }}
        >
          {([
            { field: "from", label: "FROM", iso: filters.dateFrom, placeholder: "Any" },
            { field: "to", label: "TO", iso: filters.dateTo, placeholder: "Today" },
          ] as const).map((d) => {
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
                <Text
                  style={{
                    color: active ? t.colors.primary : t.colors.textSecondary,
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  {d.label}
                </Text>
                <Text
                  style={{
                    color: active ? t.colors.primary : t.colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
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

        {/* MY PROVIDERS — sourced from releases tagged on the user's records.
            Each pill maps to a unique provider name; selecting a pill matches
            files where releaseCode is in the union of release codes for that
            provider (deduped across releases). */}
        {availableProviders.length > 0 ? (
          <>
            <Text
              style={[
                t.type.sectionLabel,
                {
                  textTransform: "uppercase",
                  paddingHorizontal: t.spacing.gutter,
                  paddingTop: 18,
                },
              ]}
            >
              MY PROVIDERS
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                paddingHorizontal: t.spacing.gutter,
                paddingTop: 8,
              }}
            >
              {availableProviders.map((p) => {
                const on = filters.providers.includes(p.name);
                return (
                  <Pressable key={p.name} onPress={() => toggleProvider(p.name)}>
                    <View
                      style={{
                        height: 34,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: on ? t.colors.primary : t.colors.surface,
                        borderWidth: 1,
                        borderColor: on ? t.colors.primary : t.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: on ? "#FFFFFF" : t.colors.textPrimary,
                          fontSize: 13,
                          fontWeight: on ? "600" : "500",
                        }}
                      >
                        {p.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* FILE TYPE */}
        <Text
          style={[
            t.type.sectionLabel,
            {
              textTransform: "uppercase",
              paddingHorizontal: t.spacing.gutter,
              paddingTop: 18,
            },
          ]}
        >
          FILE TYPE
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            paddingHorizontal: t.spacing.gutter,
            paddingTop: 8,
          }}
        >
          {FILE_TYPE_OPTIONS.map((ext) => {
            const on = filters.fileTypes.includes(ext);
            return (
              <Pressable key={ext} onPress={() => toggleType(ext)}>
                <View
                  style={{
                    height: 34,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: on ? t.colors.primary : "transparent",
                    borderWidth: 1,
                    borderColor: on ? t.colors.primary : t.colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: on ? "#FFFFFF" : t.colors.textPrimary,
                      fontSize: 13,
                      fontWeight: on ? "600" : "500",
                    }}
                  >
                    {ext.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: t.spacing.gutter,
          paddingBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button label="Reset" variant="secondary" onPress={revert} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Apply Filters" onPress={apply} fullWidth />
        </View>
      </View>

      {/* Date picker host. Android fires the platform dialog directly; iOS
          uses a small modal so we can show Cancel/Done around the spinner. */}
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
        <Modal
          visible={pickerField !== null}
          transparent
          animationType="fade"
          onRequestClose={closePicker}
        >
          <Pressable
            onPress={closePicker}
            style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "flex-end" }}
          >
            <Pressable
              onPress={() => {
                /* swallow taps on the inner sheet so they don't dismiss */
              }}
              style={{
                backgroundColor: t.colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: 32,
              }}
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
                <Pressable
                  onPress={() => {
                    if (pickerField) commitDate(pickerField, draftDate);
                    closePicker();
                  }}
                >
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

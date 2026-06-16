import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronRight,
  Eye,
  FileText,
  FlaskConical,
  FolderHeart,
  Image as ImageIcon,
  Search,
  ShieldOff,
  SlidersHorizontal,
  Upload,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import {
  listRepresentingRecords,
  listRepresentingRecordProviders,
  type RecordProvider,
  type RepresentingRecord,
} from "@/lib/api";
import type { PdaRecordsFilters, PdaRecordsParamList } from "@/navigation/types";
import { DEFAULT_PDA_FILTERS } from "./PdaFilterSheet";

type Nav = NativeStackNavigationProp<PdaRecordsParamList>;
type R = RouteProp<PdaRecordsParamList, "PdaRecords">;

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "tiff", "tif", "heic", "heif"]);
const FHIR_SOURCE = "healthkitFHIR";

function isImage(fileType: string): boolean {
  return IMAGE_EXTS.has(fileType.toLowerCase().replace(/^\./, ""));
}

function isFhir(r: RepresentingRecord): boolean {
  return r.source === FHIR_SOURCE;
}

// HealthKit recordType → friendly label. Mirrors the patient RecordsList map so
// both surfaces stay in sync.
const FHIR_LABEL: Record<string, string> = {
  AllergyRecord: "Allergy",
  ConditionRecord: "Condition",
  ImmunizationRecord: "Immunization",
  LabResultRecord: "Lab Result",
  MedicationRecord: "Medication",
  ProcedureRecord: "Procedure",
  VitalSignRecord: "Vital Sign",
  CoverageRecord: "Coverage",
};

function fhirSubLabel(r: RepresentingRecord): string {
  if (r.fhirRecordType && FHIR_LABEL[r.fhirRecordType]) return FHIR_LABEL[r.fhirRecordType];
  return r.type ?? "Record";
}

function displayName(r: RepresentingRecord): string {
  if (isFhir(r)) {
    return r.fhirDisplayName ?? FHIR_LABEL[r.fhirRecordType ?? ""] ?? r.type ?? "Health Record";
  }
  return r.originalName ?? "—";
}

function viewerTitle(r: RepresentingRecord): string {
  if (r.originalName) return r.originalName;
  const ext = r.fileType?.toUpperCase() ?? "FILE";
  if (r.source === "fax") return `Fax · ${ext}`;
  return ext;
}

// ─── Lab panel grouping ─────────────────────────────────────────────────────
// Apple Health delivers each lab observation as its own FHIR row, so a chem
// panel arrives as many sibling records. Collapse them into one panel row keyed
// by (effective date, source) when not actively filtering — search/filter
// rebroaden to per-row so single-test lookups still work. Mirrors RecordsList.

type PdaRecordRow =
  | { kind: "item"; key: string; item: RepresentingRecord }
  | { kind: "panel"; key: string; date: string; source: string | null; records: RepresentingRecord[] };

function dayKey(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

function groupLabPanels(records: RepresentingRecord[]): PdaRecordRow[] {
  const labs: RepresentingRecord[] = [];
  const others: RepresentingRecord[] = [];
  for (const r of records) {
    if (r.source === FHIR_SOURCE && r.fhirRecordType === "LabResultRecord") labs.push(r);
    else others.push(r);
  }
  const panels = new Map<string, { date: string; source: string | null; records: RepresentingRecord[] }>();
  for (const lab of labs) {
    const date = dayKey(lab.time ?? lab.createdAt);
    const sourceKey = lab.fhirSource ?? "__apple__";
    const key = `${date}|${sourceKey}`;
    const slot = panels.get(key);
    if (slot) slot.records.push(lab);
    else panels.set(key, { date, source: lab.fhirSource ?? null, records: [lab] });
  }
  const rows: PdaRecordRow[] = [];
  for (const [key, panel] of panels) {
    if (panel.records.length === 1) {
      const item = panel.records[0]!;
      rows.push({ kind: "item", key: item.id, item });
    } else {
      rows.push({ kind: "panel", key, date: panel.date, source: panel.source, records: panel.records });
    }
  }
  for (const item of others) rows.push({ kind: "item", key: item.id, item });
  rows.sort((a, b) => {
    const aDate = a.kind === "panel" ? a.date : dayKey(a.item.time ?? a.item.createdAt);
    const bDate = b.kind === "panel" ? b.date : dayKey(b.item.time ?? b.item.createdAt);
    return bDate.localeCompare(aDate);
  });
  return rows;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function isoToStartOfDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0).getTime();
}

function isoToEndOfDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999).getTime();
}

function isFilterActive(f: PdaRecordsFilters): boolean {
  return f.dateFrom !== null || f.dateTo !== null || f.fileTypes.length > 0 || f.providers.length > 0;
}

export default function PdaRecords() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const insets = useSafeAreaInsets();
  const { currentPatient, loading: patientsLoading } = useRepresentedPatients();

  const filters = route.params?.filters ?? DEFAULT_PDA_FILTERS;

  const [files, setFiles] = useState<RepresentingRecord[]>([]);
  const [providers, setProviders] = useState<RecordProvider[]>([]);
  const [perm, setPerm] = useState<"viewer" | "editor" | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!currentPatient) return;
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await listRepresentingRecords(currentPatient.patientId);
      setFiles(res.files);
      setPerm(res.permission);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPatient]);

  // Refresh provider list whenever files change (mirrors patient RecordsList).
  useEffect(() => {
    if (!currentPatient || files.length === 0) return;
    let cancelled = false;
    listRepresentingRecordProviders(currentPatient.patientId)
      .then((data) => { if (!cancelled) setProviders(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [currentPatient, files]);

  const isFirstFocus = useRef(true);
  useFocusEffect(useCallback(() => {
    if (isFirstFocus.current) {
      isFirstFocus.current = false;
      void load("initial");
      return;
    }
    void load("refresh");
  }, [load]));

  const firstName = currentPatient
    ? (currentPatient.firstName ?? "the patient")
    : "the patient";

  const patientName = currentPatient
    ? `${currentPatient.firstName ?? ""} ${currentPatient.lastName ?? ""}`.trim()
    : "";

  const selectedProviderIds = useMemo(() => {
    if (!filters.providers.length) return null;
    return new Set(filters.providers);
  }, [filters.providers]);

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = filters.dateFrom ? isoToStartOfDay(filters.dateFrom) : null;
    const toMs = filters.dateTo ? isoToEndOfDay(filters.dateTo) : null;
    const typeSet = filters.fileTypes.length > 0
      ? new Set(filters.fileTypes.map((x) => x.toLowerCase()))
      : null;

    return files.filter((r) => {
      if (q) {
        const haystack = [
          viewerTitle(r),
          isFhir(r) ? displayName(r) : null,
          isFhir(r) ? fhirSubLabel(r) : null,
          isFhir(r) ? r.fhirSource : null,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      const createdMs = new Date(r.createdAt).getTime();
      if (fromMs !== null && createdMs < fromMs) return false;
      if (toMs !== null && createdMs > toMs) return false;
      if (typeSet && !typeSet.has(r.fileType.toLowerCase())) return false;
      if (selectedProviderIds && (!r.userProviderId || !selectedProviderIds.has(r.userProviderId))) return false;
      return true;
    });
  }, [files, query, filters, selectedProviderIds]);

  // Collapse lab observations into panels when nothing is narrowing the list;
  // bypass grouping while searching/filtering so single-test lookups surface the
  // individual row. Mirrors the patient RecordsList behavior.
  const displayRows = useMemo<PdaRecordRow[]>(() => {
    const filtering = query.trim().length > 0 || isFilterActive(filters);
    if (filtering) return filteredFiles.map((r) => ({ kind: "item", key: r.id, item: r }));
    return groupLabPanels(filteredFiles);
  }, [filteredFiles, query, filters]);

  const setStripProvider = (name: string | null) => {
    nav.setParams({
      filters: { ...filters, providers: name === null ? [] : [name] },
    });
  };

  const goToDetail = (r: RepresentingRecord) => {
    // Clinical (FHIR) rows have no file to view — route to the shared FHIR detail
    // screen, scoped to this patient. Documents go to the file viewer.
    if (isFhir(r)) {
      nav.navigate("RecordDetailFHIR", { recordId: r.id, patientId: currentPatient!.patientId });
      return;
    }
    nav.navigate("PdaRecordDetail", {
      fileId: r.id,
      fileURL: r.fileURL,
      fileType: r.fileType,
      source: r.source,
      createdAt: r.createdAt,
      pagecount: r.pagecount,
      originalName: r.originalName,
      userProviderId: r.userProviderId,
      patientId: currentPatient!.patientId,
      permission: perm!,
    });
  };

  const goToPanel = (row: Extract<PdaRecordRow, { kind: "panel" }>) => {
    nav.navigate("RecordDetailLabPanel", {
      recordIds: row.records.map((r) => r.id),
      date: row.date,
      source: row.source,
      patientId: currentPatient!.patientId,
    });
  };

  const filterActive = isFilterActive(filters);
  const canGoBack = nav.canGoBack();

  const DragHandle = canGoBack ? (
    <Pressable
      onPress={() => nav.goBack()}
      hitSlop={{ top: 10, bottom: 10, left: 60, right: 60 }}
      style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6, backgroundColor: t.colors.bg }}
    >
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
    </Pressable>
  ) : null;

  const Header = (
    <View style={{ gap: 16, paddingTop: t.spacing.topPad + insets.top, paddingBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: t.spacing.gutter }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          Health Records
        </Text>
        {perm === "editor" && currentPatient ? (
          <Pressable
            testID="pda-records-upload"
            onPress={() => nav.navigate("PdaUploadSheet", { patientId: currentPatient.patientId })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: t.colors.primary,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: t.radius.pill,
            }}
          >
            <Upload size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Upload</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Search + filter button row */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: t.spacing.gutter }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            height: 44,
            paddingHorizontal: 14,
            backgroundColor: t.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <Search size={16} color={t.colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by file name or type..."
            placeholderTextColor={t.colors.textPlaceholder}
            style={{ flex: 1, fontSize: 13, color: t.colors.textPrimary, paddingVertical: 0 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <Pressable
          onPress={() => nav.navigate("PdaFilterSheet", { current: filters, availableProviders: providers })}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <SlidersHorizontal size={18} color={t.colors.primary} />
          {filterActive ? (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: t.colors.primary,
              }}
            />
          ) : null}
        </Pressable>
      </View>

      {/* Provider chip strip — mirrors patient RecordsList exactly.
          Hidden when no providers are tagged on this patient's records. */}
      {providers.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: t.spacing.gutter }}
          keyboardShouldPersistTaps="handled"
        >
          {(() => {
            const allActive = filters.providers.length === 0;
            const singleSelected = filters.providers.length === 1 ? filters.providers[0] : null;
            const chips: { key: string; label: string; active: boolean; onPress: () => void }[] = [
              { key: "__all__", label: "All", active: allActive, onPress: () => setStripProvider(null) },
              ...providers.map((p) => ({
                key: p.id,
                label: p.name,
                active: singleSelected === p.id,
                onPress: () => setStripProvider(p.id),
              })),
            ];
            return chips.map((c) => (
              <Pressable
                key={c.key}
                onPress={c.onPress}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: t.radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: c.active ? t.colors.primary : "transparent",
                  borderWidth: 1,
                  borderColor: c.active ? t.colors.primary : t.colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: c.active ? "#FFFFFF" : t.colors.textPrimary }}>
                  {c.label}
                </Text>
              </Pressable>
            ));
          })()}
        </ScrollView>
      ) : null}

      {/* Viewer access banner */}
      {perm === "viewer" ? (
        <View
          style={{
            marginHorizontal: t.spacing.gutter,
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Eye size={16} color={t.colors.primary} style={{ marginTop: 1 }} />
          <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
            Viewer access — you can view {firstName}'s records but cannot upload or delete.
          </Text>
        </View>
      ) : null}
    </View>
  );

  const RowShell = ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => (
    <Pressable onPress={onPress} style={{ paddingHorizontal: t.spacing.gutter }}>
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {children}
      </View>
    </Pressable>
  );

  const Tile = ({ Icon, tile, tone }: { Icon: typeof FileText; tile: string; tone: string }) => (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: tile,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={20} color={tone} />
    </View>
  );

  const renderItemRow = (item: RepresentingRecord) => {
    const fhir = isFhir(item);
    const image = !fhir && isImage(item.fileType);
    const Icon = fhir ? FlaskConical : image ? ImageIcon : FileText;
    const tile = fhir || image ? t.colors.primaryBg : t.colors.surfaceSubtle;
    const tone = fhir || image ? t.colors.primary : t.colors.textSecondary;
    const subLabel = fhir ? fhirSubLabel(item) : image ? "Image" : "Document";
    const dateLabel = formatDate(fhir && item.time ? item.time : item.createdAt);
    const sourceLabel = fhir ? item.fhirSource : null;
    return (
      <RowShell onPress={() => goToDetail(item)}>
        <Tile Icon={Icon} tile={tile} tone={tone} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={t.type.bodyStrong} numberOfLines={1}>
            {displayName(item)}
          </Text>
          <Text style={t.type.caption} numberOfLines={1}>
            {subLabel} · {dateLabel}{sourceLabel ? ` · ${sourceLabel}` : ""}
          </Text>
        </View>
        <ChevronRight size={18} color={t.colors.textSecondary} />
      </RowShell>
    );
  };

  const renderPanelRow = (row: Extract<PdaRecordRow, { kind: "panel" }>) => (
    <RowShell onPress={() => goToPanel(row)}>
      <Tile Icon={FlaskConical} tile={t.colors.primaryBg} tone={t.colors.primary} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={t.type.bodyStrong} numberOfLines={1}>
          Lab Panel
        </Text>
        <Text style={t.type.caption} numberOfLines={1}>
          {row.records.length} results · {formatDate(row.date)}{row.source ? ` · ${row.source}` : ""}
        </Text>
      </View>
      <ChevronRight size={18} color={t.colors.textSecondary} />
    </RowShell>
  );

  const renderRow = ({ item }: { item: PdaRecordRow }) =>
    item.kind === "panel" ? renderPanelRow(item) : renderItemRow(item.item);

  if (patientsLoading || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {DragHandle}
        {Header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {DragHandle}
        {Header}
        <ErrorState title="Couldn't load records" message={error} onRetry={() => void load("initial")} />
      </View>
    );
  }

  if (!perm) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {DragHandle}
        {Header}
        <EmptyState
          icon={<ShieldOff size={32} color={t.colors.textSecondary} />}
          title="No access to records"
          subtitle={`${patientName || "This patient"} hasn't granted you access to their health records.`}
        />
      </View>
    );
  }

  const noRecords = files.length === 0;
  const noMatches = !noRecords && filteredFiles.length === 0;
  const isFiltering = query.trim().length > 0 || filterActive;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {DragHandle}
      <FlatList<PdaRecordRow>
        data={displayRows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          noRecords ? (
            <EmptyState
              icon={<FolderHeart size={32} color={t.colors.textSecondary} />}
              title="No records yet"
              subtitle={`${patientName || "This patient"} has no health records on file yet.`}
            />
          ) : noMatches ? (
            <EmptyState
              icon={<Search size={28} color={t.colors.textSecondary} />}
              title="No matches"
              subtitle={isFiltering ? "Try a different search term or clear filters." : "Nothing matched."}
              actions={[{
                label: "Clear filters",
                onPress: () => {
                  setQuery("");
                  nav.setParams({ filters: DEFAULT_PDA_FILTERS });
                },
                variant: "secondary",
              }]}
            />
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: 16,
          flexGrow: noRecords || noMatches ? 1 : undefined,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={t.colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

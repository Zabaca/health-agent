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
import { useFocusEffect, useNavigation, useNavigationState, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  FileText,
  FlaskConical,
  FolderHeart,
  Image as ImageIcon,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useTheme } from "@/theme/ThemeProvider";
import { listMyRecordProviders, listMyRecords, type IncomingFile, type RecordProvider } from "@/lib/api";
import type { RecordsFilters, RecordsParamList } from "@/navigation/types";
import { DEFAULT_FILTERS } from "./FilterSheet";

type Nav = NativeStackNavigationProp<RecordsParamList>;
type RecordsRoute = RouteProp<RecordsParamList, "RecordsList">;

/** Local-time start-of-day from yyyy-mm-dd. */
function isoToStartOfDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0).getTime();
}

/** Local-time end-of-day from yyyy-mm-dd. */
function isoToEndOfDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999).getTime();
}

function isFilterActive(f: RecordsFilters): boolean {
  return f.dateFrom !== null || f.dateTo !== null || f.fileTypes.length > 0 || f.providers.length > 0;
}

const PAGE_SIZE = 30;
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "tiff", "tif", "heic", "heif"]);

// ─── Lab panel grouping ─────────────────────────────────────────────────────
// Apple Health delivers each lab observation as its own FHIR row, so a single
// chem panel arrives as 10–15 sibling records. Collapse them into one panel
// row keyed by (effective date, source) when the user isn't actively
// filtering — search/filter rebroaden to per-row so single-test lookups still
// work.

type RecordRow =
  | { kind: "item"; key: string; item: IncomingFile }
  | { kind: "panel"; key: string; date: string; source: string | null; records: IncomingFile[] };

function dayKey(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function groupLabPanels(records: IncomingFile[]): RecordRow[] {
  const labs: IncomingFile[] = [];
  const others: IncomingFile[] = [];
  for (const r of records) {
    if (r.source === "healthkitFHIR" && r.fhirRecordType === "LabResultRecord") labs.push(r);
    else others.push(r);
  }
  const panels = new Map<string, { date: string; source: string | null; records: IncomingFile[] }>();
  for (const lab of labs) {
    const date = dayKey(lab.time ?? lab.createdAt);
    const sourceKey = lab.fhirSource ?? "__apple__";
    const key = `${date}|${sourceKey}`;
    const slot = panels.get(key);
    if (slot) slot.records.push(lab);
    else panels.set(key, { date, source: lab.fhirSource ?? null, records: [lab] });
  }
  const rows: RecordRow[] = [];
  for (const [key, panel] of panels) {
    if (panel.records.length === 1) {
      const item = panel.records[0]!;
      rows.push({ kind: "item", key: item.id, item });
    } else {
      rows.push({ kind: "panel", key, date: panel.date, source: panel.source, records: panel.records });
    }
  }
  for (const item of others) rows.push({ kind: "item", key: item.id, item });
  // Sort: panels by their date, items by time/createdAt — both desc.
  rows.sort((a, b) => {
    const aDate = a.kind === "panel" ? a.date : dayKey(a.item.time ?? a.item.createdAt);
    const bDate = b.kind === "panel" ? b.date : dayKey(b.item.time ?? b.item.createdAt);
    return bDate.localeCompare(aDate);
  });
  return rows;
}

function isImage(fileType: string): boolean {
  return IMAGE_EXTS.has(fileType.toLowerCase().replace(/^\./, ""));
}

function isFhir(file: IncomingFile): boolean {
  return file.source === "healthkitFHIR";
}

// HealthKit recordType → friendly label for the sub-text. Mirrors the map in
// RecordDetailFHIR so both surfaces stay in sync.
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

function fhirSubLabel(file: IncomingFile): string {
  if (file.fhirRecordType && FHIR_LABEL[file.fhirRecordType]) return FHIR_LABEL[file.fhirRecordType];
  return file.type ?? "Record";
}

// List label — matches web (`apps/web/src/components/records/MyRecordsTable.tsx`):
// fax-sourced files have no originalName, fall back to em-dash. FHIR rows use
// the resource's displayName / recordType so they read as real records.
function displayName(file: IncomingFile): string {
  if (isFhir(file)) {
    return file.fhirDisplayName ?? FHIR_LABEL[file.fhirRecordType ?? ""] ?? file.type ?? "Health Record";
  }
  return file.uploadLog?.originalName ?? "—";
}

// Viewer header — uses a descriptive synthesized label for fax/no-name files
// instead of "—" so the user has context inside the viewer.
function viewerTitle(file: IncomingFile): string {
  if (file.uploadLog?.originalName) return file.uploadLog.originalName;
  const ext = file.fileType?.toUpperCase() ?? "FILE";
  if (file.source === "fax") return `Fax · ${ext}`;
  return ext;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function RecordsList() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const route = useRoute<RecordsRoute>();
  const insets = useSafeAreaInsets();
  const filters = route.params?.filters ?? DEFAULT_FILTERS;
  const [records, setRecords] = useState<IncomingFile[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Provider list cached on RecordsList — FilterSheet reads it via params, and
  // we use it here to map selected provider names → release codes for filter
  // and to populate the on-screen quick-filter chip strip.
  const [providers, setProviders] = useState<RecordProvider[]>([]);

  // Quick-filter chip strip (single-select). Drives `filters.providers`:
  //   - "All" pill   → filters.providers = []
  //   - provider X   → filters.providers = [X]
  // Multi-select still available via FilterSheet for power users; the strip
  // de-emphasizes (no chip highlighted) when 2+ providers are selected.
  const setStripProvider = (name: string | null) => {
    nav.setParams({
      filters: { ...filters, providers: name === null ? [] : [name] },
    });
  };
  // Guard against onEndReached firing while a paged fetch is already running
  // or after the prior onMomentumScrollBegin hasn't completed — a known
  // FlatList quirk that fires the callback multiple times per scroll.
  const fetchingMore = useRef(false);

  const loadInitial = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const page = await listMyRecords({ limit: PAGE_SIZE });
      setRecords(page.items);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (fetchingMore.current || !nextCursor || loadingMore) return;
    fetchingMore.current = true;
    setLoadingMore(true);
    try {
      const page = await listMyRecords({ cursor: nextCursor, limit: PAGE_SIZE });
      setRecords((prev) => (prev ? [...prev, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
    } catch (e) {
      // Don't sign-out path; surface inline as a footer error if we want later.
      // For now, swallow and let the user pull-to-refresh to retry.
      // eslint-disable-next-line no-console
      console.warn("Failed to load more records:", e);
    } finally {
      setLoadingMore(false);
      fetchingMore.current = false;
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    loadInitial("initial");
  }, [loadInitial]);

  // Refresh the provider list any time records change (initial fetch,
  // pull-to-refresh, post-upload focus refetch) so newly tagged providers
  // appear in the filter without requiring a full app reload.
  useEffect(() => {
    if (records === null) return;
    let cancelled = false;
    listMyRecordProviders()
      .then((data) => {
        if (!cancelled) setProviders(data);
      })
      .catch(() => {
        // Non-fatal: filter will just lack the providers section.
      });
    return () => {
      cancelled = true;
    };
  }, [records]);

  // Refetch from page 1 when returning from UploadSheet so a just-uploaded
  // record appears without the user pulling to refresh. Skip the first focus
  // — the mount-time useEffect already loaded.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadInitial("refresh");
    }, [loadInitial]),
  );

  const selectedProviderIds = useMemo(() => {
    if (!filters.providers.length) return null;
    return new Set(filters.providers);
  }, [filters.providers]);

  // Client-side filter applied to the currently-loaded page set. Server-side
  // search/filter would require API changes (cursor + filter combo); deferred
  // until we hit a real scale problem.
  const filteredRecords = useMemo(() => {
    if (!records) return null;
    const q = query.trim().toLowerCase();
    const fromMs = filters.dateFrom ? isoToStartOfDay(filters.dateFrom) : null;
    const toMs = filters.dateTo ? isoToEndOfDay(filters.dateTo) : null;
    const typeSet = filters.fileTypes.length > 0
      ? new Set(filters.fileTypes.map((x) => x.toLowerCase()))
      : null;
    return records.filter((r) => {
      // Match on the descriptive label so "fax" / "tiff" find fax records
      // even though the list renders them as "—". For FHIR rows, also match on
      // the rendered display name + record-type label since viewerTitle returns
      // the raw MIME ("APPLICATION/FHIR+JSON") which the user won't type.
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
      if (selectedProviderIds && (!r.userProviderId || !selectedProviderIds.has(r.userProviderId))) {
        return false;
      }
      return true;
    });
  }, [records, query, filters, selectedProviderIds]);

  // Group lab observations into panels when there's nothing narrowing the
  // list — a search for "basophils" should still surface the individual row,
  // so we bypass grouping whenever a query or filter is active.
  const displayRows = useMemo<RecordRow[] | null>(() => {
    if (!filteredRecords) return null;
    const filtering = query.trim().length > 0 || isFilterActive(filters);
    if (filtering) {
      return filteredRecords.map((r) => ({ kind: "item", key: r.id, item: r }));
    }
    return groupLabPanels(filteredRecords);
  }, [filteredRecords, query, filters]);

  // Only show the swipe-to-dismiss grabber when this screen is actually presented
  // on top of something in its OWN stack (pushed / modal sheet). `nav.canGoBack()`
  // is the wrong signal here: the screen's nav is a composite (stack + tabs), so it
  // returns true on the Records tab root merely because Records isn't the first tab
  // (back would switch to Home) — which left a stray grabber + extra top gap on the
  // tab root. The host stack's index is 0 only when this screen is that stack's root.
  const isPresented = useNavigationState((state) => state.index > 0);

  const DragHandle = isPresented ? (
    <Pressable
      onPress={() => nav.goBack()}
      hitSlop={{ top: 10, bottom: 10, left: 60, right: 60 }}
      style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6, backgroundColor: t.colors.bg }}
    >
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
    </Pressable>
  ) : null;

  const goToViewer = (record: IncomingFile) => {
    if (isFhir(record)) {
      nav.navigate("RecordDetailFHIR", { recordId: record.id });
      return;
    }
    nav.navigate("DocumentViewer", {
      fileId: record.id,
      fileURL: record.fileURL,
      fileType: record.fileType,
      title: viewerTitle(record),
      createdAt: record.createdAt,
      source: record.source,
      userProviderId: record.userProviderId,
    });
  };

  // Header lives OUTSIDE the FlatList. If we put the search TextInput inside
  // ListHeaderComponent, FlatList re-renders the header on every parent state
  // change (e.g. each keystroke updating `query`), which remounts the
  // TextInput and steals focus. Rendering above FlatList keeps it stable.
  const Header = (
    <View style={{ gap: 16, paddingTop: t.spacing.topPad + insets.top, paddingBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: t.spacing.gutter,
        }}
      >
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          My Records
        </Text>
        <Pressable
          testID="records-upload"
          onPress={() => nav.navigate("UploadSheet")}
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
      </View>

      {/* Search row (matches Pencil "03 - Records" → searchRow) */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: t.spacing.gutter,
        }}
      >
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
          onPress={() => nav.navigate("FilterSheet", { current: filters, availableProviders: providers })}
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
          {isFilterActive(filters) ? (
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

      {/* Provider quick-filter strip (matches Pencil "03 - Records" → chips).
          Hidden when the user has no tagged providers — a lone "All" pill
          would just be visual noise. Multi-select is handled in FilterSheet;
          when 2+ providers are selected via the sheet, no strip pill shows
          active so the strip stays consistent with single-select semantics. */}
      {providers.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: t.spacing.gutter }}
          keyboardShouldPersistTaps="handled"
        >
          {(() => {
            const allActive = filters.providers.length === 0;
            const singleSelected =
              filters.providers.length === 1 ? filters.providers[0] : null;
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
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.active ? "#FFFFFF" : t.colors.textPrimary,
                  }}
                >
                  {c.label}
                </Text>
              </Pressable>
            ));
          })()}
        </ScrollView>
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

  const renderItemRow = (item: IncomingFile) => {
    const fhir = isFhir(item);
    const image = !fhir && isImage(item.fileType);
    const Icon = fhir ? FlaskConical : image ? ImageIcon : FileText;
    const tile = fhir ? t.colors.primaryBg : image ? t.colors.primaryBg : t.colors.surfaceSubtle;
    const tone = fhir ? t.colors.primary : image ? t.colors.primary : t.colors.textSecondary;
    const subLabel = fhir ? fhirSubLabel(item) : image ? "Image" : "Document";
    // FHIR clinical effective date is the meaningful date for the user; fall
    // back to createdAt for non-FHIR rows.
    const dateLabel = formatDate((fhir && item.time) ? item.time : item.createdAt);
    const sourceLabel = fhir ? item.fhirSource : null;
    return (
      <RowShell onPress={() => goToViewer(item)}>
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

  const renderPanelRow = (row: Extract<RecordRow, { kind: "panel" }>) => {
    const dateLabel = formatDate(row.date);
    const count = row.records.length;
    const sourceLabel = row.source ?? null;
    return (
      <RowShell
        onPress={() =>
          nav.navigate("RecordDetailLabPanel", {
            recordIds: row.records.map((r) => r.id),
            date: row.date,
            source: row.source,
          })
        }
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: t.colors.primaryBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FlaskConical size={20} color={t.colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={t.type.bodyStrong} numberOfLines={1}>
            Lab Panel
          </Text>
          <Text style={t.type.caption} numberOfLines={1}>
            {count} results · {dateLabel}{sourceLabel ? ` · ${sourceLabel}` : ""}
          </Text>
        </View>
        <ChevronRight size={18} color={t.colors.textSecondary} />
      </RowShell>
    );
  };

  const renderRow = ({ item }: { item: RecordRow }) =>
    item.kind === "panel" ? renderPanelRow(item) : renderItemRow(item.item);

  // ─── Initial loading screen ───────────────────────────────────────────────
  if (loading && !records) {
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

  // ─── Error screen (no records to show) ────────────────────────────────────
  if (error && !records) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {DragHandle}
        {Header}
        <ErrorState title="Couldn't load records" message={error} onRetry={() => loadInitial("initial")} />
      </View>
    );
  }

  // ─── List (incl. empty state) ─────────────────────────────────────────────
  const isFiltering = query.trim().length > 0 || isFilterActive(filters);
  const noRecords = records !== null && records.length === 0;
  const noMatches = !noRecords && filteredRecords && filteredRecords.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {DragHandle}
      {Header}
      <FlatList<RecordRow>
        data={displayRows ?? []}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          noRecords ? (
            <EmptyState
              icon={<FolderHeart size={32} color={t.colors.textSecondary} />}
              title="No records yet"
              subtitle="Upload your medical records or have a provider send them in via HIPAA release."
              actions={[
                {
                  label: "Upload Record",
                  icon: <Upload size={16} color="#FFFFFF" />,
                  onPress: () => nav.navigate("UploadSheet"),
                },
              ]}
            />
          ) : noMatches ? (
            <EmptyState
              icon={<Search size={28} color={t.colors.textSecondary} />}
              title="No matches"
              subtitle={
                isFiltering
                  ? "Try a different search term or clear filters."
                  : "Nothing matched."
              }
              actions={[
                {
                  label: "Clear filters",
                  onPress: () => {
                    setQuery("");
                    nav.setParams({ filters: DEFAULT_FILTERS });
                  },
                  variant: "secondary",
                },
              ]}
            />
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={t.colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: 16,
          flexGrow: noRecords || noMatches ? 1 : undefined,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadInitial("refresh")}
            tintColor={t.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

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
  AlertTriangle,
  ChevronRight,
  Eye,
  FileText,
  FolderHeart,
  Image as ImageIcon,
  Search,
  ShieldOff,
  SlidersHorizontal,
  Upload,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
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

function isImage(fileType: string): boolean {
  return IMAGE_EXTS.has(fileType.toLowerCase().replace(/^\./, ""));
}

function displayName(r: RepresentingRecord): string {
  return r.originalName ?? "—";
}

function viewerTitle(r: RepresentingRecord): string {
  if (r.originalName) return r.originalName;
  const ext = r.fileType?.toUpperCase() ?? "FILE";
  if (r.source === "fax") return `Fax · ${ext}`;
  return ext;
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
    } catch {
      setError("Could not load records.");
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
      if (q && !viewerTitle(r).toLowerCase().includes(q)) return false;
      const createdMs = new Date(r.createdAt).getTime();
      if (fromMs !== null && createdMs < fromMs) return false;
      if (toMs !== null && createdMs > toMs) return false;
      if (typeSet && !typeSet.has(r.fileType.toLowerCase())) return false;
      if (selectedProviderIds && (!r.userProviderId || !selectedProviderIds.has(r.userProviderId))) return false;
      return true;
    });
  }, [files, query, filters, selectedProviderIds]);

  const setStripProvider = (name: string | null) => {
    nav.setParams({
      filters: { ...filters, providers: name === null ? [] : [name] },
    });
  };

  const goToDetail = (r: RepresentingRecord) => {
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

  const renderItem = ({ item }: { item: RepresentingRecord }) => {
    const image = isImage(item.fileType);
    const Icon = image ? ImageIcon : FileText;
    const tile = image ? t.colors.primaryBg : t.colors.surfaceSubtle;
    const tone = image ? t.colors.primary : t.colors.textSecondary;
    return (
      <Pressable onPress={() => goToDetail(item)} style={{ paddingHorizontal: t.spacing.gutter }}>
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
            <Text style={t.type.caption}>
              {(image ? "Image" : "Document")} · {formatDate(item.createdAt)}
            </Text>
          </View>
          <ChevronRight size={18} color={t.colors.textSecondary} />
        </View>
      </Pressable>
    );
  };

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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: t.colors.destructiveBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={24} color={t.colors.destructive} />
          </View>
          <Text style={[t.type.h3, { textAlign: "center" }]}>Couldn't load records</Text>
          <Text style={[t.type.caption, { textAlign: "center" }]}>{error}</Text>
          <Pressable
            onPress={() => void load("initial")}
            style={{
              backgroundColor: t.colors.primary,
              borderRadius: t.radius.button,
              paddingVertical: 12,
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Retry</Text>
          </Pressable>
        </View>
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
      <FlatList
        data={filteredFiles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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

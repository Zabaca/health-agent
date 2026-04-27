const baseColors = {
  bg: "#F5F4F1",
  surface: "#FFFFFF",
  surfaceSubtle: "#F0EEE9",
  divider: "#F0EEE9",
  border: "#E8E6E1",
  borderMuted: "#D8D6D0",
  textPrimary: "#1A1A1A",
  textSecondary: "#9B9B8A",
  textPlaceholder: "#C4C4B8",
  destructive: "#C0392B",
  destructiveBg: "#FDF2F2",
  destructiveBorder: "#C0392B4D",
  accent: "#D89575",
  accent20: "#D8957533",
};

export const colors = {
  ...baseColors,
  primary: "#3D8A5A",
  primary10: "#3D8A5A1A",
  primary15: "#3D8A5A26",
  primary20: "#3D8A5A33",
  primary40: "#3D8A5A66",
  primary60: "#3D8A5A99",
  primaryBg: "#E8F0EB",
} as const;

export const pdaColors = {
  ...baseColors,
  primary: "#4A78C8",
  primary10: "#4A78C81A",
  primary15: "#4A78C826",
  primary20: "#4A78C833",
  primary40: "#4A78C866",
  primary60: "#4A78C899",
  primaryBg: "#EAF1FB",
} as const;

export const spacing = {
  gutter: 24,
  topPad: 20,
  gap: 16,
  sectionGap: 24,
  tightGap: 8,
  buttonGap: 12,
} as const;

export const radius = {
  card: 14,
  button: 14,
  pill: 999,
} as const;

export const dims = {
  screenW: 402,
  contentW: 354,
  headerH: 56,
  navBarH: 95,
  buttonH: 52,
  buttonW: 354,
  listRowH: 60,
  iconBox: 56,
  icon: 24,
} as const;

export const type = {
  titleHeader: { fontSize: 17, fontWeight: "700" as const, color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: "400" as const, color: colors.textPrimary },
  bodyStrong: { fontSize: 16, fontWeight: "600" as const, color: colors.textPrimary },
  rowLabel: { fontSize: 13, fontWeight: "400" as const, color: colors.textSecondary },
  rowValue: { fontSize: 16, fontWeight: "400" as const, color: colors.textPrimary },
  sectionLabel: { fontSize: 13, fontWeight: "600" as const, color: colors.textSecondary, letterSpacing: 0.4 },
  button: { fontSize: 16, fontWeight: "600" as const },
  tab: { fontSize: 11, fontWeight: "500" as const },
  caption: { fontSize: 13, fontWeight: "400" as const, color: colors.textSecondary },
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.textPrimary },
} as const;

export type ColorPalette = { [K in keyof typeof colors]: string };
export type Theme = { colors: ColorPalette; spacing: typeof spacing; radius: typeof radius; dims: typeof dims; type: typeof type };

export const theme: Theme = { colors: colors as ColorPalette, spacing, radius, dims, type };
export const pdaTheme: Theme = { colors: pdaColors as ColorPalette, spacing, radius, dims, type };

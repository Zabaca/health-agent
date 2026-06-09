import { ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { LegalDocument as LegalDocumentData, LegalSection } from "./content";

export function LegalDocument({ doc }: { doc: LegalDocumentData }) {
  const t = useTheme();
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        gap: 16,
      }}
    >
      <View style={{ gap: 4, paddingBottom: 8 }}>
        <Text style={t.type.h2}>{doc.title}</Text>
        <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>
          Effective {doc.effectiveDate} · Version {doc.version}
        </Text>
      </View>
      {doc.sections.map((s) => (
        <Section key={s.heading} section={s} />
      ))}
    </ScrollView>
  );
}

function Section({ section }: { section: LegalSection }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[t.type.h3, { color: t.colors.textPrimary }]}>{section.heading}</Text>
      {section.body.map((block, i) =>
        typeof block === "string" ? (
          <Text key={i} style={[t.type.body, { color: t.colors.textPrimary, lineHeight: 22 }]}>
            {block}
          </Text>
        ) : (
          <View key={i} style={{ gap: 6, paddingLeft: 4 }}>
            {block.bullets.map((b, j) => (
              <View key={j} style={{ flexDirection: "row", gap: 8 }}>
                <Text style={[t.type.body, { color: t.colors.textSecondary }]}>•</Text>
                <Text style={[t.type.body, { color: t.colors.textPrimary, lineHeight: 22, flex: 1 }]}>{b}</Text>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

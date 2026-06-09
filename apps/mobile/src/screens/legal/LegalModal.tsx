import { Modal, View } from "react-native";
import { Header } from "@/components/Header";
import { useTheme } from "@/theme/ThemeProvider";
import { LegalDocument } from "./LegalDocument";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "./content";

type Kind = "terms" | "privacy" | null;

/** Renders the legal document in a self-contained modal. Use this from
 *  screens that live outside the navigator tree (e.g. the pre-auth
 *  consent gate), where `nav.navigate(...)` isn't available. */
export function LegalModal({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const t = useTheme();
  if (!kind) return null;
  const doc = kind === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY;
  const title = kind === "terms" ? "Terms of Service" : "Privacy Policy";
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <Header title={title} variant="close" onBack={onClose} />
        <LegalDocument doc={doc} />
      </View>
    </Modal>
  );
}

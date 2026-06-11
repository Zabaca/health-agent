import { AlertTriangle } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { EmptyState } from "./EmptyState";

type Props = {
  /** Resource-specific headline, e.g. "Couldn't load records". */
  title?: string;
  /** Raw error message (e.g. from a caught Error). Normalized for display. */
  message?: string | null;
  onRetry?: () => void;
};

/**
 * Standard failed-to-load state for list screens. Built on EmptyState so error
 * and empty states share the same icon circle / spacing / button styling. Use
 * this everywhere a fetch can fail instead of hand-rolling per-screen error UI.
 */
export function ErrorState({ title = "Couldn't load", message, onRetry }: Props) {
  const t = useTheme();
  return (
    <EmptyState
      icon={<AlertTriangle size={32} color={t.colors.accent} />}
      iconBg={t.colors.destructiveBg}
      title={title}
      subtitle={humanizeError(message)}
      actions={onRetry ? [{ label: "Retry", onPress: onRetry }] : []}
    />
  );
}

/** Turn raw fetch/network errors into a consistent, user-facing offline message. */
function humanizeError(message?: string | null): string {
  if (!message || /network request failed|failed to fetch|network error|timed? ?out|timeout/i.test(message)) {
    return "You appear to be offline. Check your connection and try again.";
  }
  return message;
}

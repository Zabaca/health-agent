import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import {
  searchAddresses,
  resolveAddress,
  addressAutocompleteAvailable,
  type AddressSuggestion,
} from "@/lib/addressAutocomplete";

type Props = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
};

const DEBOUNCE_MS = 250;
const MIN_CHARS = 3;
const MAX_SUGGESTIONS = 5;

/**
 * Address field with native MapKit typeahead (iOS). On platforms without the
 * native module (Android/web) it degrades to a plain field that still benefits
 * from OS autofill via the textContentType / autoComplete props.
 */
export function AddressAutocompleteInput({ label, value, onChangeText, placeholder, required, error }: Props) {
  const t = useTheme();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set when we fill the field from a tapped suggestion, so the resulting text
  // change doesn't immediately fire another search.
  const suppressSearch = useRef(false);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleChange = useCallback(
    (text: string) => {
      onChangeText(text);
      if (!addressAutocompleteAvailable) return;
      if (suppressSearch.current) { suppressSearch.current = false; return; }
      if (timer.current) clearTimeout(timer.current);

      const q = text.trim();
      if (q.length < MIN_CHARS) { setSuggestions([]); return; }
      timer.current = setTimeout(async () => {
        const results = await searchAddresses(q);
        setSuggestions(results.slice(0, MAX_SUGGESTIONS));
      }, DEBOUNCE_MS);
    },
    [onChangeText],
  );

  const handleSelect = useCallback(
    async (s: AddressSuggestion) => {
      if (timer.current) clearTimeout(timer.current);
      setSuggestions([]);
      suppressSearch.current = true;
      const full = await resolveAddress(s.title, s.subtitle);
      onChangeText(full);
    },
    [onChangeText],
  );

  return (
    <View style={{ gap: 6 }}>
      <Input
        label={label}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        required={required}
        error={error}
        textContentType="fullStreetAddress"
        autoComplete="street-address"
        autoCapitalize="words"
      />
      {suggestions.length > 0 ? (
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderColor: t.colors.border,
            borderWidth: 1,
            borderRadius: t.radius.button,
            overflow: "hidden",
          }}
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={`${s.title}|${s.subtitle}`}
              onPress={() => handleSelect(s)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.border,
                backgroundColor: pressed ? t.colors.border : t.colors.surface,
              })}
            >
              <Text style={[t.type.rowLabel, { color: t.colors.textPrimary }]} numberOfLines={1}>
                {s.title}
              </Text>
              {s.subtitle ? (
                <Text style={t.type.caption} numberOfLines={1}>
                  {s.subtitle}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

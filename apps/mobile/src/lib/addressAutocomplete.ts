import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

export type AddressSuggestion = { title: string; subtitle: string };

type NativeAddressAutocomplete = {
  searchAddresses(query: string): Promise<AddressSuggestion[]>;
  resolveAddress(title: string, subtitle: string): Promise<string>;
};

// requireOptionalNativeModule returns null when the native module isn't linked
// (Android, web, or an old build predating the module) instead of throwing.
const native = requireOptionalNativeModule<NativeAddressAutocomplete>("AddressAutocomplete");

/** True when native MapKit autocomplete is available (iOS with the module built in). */
export const addressAutocompleteAvailable = native != null && Platform.OS === "ios";

/** Suggestions for a partial address. Resolves [] when unavailable. */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!native) return [];
  try {
    return await native.searchAddresses(query);
  } catch {
    return [];
  }
}

/** Resolve a chosen suggestion to a full single-line postal address (with ZIP). */
export async function resolveAddress(title: string, subtitle: string): Promise<string> {
  const fallback = subtitle ? `${title}, ${subtitle}` : title;
  if (!native) return fallback;
  try {
    return (await native.resolveAddress(title, subtitle)) || fallback;
  } catch {
    return fallback;
  }
}

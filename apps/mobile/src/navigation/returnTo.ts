import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { SetupReturnTo } from "./types";

/**
 * Navigate back to a destination on the Home tab from a screen living in any
 * other tab's stack. Used by screens launched from the Account Setup checklist
 * (which lives on the Home tab) so they can return there after completing.
 *
 * We go through `getParent()` — the bottom-tab navigator — which switches to
 * HomeTab and forwards to the requested Home stack screen. The screen is
 * already in the Home stack history (the user came from it), so this focuses
 * it rather than pushing a duplicate.
 */
export function returnToSetup(
  nav: NavigationProp<ParamListBase>,
  returnTo: SetupReturnTo | null | undefined
): boolean {
  if (returnTo !== "AccountSetup" && returnTo !== "Home") return false;
  const screen = returnTo === "Home" ? "Dashboard" : "AccountSetup";
  nav.getParent()?.navigate("HomeTab", { screen });
  return true;
}

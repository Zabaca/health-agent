import { createContext, useContext, type PropsWithChildren } from "react";
import { theme as patientTheme, pdaTheme, type Theme } from "./tokens";

const ThemeContext = createContext<Theme>(patientTheme);

type Variant = "patient" | "pda";

export function ThemeProvider({ variant = "patient", children }: PropsWithChildren<{ variant?: Variant }>) {
  const value = variant === "pda" ? pdaTheme : patientTheme;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

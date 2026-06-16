// E2E-only console forwarder — imported first so it patches console before the
// app runs. No-op unless EXPO_PUBLIC_E2E === "1".
import "./src/lib/e2eConsole";
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);

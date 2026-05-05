import { useEffect, useState } from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";
import { API_URL, getSessionToken } from "@/lib/api";

type Props = {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "contain" | "cover" | "stretch" | "center";
};

export function AuthenticatedImage({ uri, style, resizeMode = "contain" }: Props) {
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    if (!uri) return;
    if (!uri.startsWith("/")) {
      setDataUri(uri);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await getSessionToken();
        const res = await fetch(`${API_URL}${uri}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (!cancelled) setDataUri(reader.result as string);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        // silently fail — image stays hidden
      }
    })();

    return () => { cancelled = true; };
  }, [uri]);

  if (!dataUri) return null;
  return <Image source={{ uri: dataUri }} style={style} resizeMode={resizeMode} />;
}

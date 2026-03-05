import crypto from "crypto";

/**
 * Upload a buffer to Transloadit using the HTTP API directly (same path as
 * browser components). This produces permanent pub-XXXX.r2.dev CDN URLs,
 * unlike the Node SDK which stages files at temporary tmp-XXXX.transloadit.com.
 */
export async function uploadBufferToTransloadit(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const params = JSON.stringify({
    auth: {
      key:     process.env.TRANSLOADIT_KEY!,
      expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
    steps: { ":original": { robot: "/upload/handle" } },
  });

  const signature =
    "sha384:" +
    crypto
      .createHmac("sha384", process.env.TRANSLOADIT_SECRET!)
      .update(Buffer.from(params, "utf-8"))
      .digest("hex");

  const formData = new FormData();
  formData.append("params", params);
  formData.append("signature", signature);
  formData.append("file", new Blob([buffer]), filename);

  const res = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
    method: "POST",
    body:   formData,
  });

  const data = await res.json();
  const url = data.uploads?.[0]?.ssl_url;
  if (!url) throw new Error("No URL returned from Transloadit");
  return url;
}

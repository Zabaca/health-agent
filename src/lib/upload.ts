import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveFile(
  data: Buffer | string,
  extension: string = "png"
): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${uuidv4()}.${extension}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  if (typeof data === "string") {
    // base64 data URL
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    await writeFile(filepath, Buffer.from(base64Data, "base64"));
  } else {
    await writeFile(filepath, data);
  }

  return `/uploads/${filename}`;
}

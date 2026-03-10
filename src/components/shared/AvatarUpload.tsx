"use client";

import { useRef, useState } from "react";
import { Avatar, ActionIcon, Box, Loader } from "@mantine/core";
import { IconCamera } from "@tabler/icons-react";

interface AvatarUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  name?: string;
}

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json();
  if (!url) throw new Error("No URL returned from upload");
  return url;
}

export default function AvatarUpload({ value, onChange, name }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Box style={{ position: "relative", width: 80, height: 80 }}>
      <Avatar
        src={value || undefined}
        size={80}
        radius="50%"
        style={{ cursor: "pointer" }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? <Loader size="sm" /> : getInitials(name)}
      </Avatar>
      <ActionIcon
        size="sm"
        radius="50%"
        variant="filled"
        color="gray"
        style={{ position: "absolute", bottom: 0, right: 0, pointerEvents: uploading ? "none" : "auto" }}
        onClick={() => !uploading && inputRef.current?.click()}
        aria-label="Upload avatar"
      >
        <IconCamera size={12} />
      </ActionIcon>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </Box>
  );
}

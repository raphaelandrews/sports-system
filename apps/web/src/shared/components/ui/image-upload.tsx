import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@sports-system/ui/components/button";
import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
import { toast } from "sonner";
import { buildApiUrl } from "@/shared/lib/url";

function getAccessToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
  return match ? match.split("=")[1] : undefined;
}

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

async function processImage(
  file: File,
  options: ProcessImageOptions = {},
): Promise<Blob> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert image"));
          }
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

async function uploadImage(file: File, endpoint = "/upload/image"): Promise<string> {
  const processed = await processImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
  });

  const formData = new FormData();
  formData.append("file", processed, `${file.name.replace(/\.[^/.]+$/, "")}.webp`);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildApiUrl(endpoint), {
    method: "POST",
    body: formData,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(json.detail ?? "Upload failed");
  }

  const json = await res.json();
  return json.url as string;
}

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  fallback?: string;
  accept?: string;
  maxSizeMB?: number;
  endpoint?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Imagem",
  fallback = "?",
  accept = "image/*",
  maxSizeMB = 5,
  endpoint = "/upload/image",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value ?? "");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`A imagem deve ter no máximo ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file, endpoint);
      setPreviewUrl(url);
      onChange(url);
      toast.success("Imagem enviada com sucesso.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setPreviewUrl("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div className="flex items-center gap-4">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-20 w-20 rounded-md object-cover border"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Avatar className="h-20 w-20 rounded-md">
            <AvatarFallback className="text-2xl rounded-md">{fallback}</AvatarFallback>
          </Avatar>
        )}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 size-4" />
            {uploading ? "Enviando..." : "Enviar imagem"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">
            WebP, PNG, JPG ou GIF. Máx. {maxSizeMB}MB. Redimensionado para 800x800.
          </p>
        </div>
      </div>
    </div>
  );
}

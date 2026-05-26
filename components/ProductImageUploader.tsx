"use client";

import Image from "next/image";
import { Camera, ImagePlus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const maxSize = 900;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.72));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
}

export function ProductImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  async function handleFiles(selectedFiles: FileList | null) {
    const compressed = await Promise.all(Array.from(selectedFiles || []).map(compressImage));
    const transfer = new DataTransfer();
    compressed.forEach((file) => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
    setFiles(compressed);
  }

  return (
    <div className="space-y-3">
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-racing-line bg-racing-soft p-4 text-center text-sm">
        <ImagePlus className="text-racing-red" size={24} />
        <span className="mt-2 font-black">Carregar fotos leves</span>
        <span className="text-xs text-racing-muted">A imagem é reduzida antes de enviar para o sistema</span>
        <input
          ref={inputRef}
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </label>
      {previews.length ? (
        <div className="grid grid-cols-3 gap-2">
          {previews.map(({ file, url }, index) => (
            <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-racing-line bg-racing-soft">
              <Image src={url} alt={file.name} fill className="object-cover" />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-racing-red px-1.5 py-0.5 text-[10px] font-black text-white">
                  Principal
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-racing-muted">
          <Camera size={14} />
          Você também pode escolher uma foto pronta acima.
        </p>
      )}
    </div>
  );
}

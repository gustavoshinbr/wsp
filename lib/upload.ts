import { randomBytes } from "crypto";
import { put } from "@vercel/blob";
import { ApiError } from "@/lib/validations";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

function extensionFromMime(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return null;
}

export function sanitizeFilename(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function saveImageUpload(file: File, folder = "products") {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_SIZE) throw new ApiError("Imagem maior que 5 MB.");

  const extension = extensionFromMime(file.type);
  if (!extension) throw new ApiError("Envie apenas JPEG, PNG ou WebP.");
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const signatureMatches =
    (file.type === "image/jpeg" && isJpeg) ||
    (file.type === "image/png" && isPng) ||
    (file.type === "image/webp" && isWebp);
  if (!signatureMatches) throw new ApiError("O conteúdo do arquivo não corresponde a uma imagem válida.");

  const original = sanitizeFilename(file.name || `imagem.${extension}`);
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}-${original.replace(/\.[^.]+$/, "")}.${extension}`;
  const blob = await put(`${folder}/${filename}`, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return {
    filename,
    url: blob.url,
  };
}

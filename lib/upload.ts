import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

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
  if (file.size > MAX_UPLOAD_SIZE) throw new Error("Imagem maior que 5 MB.");

  const extension = extensionFromMime(file.type);
  if (!extension) throw new Error("Envie apenas JPEG, PNG ou WebP.");

  const original = sanitizeFilename(file.name || `imagem.${extension}`);
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}-${original.replace(/\.[^.]+$/, "")}.${extension}`;
  const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";
  const dir = path.join(process.cwd(), uploadRoot, folder);
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return {
    filename,
    url: `/uploads/${folder}/${filename}`,
  };
}

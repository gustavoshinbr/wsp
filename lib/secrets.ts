import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { ApiError } from "@/lib/validations";

const VERSION = "v1";

function encryptionKey() {
  const secret = process.env.FISCAL_CREDENTIALS_KEY?.trim() || process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("FISCAL_CREDENTIALS_KEY precisa estar configurada com uma chave forte.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string, context: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value: string, context: string) {
  try {
    const [version, ivValue, tagValue, encryptedValue] = value.split(".");
    if (version !== VERSION || !ivValue || !tagValue || !encryptedValue) throw new Error("Formato inválido.");

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new ApiError("Não foi possível ler a credencial fiscal. Salve o token novamente.", 500);
  }
}

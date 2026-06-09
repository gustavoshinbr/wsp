export type NeonIdentity = {
  id: string;
  email: string;
  name?: string | null;
};

export function neonAuthConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL?.trim();
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  return {
    enabled: Boolean(baseUrl && cookieSecret && cookieSecret.length >= 32),
    baseUrl,
    jwksUrl,
    cookieSecret,
  };
}

export function assertNeonAuthIdentity(input: unknown): NeonIdentity {
  if (!input || typeof input !== "object") throw new Error("Identidade Neon Auth inválida.");
  const value = input as Record<string, unknown>;
  const id = String(value.id || "").trim();
  const email = String(value.email || "").trim().toLowerCase();
  const name = value.name ? String(value.name).trim() : null;
  if (!id || !email) throw new Error("Identidade Neon Auth incompleta.");
  return { id, email, name };
}

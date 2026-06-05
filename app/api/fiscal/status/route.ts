import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { focusNfeConfigured, focusRequest, type FocusEnvironment } from "@/lib/focus-nfe";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/validations";
import { onlyDigits } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireApiUser();
    const config = await prisma.fiscalConfig.findUnique({ where: { workspaceId: user.workspaceId } });
    const environment = (config?.environment === "producao" ? "producao" : "homologacao") as FocusEnvironment;
    const cnpj = onlyDigits(config?.cnpj || user.workspace.document);

    if (!focusNfeConfigured()) {
      return NextResponse.json({
        configured: false,
        connected: false,
        environment,
        message: "FOCUS_NFE_TOKEN não foi configurado.",
      });
    }

    const result = await focusRequest<unknown>(
      environment,
      `/v2/empresas?cnpj=${encodeURIComponent(cnpj)}`,
    );
    const companies = Array.isArray(result)
      ? result
      : result && typeof result === "object" && Array.isArray((result as Record<string, unknown>).empresas)
        ? (result as { empresas: Array<Record<string, unknown>> }).empresas
        : [];
    const company = companies[0];
    const nfceEnabled = company
      ? [true, 1, "1", "true", "sim"].includes(company.habilita_nfce as never)
      : false;

    return NextResponse.json({
      configured: true,
      connected: true,
      environment,
      companyFound: Boolean(company),
      nfceEnabled,
      certificateValidUntil: company?.certificado_valido_ate || null,
      message: company
        ? "Conexão realizada. Confira a habilitação da NFC-e e o certificado."
        : "Token válido, mas o CNPJ da oficina não foi encontrado na Focus NFe.",
    });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ configured: focusNfeConfigured(), connected: false, message }, { status });
  }
}

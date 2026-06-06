import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAuthorizedNfeXml, type SebraeDraftPayload } from "@/lib/sebrae-fiscal";
import { apiError, ApiError } from "@/lib/validations";
import { onlyDigits } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const formData = await req.formData();
    const file = formData.get("xml");
    if (!(file instanceof File) || !file.size) throw new ApiError("Selecione o XML autorizado da NF-e.");
    if (file.size > 3_000_000) throw new ApiError("O XML ultrapassa o limite de 3 MB.");

    const [document, config] = await Promise.all([
      prisma.fiscalDocument.findFirst({
        where: { id, workspaceId: user.workspaceId, provider: "SEBRAE", type: "NFE" },
      }),
      prisma.fiscalConfig.findUnique({ where: { workspaceId: user.workspaceId } }),
    ]);
    if (!document) throw new ApiError("Rascunho fiscal não encontrado.", 404);
    if (!config) throw new ApiError("Configuração fiscal não encontrada.", 404);
    if (document.status === "AUTHORIZED") throw new ApiError("Esta NF-e já possui um XML autorizado arquivado.");

    const xml = await file.text();
    const parsed = parseAuthorizedNfeXml(xml);
    if (parsed.issuerDocument !== onlyDigits(config.cnpj)) {
      throw new ApiError("O CNPJ emitente do XML não pertence a esta oficina.");
    }
    const payload = document.payload as unknown as SebraeDraftPayload;
    if (!payload || payload.preparedFor !== "SEBRAE") throw new ApiError("Rascunho fiscal incompatível.");
    if (Math.abs(parsed.total - payload.totals.products) > 0.02) {
      throw new ApiError("O valor total do XML não corresponde aos produtos desta venda.");
    }
    const duplicate = await prisma.fiscalDocument.findFirst({
      where: {
        workspaceId: user.workspaceId,
        accessKey: parsed.accessKey,
        id: { not: document.id },
      },
      select: { id: true },
    });
    if (duplicate) throw new ApiError("Esta chave de acesso já está arquivada em outro documento.");

    await prisma.fiscalDocument.update({
      where: { id: document.id },
      data: {
        status: "AUTHORIZED",
        environment: parsed.environment,
        number: parsed.number,
        series: parsed.series,
        accessKey: parsed.accessKey,
        protocol: parsed.protocol,
        statusCode: parsed.statusCode,
        message: parsed.message,
        xmlContent: xml,
        xmlUrl: `/api/fiscal/sebrae/${document.id}/xml`,
        response: {
          importedAt: new Date().toISOString(),
          authorizedAt: parsed.authorizedAt,
          total: parsed.total,
          source: "SEBRAE_XML",
        } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.redirect(new URL("/fiscal?success=sebrae-imported", req.url), { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/fiscal", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}

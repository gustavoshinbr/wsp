import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import {
  absoluteFocusUrl,
  focusDocumentStatus,
  focusRequest,
  optionalFocusText,
  type FocusEnvironment,
  type FocusNfceResponse,
} from "@/lib/focus-nfe";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const document = await prisma.fiscalDocument.findFirst({
      where: { id, workspaceId: user.workspaceId, type: "NFCE" },
    });
    if (!document) throw new ApiError("Documento fiscal não encontrado.", 404);

    const environment = (document.environment === "producao" ? "producao" : "homologacao") as FocusEnvironment;
    const response = await focusRequest<FocusNfceResponse>(
      environment,
      `/v2/nfce/${encodeURIComponent(document.reference)}?completa=1`,
    );
    const status = focusDocumentStatus(response.status);
    const updated = await prisma.fiscalDocument.update({
      where: { id: document.id },
      data: {
        status,
        number: optionalFocusText(response.numero) || document.number,
        series: optionalFocusText(response.serie) || document.series,
        accessKey: optionalFocusText(response.chave_nfe) || document.accessKey,
        protocol: optionalFocusText(response.numero_protocolo) || document.protocol,
        statusCode: optionalFocusText(response.status_sefaz) || document.statusCode,
        message: optionalFocusText(response.mensagem_sefaz) || String(response.status || ""),
        danfeUrl: absoluteFocusUrl(environment, response.caminho_danfe) || document.danfeUrl,
        xmlUrl: absoluteFocusUrl(environment, response.caminho_xml_nota_fiscal) || document.xmlUrl,
        qrCodeUrl: optionalFocusText(response.qrcode_url) || document.qrCodeUrl,
        response: response as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import {
  absoluteFocusUrl,
  focusDocumentStatus,
  focusNfeConfigured,
  focusPaymentCode,
  focusRequest,
  optionalFocusText,
  type FocusEnvironment,
  type FocusNfceResponse,
} from "@/lib/focus-nfe";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { onlyDigits } from "@/lib/utils";

type IssueBody = {
  saleId?: string;
};

function cleanFiscalCode(value?: string | null) {
  return String(value || "").replace(/\D/g, "");
}

function fiscalReference(saleId: string) {
  return `wsp${saleId.replace(/[^a-z0-9]/gi, "").slice(-24)}`;
}

export async function POST(req: Request) {
  let documentId: string | null = null;

  try {
    const user = await requireApiUser();
    if (!focusNfeConfigured()) {
      throw new ApiError("Defina FOCUS_NFE_TOKEN antes de emitir uma NFC-e.");
    }

    const body = (await req.json()) as IssueBody;
    if (!body.saleId) throw new ApiError("Selecione uma venda para emitir a NFC-e.");

    const [config, sale, existingDocument] = await Promise.all([
      prisma.fiscalConfig.findUnique({ where: { workspaceId: user.workspaceId } }),
      prisma.sale.findFirst({
        where: { id: body.saleId, workspaceId: user.workspaceId },
        include: {
          client: true,
          items: { include: { product: true } },
        },
      }),
      prisma.fiscalDocument.findFirst({
        where: {
          workspaceId: user.workspaceId,
          saleId: body.saleId,
          type: "NFCE",
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!config) throw new ApiError("Salve os dados fiscais da oficina antes de emitir.");
    if (!sale) throw new ApiError("Venda não encontrada.", 404);
    if (existingDocument?.status === "AUTHORIZED") {
      throw new ApiError("Esta venda já possui uma NFC-e autorizada.");
    }
    if (existingDocument?.status === "PROCESSING") {
      throw new ApiError("A NFC-e desta venda já está em processamento.");
    }

    const cnpj = onlyDigits(config.cnpj);
    if (cnpj.length !== 14) throw new ApiError("Informe um CNPJ válido nos dados fiscais.");

    const productItems = sale.items.filter((item) => item.type === "PRODUCT");
    if (!productItems.length) {
      throw new ApiError("A venda não possui mercadorias. Serviços devem ser emitidos por NFS-e.");
    }

    for (const item of productItems) {
      const ncm = cleanFiscalCode(item.product?.ncm || config.defaultNcm);
      const cfop = cleanFiscalCode(item.product?.cfop || config.defaultCfop);
      const csosn = cleanFiscalCode(item.product?.csosn || config.defaultCsosn);
      if (ncm.length !== 8) throw new ApiError(`Informe um NCM de 8 dígitos para "${item.description}".`);
      if (cfop.length !== 4) throw new ApiError(`Informe um CFOP de 4 dígitos para "${item.description}".`);
      if (csosn.length !== 3) throw new ApiError(`Informe um CSOSN de 3 dígitos para "${item.description}".`);
    }

    const environment = (config.environment === "producao" ? "producao" : "homologacao") as FocusEnvironment;
    const productTotal = productItems.reduce((sum, item) => sum + Number(item.total), 0);
    const reference = existingDocument
      ? `${fiscalReference(sale.id)}r${Date.now()}`
      : fiscalReference(sale.id);
    const payload = {
      natureza_operacao: "VENDA AO CONSUMIDOR",
      data_emissao: new Date().toISOString(),
      tipo_documento: "1",
      finalidade_emissao: "1",
      consumidor_final: "1",
      presenca_comprador: "1",
      cnpj_emitente: cnpj,
      indicador_inscricao_estadual_destinatario: "9",
      modalidade_frete: "9",
      local_destino: "1",
      ...(sale.client?.name ? { nome_destinatario: sale.client.name } : {}),
      items: productItems.map((item, index) => {
        const product = item.product;
        const unit = (product?.fiscalUnit || config.defaultUnit || "UN").toUpperCase();
        return {
          numero_item: index + 1,
          codigo_produto: product?.id.slice(-20) || item.id.slice(-20),
          descricao: item.description.slice(0, 120),
          codigo_ncm: cleanFiscalCode(product?.ncm || config.defaultNcm),
          cfop: cleanFiscalCode(product?.cfop || config.defaultCfop),
          unidade_comercial: unit,
          quantidade_comercial: item.quantity,
          valor_unitario_comercial: Number(item.unitPrice),
          valor_bruto: Number(item.total),
          unidade_tributavel: unit,
          quantidade_tributavel: item.quantity,
          valor_unitario_tributavel: Number(item.unitPrice),
          icms_origem: cleanFiscalCode(product?.fiscalOrigin || config.defaultOrigin),
          icms_situacao_tributaria: cleanFiscalCode(product?.csosn || config.defaultCsosn),
          pis_situacao_tributaria: cleanFiscalCode(config.defaultPisCst),
          cofins_situacao_tributaria: cleanFiscalCode(config.defaultCofinsCst),
        };
      }),
      formas_pagamento: [
        {
          indicador_pagamento: sale.paymentStatus === "CREDIT_OPEN" ? "1" : "0",
          forma_pagamento: focusPaymentCode(sale.paymentMethod),
          valor_pagamento: productTotal,
        },
      ],
      valor_produtos: productTotal,
      valor_total: productTotal,
      informacoes_adicionais_contribuinte:
        sale.items.length > productItems.length
          ? "Esta NFC-e contempla somente as mercadorias. Serviços devem possuir NFS-e própria."
          : undefined,
    };

    const document = existingDocument
      ? await prisma.$transaction(async (tx) => {
          const locked = await tx.fiscalDocument.updateMany({
            where: {
              id: existingDocument.id,
              status: { in: ["REJECTED", "ERROR", "CANCELLED"] },
            },
            data: {
              status: "PROCESSING",
              environment,
              reference,
              payload: payload as Prisma.InputJsonValue,
              message: null,
            },
          });
          if (locked.count !== 1) throw new ApiError("Já existe outra tentativa de emissão em andamento.");
          return tx.fiscalDocument.findUniqueOrThrow({ where: { id: existingDocument.id } });
        })
      : await prisma.fiscalDocument.create({
          data: {
            workspaceId: user.workspaceId,
            saleId: sale.id,
            type: "NFCE",
            status: "PROCESSING",
            provider: "FOCUS_NFE",
            environment,
            reference,
            payload: payload as Prisma.InputJsonValue,
          },
        });
    documentId = document.id;

    const response = await focusRequest<FocusNfceResponse>(
      environment,
      `/v2/nfce?ref=${encodeURIComponent(reference)}&completa=1`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    const status = focusDocumentStatus(response.status);

    const updated = await prisma.fiscalDocument.update({
      where: { id: document.id },
      data: {
        status,
        number: optionalFocusText(response.numero),
        series: optionalFocusText(response.serie),
        accessKey: optionalFocusText(response.chave_nfe),
        protocol: optionalFocusText(response.numero_protocolo),
        statusCode: optionalFocusText(response.status_sefaz),
        message: optionalFocusText(response.mensagem_sefaz) || String(response.status || ""),
        danfeUrl: absoluteFocusUrl(environment, response.caminho_danfe),
        xmlUrl: absoluteFocusUrl(environment, response.caminho_xml_nota_fiscal),
        qrCodeUrl: optionalFocusText(response.qrcode_url),
        response: response as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      ok: status === "AUTHORIZED",
      document: updated,
      servicesExcluded: sale.items.length - productItems.length,
    });
  } catch (error) {
    const normalizedError =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
        ? new ApiError("Já existe outra tentativa de emissão para esta venda.")
        : error;
    const { message, status } = apiError(normalizedError);
    if (documentId) {
      await prisma.fiscalDocument
        .update({
          where: { id: documentId },
          data: { status: "ERROR", message },
        })
        .catch(() => null);
    }
    return NextResponse.json({ error: message }, { status });
  }
}

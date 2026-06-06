import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sebraePortalUrl,
  type SebraeDraftPayload,
  type SebraeEnvironment,
} from "@/lib/sebrae-fiscal";
import { apiError, ApiError } from "@/lib/validations";
import { onlyDigits } from "@/lib/utils";

type PrepareBody = {
  saleId?: string;
};

function fiscalCode(value?: string | null) {
  return onlyDigits(String(value || ""));
}

function referenceFor(saleId: string) {
  return `sebrae${saleId.replace(/[^a-z0-9]/gi, "").slice(-24)}`;
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const body = (await req.json()) as PrepareBody;
    if (!body.saleId) throw new ApiError("Selecione uma venda para preparar a NF-e.");

    const [storedConfig, sale, existing] = await Promise.all([
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
          type: "NFE",
          provider: "SEBRAE",
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!sale) throw new ApiError("Venda não encontrada.", 404);
    if (existing?.status === "AUTHORIZED") throw new ApiError("Esta venda já possui uma NF-e autorizada.");

    const cnpj = onlyDigits(storedConfig?.cnpj || user.workspace.document);
    if (cnpj.length !== 14) {
      throw new ApiError("A emissão de NF-e exige o CNPJ da oficina. Atualize os dados na configuração fiscal.");
    }
    const config = storedConfig || await prisma.fiscalConfig.create({
      data: {
        workspaceId: user.workspaceId,
        companyName: user.workspace.workshopName,
        cnpj,
        phone: user.workspace.phone,
        email: user.workspace.email,
        provider: "SEBRAE",
        environment: "homologacao",
      },
    });

    const productItems = sale.items.filter((item) => item.type === "PRODUCT");
    const serviceItems = sale.items.filter((item) => item.type !== "PRODUCT");
    if (!productItems.length) {
      throw new ApiError("A venda não possui mercadorias. Serviços devem ser emitidos em uma NFS-e.");
    }

    const items = productItems.map((item) => {
      const ncm = fiscalCode(item.product?.ncm || config.defaultNcm);
      const cfop = fiscalCode(item.product?.cfop || config.defaultCfop);
      const csosn = fiscalCode(item.product?.csosn || config.defaultCsosn);
      if (ncm.length !== 8) throw new ApiError(`Informe um NCM de 8 dígitos para "${item.description}".`);
      if (cfop.length !== 4) throw new ApiError(`Informe um CFOP de 4 dígitos para "${item.description}".`);
      if (csosn.length !== 3) throw new ApiError(`Informe um CSOSN de 3 dígitos para "${item.description}".`);

      return {
        code: item.product?.id.slice(-20) || item.id.slice(-20),
        description: item.description.slice(0, 120),
        ncm,
        cfop,
        csosn,
        unit: (item.product?.fiscalUnit || config.defaultUnit || "UN").toUpperCase(),
        origin: fiscalCode(item.product?.fiscalOrigin || config.defaultOrigin) || "0",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      };
    });
    const productTotal = items.reduce((sum, item) => sum + item.total, 0);
    const servicesTotal = serviceItems.reduce((sum, item) => sum + Number(item.total), 0);
    const environment = (config.environment === "producao" ? "producao" : "homologacao") as SebraeEnvironment;
    const payload: SebraeDraftPayload = {
      version: 1,
      preparedFor: "SEBRAE",
      issuer: {
        companyName: config.companyName,
        cnpj,
        stateRegistration: config.stateRegistration,
        address: config.address,
        phone: config.phone,
        email: config.email,
      },
      recipient: {
        name: sale.client?.name || null,
        document: sale.client?.document || null,
        email: sale.client?.email || null,
        phone: sale.client?.phone || null,
        address: sale.client?.address || null,
      },
      sale: {
        id: sale.id,
        createdAt: sale.createdAt.toISOString(),
        paymentMethod: sale.paymentMethod,
      },
      items,
      servicesExcluded: serviceItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        total: Number(item.total),
      })),
      totals: {
        products: productTotal,
        servicesExcluded: servicesTotal,
        sale: Number(sale.total),
      },
      notes: [
        "Natureza da operação sugerida: venda de mercadoria.",
        "Consumidor final. Confira tributação, CFOP e impostos com a contabilidade.",
        ...(serviceItems.length ? ["Os serviços desta venda não fazem parte da NF-e e devem ser emitidos por NFS-e."] : []),
      ],
    };
    const reference = existing?.reference || referenceFor(sale.id);
    const document = existing
      ? await prisma.fiscalDocument.update({
          where: { id: existing.id },
          data: {
            status: "DRAFT",
            environment,
            payload: payload as unknown as Prisma.InputJsonValue,
            message: "Rascunho preparado para preenchimento no Emissor Sebrae.",
          },
        })
      : await prisma.fiscalDocument.create({
          data: {
            workspaceId: user.workspaceId,
            saleId: sale.id,
            type: "NFE",
            status: "DRAFT",
            provider: "SEBRAE",
            environment,
            reference,
            payload: payload as unknown as Prisma.InputJsonValue,
            message: "Rascunho preparado para preenchimento no Emissor Sebrae.",
          },
        });

    return NextResponse.json({
      documentId: document.id,
      guideUrl: `/fiscal/sebrae/${document.id}`,
      portalUrl: sebraePortalUrl(environment),
      servicesExcluded: serviceItems.length,
    });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString, normalizeDocument } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    requireManager(user.role);
    const formData = await req.formData();
    const companyName = formString(formData, "companyName");
    const cnpj = normalizeDocument(formString(formData, "cnpj"));
    if (!companyName || cnpj.length !== 14) throw new ApiError("Empresa e CNPJ válido são obrigatórios.");
    const defaultNcm = normalizeDocument(formString(formData, "defaultNcm"));
    const defaultCfop = normalizeDocument(formString(formData, "defaultCfop")) || "5102";
    const defaultCsosn = normalizeDocument(formString(formData, "defaultCsosn")) || "102";
    const defaultPisCst = normalizeDocument(formString(formData, "defaultPisCst")) || "49";
    const defaultCofinsCst = normalizeDocument(formString(formData, "defaultCofinsCst")) || "49";
    const defaultOrigin = normalizeDocument(formString(formData, "defaultOrigin")) || "0";
    if (defaultNcm && defaultNcm.length !== 8) throw new ApiError("O NCM padrão deve possuir 8 dígitos.");
    if (defaultCfop.length !== 4) throw new ApiError("O CFOP padrão deve possuir 4 dígitos.");
    if (defaultCsosn.length !== 3) throw new ApiError("O CSOSN padrão deve possuir 3 dígitos.");
    if (defaultPisCst.length !== 2 || defaultCofinsCst.length !== 2) {
      throw new ApiError("Os códigos CST de PIS e COFINS devem possuir 2 dígitos.");
    }
    if (defaultOrigin.length !== 1) throw new ApiError("A origem do ICMS deve possuir 1 dígito.");
    const fiscalDefaults = {
      provider: "SEBRAE",
      environment: formString(formData, "environment") === "producao" ? "producao" : "homologacao",
      defaultNcm: defaultNcm || null,
      defaultCfop,
      defaultCsosn,
      defaultPisCst,
      defaultCofinsCst,
      defaultUnit: formString(formData, "defaultUnit").toUpperCase() || "UN",
      defaultOrigin,
    };

    await prisma.fiscalConfig.upsert({
      where: { workspaceId: user.workspaceId },
      update: {
        companyName,
        cnpj,
        stateRegistration: formString(formData, "stateRegistration") || null,
        municipalRegistration: formString(formData, "municipalRegistration") || null,
        address: formString(formData, "address") || null,
        phone: formString(formData, "phone") || null,
        email: formString(formData, "email") || null,
        ...fiscalDefaults,
      },
      create: {
        workspaceId: user.workspaceId,
        companyName,
        cnpj,
        stateRegistration: formString(formData, "stateRegistration") || null,
        municipalRegistration: formString(formData, "municipalRegistration") || null,
        address: formString(formData, "address") || null,
        phone: formString(formData, "phone") || null,
        email: formString(formData, "email") || null,
        ...fiscalDefaults,
      },
    });

    return NextResponse.redirect(new URL("/fiscal?success=1", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/fiscal", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

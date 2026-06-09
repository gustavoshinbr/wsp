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
    const fiscalDefaults = {
      provider: "SEBRAE",
      environment: formString(formData, "environment") === "producao" ? "producao" : "homologacao",
      defaultNcm: normalizeDocument(formString(formData, "defaultNcm")) || null,
      defaultCfop: normalizeDocument(formString(formData, "defaultCfop")) || "5102",
      defaultCsosn: normalizeDocument(formString(formData, "defaultCsosn")) || "102",
      defaultPisCst: normalizeDocument(formString(formData, "defaultPisCst")) || "49",
      defaultCofinsCst: normalizeDocument(formString(formData, "defaultCofinsCst")) || "49",
      defaultUnit: formString(formData, "defaultUnit").toUpperCase() || "UN",
      defaultOrigin: normalizeDocument(formString(formData, "defaultOrigin")) || "0",
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

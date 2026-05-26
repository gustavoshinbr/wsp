import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString, normalizeDocument } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const formData = await req.formData();
    const companyName = formString(formData, "companyName");
    const cnpj = normalizeDocument(formString(formData, "cnpj"));
    if (!companyName || !cnpj) throw new ApiError("Empresa e CNPJ são obrigatórios.");

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

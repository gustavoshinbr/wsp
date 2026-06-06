import { NextResponse } from "next/server";
import { requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secrets";
import { apiError } from "@/lib/validations";
import { formString, normalizeDocument } from "@/lib/utils";

function tokenUpdate(input: {
  currentEncrypted?: string | null;
  currentLastFour?: string | null;
  token: string;
  remove: boolean;
  context: string;
}) {
  if (input.remove) {
    return { encrypted: null, lastFour: null };
  }
  if (!input.token) {
    return {
      encrypted: input.currentEncrypted || null,
      lastFour: input.currentLastFour || null,
    };
  }
  return {
    encrypted: encryptSecret(input.token, input.context),
    lastFour: input.token.slice(-4),
  };
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    requireManager(user.role);
    const formData = await req.formData();
    const current = await prisma.fiscalConfig.findUnique({
      where: { workspaceId: user.workspaceId },
    });

    const homologation = tokenUpdate({
      currentEncrypted: current?.focusHomologationTokenEncrypted,
      currentLastFour: current?.focusHomologationTokenLastFour,
      token: formString(formData, "focusHomologationToken"),
      remove: formData.get("removeHomologationToken") === "on",
      context: `focus-nfe:${user.workspaceId}:homologacao`,
    });
    const production = tokenUpdate({
      currentEncrypted: current?.focusProductionTokenEncrypted,
      currentLastFour: current?.focusProductionTokenLastFour,
      token: formString(formData, "focusProductionToken"),
      remove: formData.get("removeProductionToken") === "on",
      context: `focus-nfe:${user.workspaceId}:producao`,
    });

    const credentials = {
      focusHomologationTokenEncrypted: homologation.encrypted,
      focusHomologationTokenLastFour: homologation.lastFour,
      focusProductionTokenEncrypted: production.encrypted,
      focusProductionTokenLastFour: production.lastFour,
    };

    await prisma.fiscalConfig.upsert({
      where: { workspaceId: user.workspaceId },
      update: credentials,
      create: {
        workspaceId: user.workspaceId,
        companyName: user.workspace.workshopName,
        cnpj: normalizeDocument(user.workspace.document),
        phone: user.workspace.phone,
        email: user.workspace.email,
        ...credentials,
      },
    });

    const url = new URL("/configuracoes", req.url);
    url.searchParams.set("success", "focus-nfe");
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/configuracoes", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}

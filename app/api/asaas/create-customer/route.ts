import { NextResponse } from "next/server";
import { createAsaasCustomer } from "@/lib/asaas";
import { requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/validations";

export async function POST() {
  try {
    const user = await requireApiUser({ allowExpiredSubscription: true });
    requireManager(user.role);
    if (user.workspace.asaasCustomerId) {
      return NextResponse.json({ id: user.workspace.asaasCustomerId });
    }

    const customer = await createAsaasCustomer({
      name: user.workspace.workshopName,
      email: user.workspace.email,
      phone: user.workspace.phone,
      cpfCnpj: user.workspace.document,
      externalReference: user.workspace.id,
    });

    await prisma.workspace.update({
      where: { id: user.workspaceId },
      data: { asaasCustomerId: customer.id },
    });

    return NextResponse.json(customer);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

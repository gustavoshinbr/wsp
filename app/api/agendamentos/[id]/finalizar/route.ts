import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrementStock } from "@/lib/stock";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const formData = await req.formData().catch(() => new FormData());
    const paymentMethod = formString(formData, "paymentMethod") || "À vista";

    const appointment = await prisma.appointment.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: { items: true },
    });
    if (!appointment) throw new ApiError("Agendamento não encontrado.", 404);
    if (appointment.status === "FINISHED") throw new ApiError("Agendamento já finalizado.");
    if (appointment.status === "CANCELLED") throw new ApiError("Agendamento cancelado não pode ser finalizado.");

    await prisma.$transaction(async (tx) => {
      const locked = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          workspaceId: user.workspaceId,
          status: "SCHEDULED",
        },
        data: { status: "FINISHED" },
      });
      if (locked.count !== 1) throw new ApiError("Agendamento já finalizado ou cancelado.");

      const existingSale = await tx.sale.findFirst({
        where: { workspaceId: user.workspaceId, appointmentId: appointment.id },
      });
      if (existingSale) throw new ApiError("Agendamento já gerou uma venda.");

      await decrementStock(tx, user.workspaceId, appointment.items);

      const sale = await tx.sale.create({
        data: {
          workspaceId: user.workspaceId,
          clientId: appointment.clientId,
          motorcycleId: appointment.motorcycleId,
          mechanicId: appointment.mechanicId,
          appointmentId: appointment.id,
          total: Number(appointment.total || 0),
          paymentMethod,
          paymentStatus: "PAID",
          paidAt: new Date(),
          items: {
            create: appointment.items.map((item) => ({
              productId: item.productId,
              serviceId: item.serviceId,
              type: item.type,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });

      return sale;
    });

    return NextResponse.redirect(new URL("/vendas", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/agendamentos", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

import { NextResponse } from "next/server";
import { requireApiUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";
import { formString } from "@/lib/utils";

async function ensureAppointment(id: string, workspaceId: string) {
  const appointment = await prisma.appointment.findFirst({ where: { id, workspaceId } });
  if (!appointment) throw new ApiError("Agendamento não encontrado.", 404);
  return appointment;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const appointment = await prisma.appointment.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: { client: true, motorcycle: true, items: { include: { product: true, service: true } } },
    });
    if (!appointment) throw new ApiError("Agendamento não encontrado.", 404);
    return NextResponse.json(appointment);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const appointment = await ensureAppointment(id, user.workspaceId);
    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "delete") {
      requireManager(user.role);
      await prisma.$transaction([
        prisma.sale.updateMany({
          where: { appointmentId: id, workspaceId: user.workspaceId },
          data: { appointmentId: null },
        }),
        prisma.appointment.delete({ where: { id } }),
      ]);
    } else {
      const clientId = formString(formData, "clientId") || appointment.clientId;
      const motorcycleId = formString(formData, "motorcycleId") || null;
      const mechanicId = formString(formData, "mechanicId") || null;
      const status = formString(formData, "status") as "SCHEDULED" | "FINISHED" | "CANCELLED";
      const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: user.workspaceId },
        select: { id: true },
      });
      if (!client) throw new ApiError("Cliente inválido.", 404);
      if (motorcycleId) {
        const motorcycle = await prisma.motorcycle.findFirst({
          where: { id: motorcycleId, workspaceId: user.workspaceId, clientId },
          select: { id: true },
        });
        if (!motorcycle) throw new ApiError("Moto inválida para o cliente selecionado.", 404);
      }
      if (mechanicId) {
        const mechanic = await prisma.user.findFirst({
          where: { id: mechanicId, workspaceId: user.workspaceId, isActive: true, isMechanic: true },
          select: { id: true },
        });
        if (!mechanic) throw new ApiError("Mecânico inválido.", 404);
      }
      if (appointment.status !== "FINISHED" && status && status !== "SCHEDULED" && status !== "CANCELLED") {
        throw new ApiError("Status de agendamento inválido.");
      }
      const dateValue = formString(formData, "date");
      const date = dateValue ? new Date(dateValue) : undefined;
      if (date && Number.isNaN(date.getTime())) throw new ApiError("Data de agendamento inválida.");
      const nextStatus = appointment.status === "FINISHED" ? "FINISHED" : status || appointment.status;
      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id },
          data: {
            clientId,
            motorcycleId,
            mechanicId,
            date,
            notes: formString(formData, "notes") || null,
            status: nextStatus,
          },
        });
        if (appointment.status === "FINISHED") {
          await tx.sale.updateMany({
            where: { appointmentId: id, workspaceId: user.workspaceId },
            data: { clientId, motorcycleId, mechanicId },
          });
        }
      });
    }

    return NextResponse.redirect(new URL("/agendamentos", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/agendamentos", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    requireManager(user.role);
    await ensureAppointment(id, user.workspaceId);
    await prisma.$transaction([
      prisma.sale.updateMany({
        where: { appointmentId: id, workspaceId: user.workspaceId },
        data: { appointmentId: null },
      }),
      prisma.appointment.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

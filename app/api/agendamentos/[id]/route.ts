import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
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
      if (appointment.status === "FINISHED") {
        throw new ApiError("Agendamento finalizado não pode ser excluído.");
      }
      await prisma.appointment.delete({ where: { id } });
    } else {
      const status = formString(formData, "status") as "SCHEDULED" | "FINISHED" | "CANCELLED";
      if (status === "FINISHED") {
        throw new ApiError("Use a ação de finalizar para gerar a venda e baixar o estoque.");
      }
      if (status && status !== "SCHEDULED" && status !== "CANCELLED") {
        throw new ApiError("Status de agendamento inválido.");
      }
      const dateValue = formString(formData, "date");
      const date = dateValue ? new Date(dateValue) : undefined;
      if (date && Number.isNaN(date.getTime())) throw new ApiError("Data de agendamento inválida.");
      await prisma.appointment.update({
        where: { id },
        data: {
          date,
          notes: formString(formData, "notes") || null,
          status: status || "SCHEDULED",
        },
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
    const appointment = await ensureAppointment(id, user.workspaceId);
    if (appointment.status === "FINISHED") {
      throw new ApiError("Agendamento finalizado não pode ser excluído.");
    }
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

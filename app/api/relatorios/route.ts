import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(String(searchParams.get("from"))) : new Date();
    const to = searchParams.get("to") ? new Date(String(searchParams.get("to"))) : new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: { workspaceId: user.workspaceId, createdAt: { gte: from, lte: to } },
      include: { client: true, items: { include: { product: true, service: true } } },
    });

    const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const profit = sales.reduce(
      (sum, sale) =>
        sum +
        sale.items.reduce((itemSum, item) => {
          if (item.product) return itemSum + (Number(item.unitPrice) - Number(item.product.buyPrice)) * item.quantity;
          return itemSum + Number(item.total);
        }, 0),
      0,
    );

    return NextResponse.json({
      total,
      profit,
      salesCount: sales.length,
      servicesCount: sales.reduce((sum, sale) => sum + sale.items.filter((item) => item.serviceId).length, 0),
      clientsCount: new Set(sales.map((sale) => sale.clientId).filter(Boolean)).size,
    });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

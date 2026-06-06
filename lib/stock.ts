import type { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/validations";

type StockItem = {
  productId?: string | null;
  quantity: number;
  description: string;
};

export async function decrementStock(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  items: StockItem[],
) {
  for (const item of items) {
    if (!item.productId) continue;

    const updated = await tx.product.updateMany({
      where: {
        id: item.productId,
        workspaceId,
        quantity: { gte: item.quantity },
      },
      data: { quantity: { decrement: item.quantity } },
    });

    if (updated.count !== 1) {
      throw new ApiError(`Estoque insuficiente para ${item.description}.`);
    }
  }
}

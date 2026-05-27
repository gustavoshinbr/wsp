import { prisma } from "@/lib/prisma";

export const defaultStockProducts = [
  { name: "Oleo 10W30", buyPrice: 0, sellPrice: 0, quantity: 0, mainImageUrl: "/product-presets/oleo-10w30.svg" },
  { name: "Oleo 20W50", buyPrice: 0, sellPrice: 0, quantity: 0, mainImageUrl: "/product-presets/oleo-20w50.svg" },
  { name: "Oleo 15W40", buyPrice: 0, sellPrice: 0, quantity: 0, mainImageUrl: "/product-presets/oleo-15w40.svg" },
  { name: "Oleo 5W30", buyPrice: 0, sellPrice: 0, quantity: 0, mainImageUrl: "/product-presets/oleo-5w30.svg" },
  {
    name: "Relacao (corrente de moto)",
    buyPrice: 0,
    sellPrice: 0,
    quantity: 0,
    mainImageUrl: "/product-presets/relacao-corrente.svg",
  },
];

export async function ensureDefaultStockProducts(workspaceId: string) {
  const existingProducts = await prisma.product.findMany({
    where: {
      workspaceId,
      OR: defaultStockProducts.map((product) => ({
        name: { equals: product.name, mode: "insensitive" },
      })),
    },
    select: { name: true },
  });
  const existingNames = new Set(existingProducts.map((product) => product.name.toLowerCase()));
  const missingProducts = defaultStockProducts.filter((product) => !existingNames.has(product.name.toLowerCase()));

  if (!missingProducts.length) return;

  await prisma.product.createMany({
    data: missingProducts.map((product) => ({ ...product, workspaceId })),
  });
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspaceId = process.env.SEED_WORKSPACE_ID;
  if (!workspaceId) {
    console.log("Seed opcional: defina SEED_WORKSPACE_ID para criar produtos e serviços de exemplo.");
    return;
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    console.log("Workspace informado em SEED_WORKSPACE_ID não encontrado.");
    return;
  }

  await prisma.service.createMany({
    data: [
      { workspaceId, name: "Troca de óleo", price: 30, description: "Mão de obra para troca de óleo." },
      { workspaceId, name: "Revisão completa", price: 120, description: "Checklist geral da moto." },
      { workspaceId, name: "Freio dianteiro", price: 60, description: "Manutenção do sistema de freio." },
    ],
    skipDuplicates: true,
  });

  await prisma.product.createMany({
    data: [
      { workspaceId, name: "Óleo Motul 7100 10W40", buyPrice: 35, sellPrice: 45, quantity: 15 },
      { workspaceId, name: "Pastilha de freio dianteira", buyPrice: 18, sellPrice: 24, quantity: 20 },
      { workspaceId, name: "Filtro de óleo", buyPrice: 10, sellPrice: 18, quantity: 30 },
    ],
    skipDuplicates: true,
  });

  console.log("Seed de produtos e serviços concluído para o workspace informado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

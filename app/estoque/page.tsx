import Link from "next/link";
import { Barcode, Boxes, Image as ImageIcon, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BarcodeInput } from "@/components/BarcodeInput";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { PresetImagePicker } from "@/components/PresetImagePicker";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import { ProductStockActions } from "@/components/ProductStockActions";
import { requirePageUser } from "@/lib/auth";
import { brl } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { productImagePresets } from "@/lib/product-presets";
import { cn } from "@/lib/utils";

export default async function EstoquePage({ searchParams }: { searchParams: { q?: string; error?: string; view?: string } }) {
  const user = await requirePageUser();
  const q = searchParams.q?.trim();
  const preferredView = user.workspace.stockViewMode === "simples" ? "simples" : "completo";
  const view = searchParams.view === "simples" || searchParams.view === "completo" ? searchParams.view : preferredView;
  const products = await prisma.product.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { barcode: { contains: q, mode: "insensitive" } },
              { qrCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
  const editableProduct = (product: (typeof products)[number]) => ({
    id: product.id,
    name: product.name,
    buyPrice: Number(product.buyPrice),
    sellPrice: Number(product.sellPrice),
    quantity: product.quantity,
    barcode: product.barcode,
    qrCode: product.qrCode,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Estoque</h1>
            <p className="text-sm text-racing-muted">Modo simples para balcão e modo completo com fotos dos principais produtos.</p>
          </div>
          <div className="flex rounded-lg border border-racing-line bg-racing-panel p-1">
            <Link
              href="/estoque?view=simples"
              className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black", view === "simples" ? "bg-racing-red text-white" : "text-racing-muted")}
            >
              <Boxes size={16} />
              Simples
            </Link>
            <Link
              href="/estoque?view=completo"
              className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black", view === "completo" ? "bg-racing-red text-white" : "text-racing-muted")}
            >
              <ImageIcon size={16} />
              Completo
            </Link>
          </div>
        </div>
        {searchParams.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{searchParams.error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <Card>
            <h2 className="text-lg font-black">Novo produto</h2>
            <form action="/api/produtos/precarregar" method="post" className="mt-4 rounded-lg border border-racing-line bg-racing-soft p-3">
              <p className="text-sm font-bold">Itens padrao de moto</p>
              <p className="mt-1 text-xs text-racing-muted">Carrega oleos 10W30, 20W50, 15W40, 5W30 e relacao/corrente.</p>
              <button className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-racing-line px-3 py-2 text-sm font-black text-racing-muted hover:bg-racing-panel">
                <Boxes size={16} />
                Carregar oleos e relacao
              </button>
            </form>
            <form action="/api/produtos" method="post" encType="multipart/form-data" className="mt-4 space-y-3">
              <input name="name" required className="h-11 rounded-lg px-3" placeholder="Nome do produto" />
              <div className="grid grid-cols-2 gap-3">
                <input name="buyPrice" required type="number" step="0.01" className="h-11 rounded-lg px-3" placeholder="Compra" />
                <input name="sellPrice" required type="number" step="0.01" className="h-11 rounded-lg px-3" placeholder="Venda" />
              </div>
              <input name="quantity" required type="number" className="h-11 rounded-lg px-3" placeholder="Quantidade" />
              <BarcodeInput name="barcode" placeholder="Código de barras: bipe, digite ou use câmera" />
              <input name="qrCode" className="h-11 rounded-lg px-3" placeholder="QR Code" />
              <PresetImagePicker presets={productImagePresets} />
              <ProductImageUploader />
              <Button type="submit" className="w-full">
                <Plus size={17} />
                Salvar produto
              </Button>
            </form>
          </Card>

          <section className="space-y-4">
            <form className="relative">
              <input type="hidden" name="view" value={view} />
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-racing-muted" size={17} />
              <input name="q" defaultValue={q} className="h-11 rounded-lg pl-10 pr-3" placeholder="Buscar por ID, nome, código de barras ou QR" />
            </form>

            {view === "simples" ? (
              <DataTable
                data={products}
                getKey={(product) => product.id}
                emptyTitle="Nenhum produto cadastrado"
                columns={[
                  { header: "ID", render: (product) => <code className="text-xs font-bold">{product.id.slice(-8).toUpperCase()}</code> },
                  { header: "Produto", render: (product) => <strong>{product.name}</strong> },
                  {
                    header: "Código de barras",
                    render: (product) => (
                      <span className="inline-flex items-center gap-2">
                        <Barcode size={15} className="text-racing-muted" />
                        {product.barcode || "-"}
                      </span>
                    ),
                  },
                  { header: "Qtd", render: (product) => product.quantity },
                  { header: "Venda", render: (product) => brl(product.sellPrice) },
                  {
                    header: "Acoes",
                    className: "w-28",
                    render: (product) => <ProductStockActions product={editableProduct(product)} />,
                  },
                ]}
                mobileRender={(product) => (
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <code className="text-xs font-bold text-racing-muted">{product.id.slice(-8).toUpperCase()}</code>
                        <p className="mt-1 font-black">{product.name}</p>
                        <p className="text-sm text-racing-muted">Código: {product.barcode || "-"}</p>
                      </div>
                      <strong>{product.quantity}</strong>
                    </div>
                    <div className="mt-4">
                      <ProductStockActions product={editableProduct(product)} />
                    </div>
                  </Card>
                )}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <ProductCard product={product} />
                    <ProductStockActions product={editableProduct(product)} />
                  </div>
                ))}
                {!products.length ? <Card className="sm:col-span-2 2xl:col-span-3">Nenhum produto cadastrado.</Card> : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

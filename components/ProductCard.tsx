import Image from "next/image";
import { Package } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { brl } from "@/lib/currency";

export function ProductCard({
  product,
}: {
  product: {
    id: string;
    name: string;
    buyPrice: unknown;
    sellPrice: unknown;
    quantity: number;
    mainImageUrl: string | null;
    barcode: string | null;
    qrCode: string | null;
  };
}) {
  const lowStock = product.quantity <= 3;

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-40 bg-racing-soft">
        {product.mainImageUrl ? (
          <Image src={product.mainImageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="grid h-full place-items-center text-racing-muted">
            <Package size={32} />
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-black">{product.name}</h3>
          <Badge tone={lowStock ? "red" : "zinc"}>Qtd {product.quantity}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-racing-muted">Compra</p>
            <strong>{brl(product.buyPrice as never)}</strong>
          </div>
          <div>
            <p className="text-racing-muted">Venda</p>
            <strong>{brl(product.sellPrice as never)}</strong>
          </div>
        </div>
        <p className="truncate text-xs text-racing-muted">
          Código: {product.barcode || "-"} · QR: {product.qrCode || "-"}
        </p>
      </div>
    </Card>
  );
}

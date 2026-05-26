import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPresetImage } from "@/lib/product-presets";
import { saveImageUpload } from "@/lib/upload";
import { apiError, ApiError } from "@/lib/validations";
import { formInt, formNumber, formString } from "@/lib/utils";

async function ensureProduct(id: string, workspaceId: string) {
  const product = await prisma.product.findFirst({ where: { id, workspaceId } });
  if (!product) throw new ApiError("Produto não encontrado.", 404);
  return product;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const product = await prisma.product.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
      include: { images: true },
    });
    if (!product) throw new ApiError("Produto não encontrado.", 404);
    return NextResponse.json(product);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const current = await ensureProduct(params.id, user.workspaceId);
    const formData = await req.formData();
    const method = formString(formData, "_method").toLowerCase();

    if (method === "delete") {
      await prisma.product.delete({ where: { id: params.id } });
    } else {
      const uploads = [];
      const presetImageUrl = formString(formData, "presetImageUrl");
      const safePresetImageUrl = presetImageUrl && isValidPresetImage(presetImageUrl) ? presetImageUrl : null;
      for (const value of formData.getAll("images")) {
        if (value instanceof File && value.size > 0) {
          const uploaded = await saveImageUpload(value, "products");
          if (uploaded) uploads.push(uploaded);
        }
      }

      await prisma.product.update({
        where: { id: params.id },
        data: {
          name: formString(formData, "name"),
          buyPrice: formNumber(formData, "buyPrice"),
          sellPrice: formNumber(formData, "sellPrice"),
          quantity: Math.max(0, formInt(formData, "quantity")),
          barcode: formString(formData, "barcode") || null,
          qrCode: formString(formData, "qrCode") || null,
          mainImageUrl: uploads[0]?.url || safePresetImageUrl || current.mainImageUrl,
          images: uploads.length || safePresetImageUrl
            ? {
                create: [
                  ...(safePresetImageUrl
                    ? [{ url: safePresetImageUrl, filename: safePresetImageUrl.split("/").pop() || "preset.svg", isMain: !current.mainImageUrl }]
                    : []),
                  ...uploads.map((image, index) => ({
                    url: image.url,
                    filename: image.filename,
                    isMain: !current.mainImageUrl && index === 0,
                  })),
                ],
              }
            : undefined,
        },
      });
    }

    return NextResponse.redirect(new URL("/estoque", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/estoque", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    await ensureProduct(params.id, user.workspaceId);
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

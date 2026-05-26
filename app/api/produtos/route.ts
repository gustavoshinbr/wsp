import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPresetImage } from "@/lib/product-presets";
import { saveImageUpload } from "@/lib/upload";
import { apiError, ApiError } from "@/lib/validations";
import { formInt, formNumber, formString } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const products = await prisma.product.findMany({
      where: {
        workspaceId: user.workspaceId,
        ...(q
          ? {
              OR: [
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

    return NextResponse.json(products);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const formData = await req.formData();
    const name = formString(formData, "name");
    if (!name) throw new ApiError("Nome do produto é obrigatório.");
    const presetImageUrl = formString(formData, "presetImageUrl");
    const safePresetImageUrl = presetImageUrl && isValidPresetImage(presetImageUrl) ? presetImageUrl : null;

    const images = [];
    for (const value of formData.getAll("images")) {
      if (value instanceof File && value.size > 0) {
        const uploaded = await saveImageUpload(value, "products");
        if (uploaded) images.push(uploaded);
      }
    }

    await prisma.product.create({
      data: {
        workspaceId: user.workspaceId,
        name,
        buyPrice: formNumber(formData, "buyPrice"),
        sellPrice: formNumber(formData, "sellPrice"),
        quantity: Math.max(0, formInt(formData, "quantity")),
        barcode: formString(formData, "barcode") || null,
        qrCode: formString(formData, "qrCode") || null,
        mainImageUrl: images[0]?.url || safePresetImageUrl,
        images: {
          create: [
            ...(safePresetImageUrl && !images.length
              ? [{ url: safePresetImageUrl, filename: safePresetImageUrl.split("/").pop() || "preset.svg", isMain: true }]
              : []),
            ...images.map((image, index) => ({
              url: image.url,
              filename: image.filename,
              isMain: index === 0,
            })),
          ],
        },
      },
    });

    return NextResponse.redirect(new URL("/estoque", req.url));
  } catch (error) {
    const { message } = apiError(error);
    const url = new URL("/estoque", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

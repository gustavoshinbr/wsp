import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { saveImageUpload } from "@/lib/upload";
import { apiError, ApiError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    await requireApiUser();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new ApiError("Arquivo obrigatório.");

    const uploaded = await saveImageUpload(file, "products");
    if (!uploaded) throw new ApiError("Arquivo vazio.");

    return NextResponse.json(uploaded);
  } catch (error) {
    const { message, status } = apiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

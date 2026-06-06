import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, ApiError } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApiUser();
    const document = await prisma.fiscalDocument.findFirst({
      where: { id, workspaceId: user.workspaceId, provider: "SEBRAE", type: "NFE" },
      select: { xmlContent: true, accessKey: true, reference: true },
    });
    if (!document?.xmlContent) throw new ApiError("XML fiscal não encontrado.", 404);

    return new Response(document.xmlContent, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="NFe-${document.accessKey || document.reference}.xml"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const { message, status } = apiError(error);
    return Response.json({ error: message }, { status });
  }
}

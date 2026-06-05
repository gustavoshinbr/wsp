import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const requestedSize = Number(sizeParam);
  const size = requestedSize === 512 ? 512 : 192;
  const scale = size / 512;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0f1115",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#dc2626",
            borderRadius: 96 * scale,
            display: "flex",
            height: 250 * scale,
            justifyContent: "center",
            width: 250 * scale,
          }}
        >
          <span
            style={{
              fontSize: 92 * scale,
              fontWeight: 900,
              letterSpacing: 0,
            }}
          >
            WSP
          </span>
        </div>
        <span
          style={{
            color: "#f4f4f5",
            fontSize: 48 * scale,
            fontWeight: 900,
            letterSpacing: 0,
            marginTop: 34 * scale,
          }}
        >
          RACING
        </span>
      </div>
    ),
    {
      height: size,
      width: size,
    },
  );
}

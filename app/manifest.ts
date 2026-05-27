import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "WSP Racing",
    short_name: "WSP Racing",
    description: "Sistema de gerenciamento de oficina de motos.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0f1115",
    theme_color: "#dc2626",
    orientation: "portrait",
    icons: [
      {
        src: "/api/pwa/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

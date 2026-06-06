import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PwaInstaller } from "@/components/PwaInstall";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  applicationName: "WSP Racing",
  title: "WSP Racing",
  description: "SaaS de gerenciamento de oficina de motos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WSP Racing",
  },
  icons: {
    icon: [
      { url: "/icons/wsp-app-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/wsp-app-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/wsp-app-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PwaInstaller />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import "@neondatabase/auth-ui/css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AsyncFormBridge } from "@/components/AsyncFormBridge";
import { NeonAuthProvider } from "@/components/NeonAuthProvider";
import { PwaInstaller } from "@/components/PwaInstall";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SystemDialogProvider } from "@/components/SystemDialogProvider";

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
          <NeonAuthProvider>
            <SystemDialogProvider>
              <PwaInstaller />
              <AsyncFormBridge />
              {children}
            </SystemDialogProvider>
          </NeonAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

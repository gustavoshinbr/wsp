"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { neonAuthClient } from "@/lib/neon-auth-client";

export function NeonAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider
      authClient={neonAuthClient}
      credentials={{ forgotPassword: true }}
      redirectTo="/dashboard"
    >
      {children}
    </NeonAuthUIProvider>
  );
}

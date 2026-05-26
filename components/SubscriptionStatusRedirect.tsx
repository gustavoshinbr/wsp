"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SubscriptionStatusRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled && data?.workspace?.subscriptionStatus === "ACTIVE") {
          router.replace("/dashboard");
          router.refresh();
        }
      } catch {
        // Keep the page usable if the status check fails temporarily.
      }
    }

    checkStatus();
    const interval = window.setInterval(checkStatus, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router]);

  return null;
}

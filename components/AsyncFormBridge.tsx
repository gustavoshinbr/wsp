"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSystemDialog } from "@/components/SystemDialogProvider";

function isInternalForm(form: HTMLFormElement) {
  if (form.target) return false;
  const action = new URL(form.action || window.location.href, window.location.href);
  return action.origin === window.location.origin;
}

export function AsyncFormBridge() {
  const router = useRouter();
  const { alert } = useSystemDialog();

  useEffect(() => {
    async function handleSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !isInternalForm(form)) return;
      if (event.defaultPrevented || form.dataset.nativeSubmit === "true") return;

      event.preventDefault();
      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      const action = new URL(form.action || window.location.href, window.location.href);
      const formData = event.submitter instanceof HTMLButtonElement || event.submitter instanceof HTMLInputElement
        ? new FormData(form, event.submitter)
        : new FormData(form);
      const method = (form.method || "get").toLowerCase();

      if (method === "get") {
        action.search = new URLSearchParams(
          [...formData.entries()].map(([key, value]) => [key, String(value)]),
        ).toString();
        router.replace(`${action.pathname}${action.search}${action.hash}`);
        return;
      }
      if (method !== "post") return;

      form.setAttribute("aria-busy", "true");
      if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
        submitter.disabled = true;
      }

      try {
        const response = await fetch(action, {
          method: "POST",
          body: formData,
          credentials: "same-origin",
          headers: { "X-WSP-Async": "1" },
        });
        if (!response.ok && !response.redirected) {
          const data = await response.json().catch(() => null) as { error?: string } | null;
          await alert({
            title: "Não foi possível concluir",
            message: data?.error || "Não foi possível concluir a operação.",
            tone: "danger",
          });
          return;
        }
        const destination = new URL(response.url || action, window.location.href);

        if (destination.origin !== window.location.origin) {
          window.location.assign(destination);
          return;
        }

        const nextPath = `${destination.pathname}${destination.search}${destination.hash}`;
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextPath !== currentPath) router.replace(nextPath);
        router.refresh();

        if (response.ok && !destination.searchParams.has("error") && form.dataset.resetOnSuccess !== "false") {
          form.reset();
          form.dispatchEvent(new Event("wsp:success", { bubbles: true }));
        }
      } catch {
        await alert({
          title: "Falha de conexão",
          message: "Não foi possível comunicar com o servidor. Verifique sua conexão e tente novamente.",
          tone: "danger",
        });
      } finally {
        form.removeAttribute("aria-busy");
        if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
          submitter.disabled = false;
        }
      }
    }

    document.addEventListener("submit", handleSubmit);
    return () => document.removeEventListener("submit", handleSubmit);
  }, [alert, router]);

  return null;
}

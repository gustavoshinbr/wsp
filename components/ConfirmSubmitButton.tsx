"use client";

import { useRef, type ButtonHTMLAttributes } from "react";
import { useSystemDialog } from "@/components/SystemDialogProvider";
import { cn } from "@/lib/utils";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  message: string;
};

export function ConfirmSubmitButton({
  message,
  className,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const bypassRef = useRef(false);
  const { confirm } = useSystemDialog();

  return (
    <button
      {...props}
      type="submit"
      className={cn(className)}
      onClick={async (event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (bypassRef.current) {
          bypassRef.current = false;
          return;
        }

        event.preventDefault();
        const button = event.currentTarget;
        const accepted = await confirm({
          title: "Confirmar ação",
          message,
          tone: "danger",
          confirmLabel: "Sim, continuar",
        });
        if (!accepted || !button.form) return;

        bypassRef.current = true;
        button.form.requestSubmit(button);
      }}
    />
  );
}

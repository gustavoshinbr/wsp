"use client";

import { AlertTriangle } from "lucide-react";

export function ConfirmModal({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={19} />
        <div>
          <h3 className="font-black">{title}</h3>
          <p className="mt-1 text-sm opacity-80">{description}</p>
          <div className="mt-3">{action}</div>
        </div>
      </div>
    </div>
  );
}

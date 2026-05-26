import { Inbox } from "lucide-react";
import { Card } from "@/components/Card";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="grid min-h-44 place-items-center text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-racing-soft text-racing-muted">
          <Inbox size={22} />
        </span>
        <h3 className="mt-3 font-black">{title}</h3>
        {description ? <p className="mt-1 text-sm text-racing-muted">{description}</p> : null}
      </div>
    </Card>
  );
}

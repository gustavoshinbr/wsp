import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export function DataTable<T>({
  data,
  columns,
  getKey,
  mobileRender,
  emptyTitle = "Nenhum registro encontrado",
}: {
  data: T[];
  columns: Array<{ header: string; render: (item: T) => React.ReactNode; className?: string }>;
  getKey: (item: T) => string;
  mobileRender?: (item: T) => React.ReactNode;
  emptyTitle?: string;
}) {
  if (!data.length) return <EmptyState title={emptyTitle} />;

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-racing-line bg-racing-panel shadow-sm md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-racing-soft text-left text-xs uppercase tracking-wide text-racing-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={cn("px-4 py-3 font-black", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={getKey(item)} className="border-t border-racing-line">
                {columns.map((column) => (
                  <td key={column.header} className={cn("px-4 py-3 align-top", column.className)}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">{data.map((item) => <div key={getKey(item)}>{mobileRender?.(item)}</div>)}</div>
    </>
  );
}

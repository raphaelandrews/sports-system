import { useDataGrid } from "./data-grid";
import { Button } from "@sports-system/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

interface DataGridPaginationProps {
  sizes?: number[];
  sizesLabel?: string;
  sizesDescription?: string;
  info?: string;
}

export function DataGridPagination({
  sizes = [5, 10, 25, 50, 100],
  sizesLabel = "Show",
  sizesDescription = "per page",
  info = "{from} - {to} of {count}",
}: DataGridPaginationProps) {
  const { table, recordCount } = useDataGrid();

  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = table.getState().pagination.pageIndex;
  const from = recordCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, recordCount);
  const infoText = info
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{count}", String(recordCount));

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{sizesLabel}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-8 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>{sizesDescription}</span>
      </div>
      <div className="text-sm text-muted-foreground">{infoText}</div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}

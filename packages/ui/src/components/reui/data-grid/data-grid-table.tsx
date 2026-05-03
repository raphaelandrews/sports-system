import * as React from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { useDataGrid } from "./data-grid";
import { cn } from "@sports-system/ui/lib/utils";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";

export function DataGridTable({ footerContent }: { footerContent?: React.ReactNode }) {
  const { table, tableLayout } = useDataGrid();

  return (
    <Table
      className={cn(tableLayout.width === "auto" ? "table-auto" : "table-fixed")}
    >
      {footerContent && <tfoot>{footerContent}</tfoot>}
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.getSize() }}
                className={cn(
                  tableLayout.headerBackground && "bg-muted/50",
                  tableLayout.headerBorder && "border-b"
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row, idx) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className={cn(
                tableLayout.stripped && idx % 2 === 1 && "bg-muted/30",
                tableLayout.dense && "h-8"
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              Nenhum dado disponível
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function DataGridTableRowSelect<TData>({ row }: { row: Row<TData> }) {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  );
}

export function DataGridTableRowSelectAll() {
  const { table } = useDataGrid();
  return (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all rows"
    />
  );
}

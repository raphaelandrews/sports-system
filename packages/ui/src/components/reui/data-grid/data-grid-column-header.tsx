"use client";

import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@sports-system/ui/lib/utils";

interface DataGridColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  icon?: React.ReactNode;
  visibility?: boolean;
}

export function DataGridColumnHeader<TData, TValue>({
  column,
  title,
  icon,
}: DataGridColumnHeaderProps<TData, TValue>) {
  const isSorted = column.getIsSorted();

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        column.getCanSort() && "cursor-pointer select-none"
      )}
      onClick={column.getCanSort() ? column.getToggleSortingHandler() : undefined}
      role={column.getCanSort() ? "button" : undefined}
    >
      {icon}
      <span className="font-medium">{title}</span>
      {isSorted === "asc" ? (
        <ArrowUp className="size-3" />
      ) : isSorted === "desc" ? (
        <ArrowDown className="size-3" />
      ) : column.getCanSort() ? (
        <ArrowUpDown className="size-3 text-muted-foreground" />
      ) : null}
    </div>
  );
}

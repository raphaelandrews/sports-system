"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";

export interface DataGridTableLayout {
  dense?: boolean;
  cellBorder?: boolean;
  rowBorder?: boolean;
  rowRounded?: boolean;
  stripped?: boolean;
  headerBackground?: boolean;
  headerBorder?: boolean;
  headerSticky?: boolean;
  width?: "auto" | "fixed";
  columnsVisibility?: boolean;
  columnsResizable?: boolean;
  columnsPinnable?: boolean;
  columnsMovable?: boolean;
  columnsDraggable?: boolean;
  rowsDraggable?: boolean;
  rowsPinnable?: boolean;
}

interface DataGridContextValue<TData = unknown> {
  table: Table<TData>;
  recordCount: number;
  tableLayout: DataGridTableLayout;
}

const DataGridContext = React.createContext<DataGridContextValue<unknown> | null>(null);

export function useDataGrid<TData = unknown>() {
  const ctx = React.useContext(DataGridContext);
  if (!ctx) throw new Error("useDataGrid must be used within <DataGrid>");
  return ctx as DataGridContextValue<TData>;
}

interface DataGridProps<TData = unknown> {
  table: Table<TData>;
  recordCount: number;
  tableLayout?: DataGridTableLayout;
  children: React.ReactNode;
}

export function DataGrid<TData>({
  table,
  recordCount,
  tableLayout = {},
  children,
}: DataGridProps<TData>) {
  return (
    <DataGridContext.Provider
      value={{ table: table as Table<unknown>, recordCount, tableLayout }}
    >
      {children}
    </DataGridContext.Provider>
  );
}

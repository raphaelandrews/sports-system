import type React from "react";
import { Button } from "@sports-system/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sports-system/ui/components/input-group";
import { Separator } from "@sports-system/ui/components/separator";
import { SearchIcon, XIcon } from "lucide-react";
import { Title } from "./title";

interface TableLayoutProps {
  title: string;
  countLabel: string;
  visibleCount: number;
  totalCount: number;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  headerActions?: React.ReactNode;
  filterActions?: React.ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  pageIndex: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  children: React.ReactNode;
}

export function TableLayout({
  title,
  totalCount,
  searchPlaceholder = "Buscar…",
  searchQuery,
  onSearchChange,
  headerActions,
  filterActions,
  activeFilterCount = 0,
  onClearFilters,
  pageIndex,
  pageSize,
  pageSizeOptions = [5, 10, 25, 50],
  onPageChange,
  onPageSizeChange,
  children,
}: TableLayoutProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <>
      <header className="mb-1 flex items-end justify-between gap-4">
        {headerActions ? (
          <div className="flex items-center gap-2">{headerActions}</div>
        ) : null}
      </header>

      <div className="rounded-xl border bg-card shadow-xs/5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <InputGroup className="w-64">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label="Limpar"
                  title="Limpar"
                  size="icon-xs"
                  onClick={() => onSearchChange("")}
                >
                  <XIcon className="size-3.5" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {filterActions ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-6" />
              {filterActions}
            </>
          ) : null}

          {activeFilterCount > 0 && onClearFilters ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={onClearFilters}
            >
              <XIcon className="size-3.5 mr-1" />
              Limpar filtros
            </Button>
          ) : null}

          <span className="ms-auto text-muted-foreground text-xs">
            <span className="text-foreground">
              {activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""}
            </span>{" "}
            ativo{activeFilterCount !== 1 ? "s" : ""}
          </span>
        </div>

        {children}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Exibir</span>
            <select
              className="h-8 rounded-md border bg-transparent px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(0);
              }}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span>por página</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "0"
              : `${pageIndex * pageSize + 1} - ${Math.min(
                  (pageIndex + 1) * pageSize,
                  totalCount,
                )}`}{" "}
            de {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange(Math.min(totalPages - 1, pageIndex + 1))
              }
              disabled={pageIndex >= totalPages - 1}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

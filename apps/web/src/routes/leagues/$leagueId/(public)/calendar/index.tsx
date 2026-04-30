import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@sports-system/ui/components/card";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sports-system/ui/components/input-group";
import { Label } from "@sports-system/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sports-system/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import { FunnelIcon, SearchIcon, XIcon } from "lucide-react";

import { DataGrid } from "@sports-system/ui/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@sports-system/ui/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@sports-system/ui/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@sports-system/ui/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@sports-system/ui/components/reui/data-grid/data-grid-table";

import { formatDate, formatTime } from "@/shared/lib/date";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { EventResponse, EventStatus } from "@/types/events";

export const Route = createFileRoute("/leagues/$leagueId/(public)/calendar/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(
        allEventsQueryOptions(Number(leagueId), { per_page: 100 }),
      ),
    ]),
  component: CalendarPage,
});

const statusVariant: Record<
  EventStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

const statusLabel: Record<EventStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

function CalendarPage() {
  const { leagueId } = Route.useParams();
  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const competitions = competitionsData.data;
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 100 }),
  );
  const events = eventsData.data;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "event_date", desc: false },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetitionId, setSelectedCompetitionId] =
    useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return events.filter((item) => {
      const matchesCompetition =
        selectedCompetitionId === "all" ||
        String(item.competition_id) === selectedCompetitionId;

      const matchesStatus =
        !selectedStatuses?.length ||
        selectedStatuses.includes(item.status);

      const searchLower = searchQuery.toLowerCase();
      const competition = competitions.find(
        (c) => c.id === item.competition_id,
      );
      const compName = competition
        ? `competicao ${competition.number}`
        : "";
      const matchesSearch =
        !searchQuery ||
        [
          item.event_date,
          item.start_time,
          item.venue ?? "",
          item.phase,
          item.status,
          compName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchLower);

      return matchesCompetition && matchesStatus && matchesSearch;
    });
  }, [
    events,
    selectedCompetitionId,
    selectedStatuses,
    searchQuery,
    competitions,
  ]);

  const statusCounts = useMemo(() => {
    return events.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [events]);

  const handleStatusChange = (checked: boolean, value: string) => {
    setSelectedStatuses((prev = []) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value),
    );
  };

  const columns = useMemo<ColumnDef<EventResponse>[]>(
    () => [
      {
        accessorKey: "event_date",
        id: "event_date",
        header: ({ column }) => (
          <DataGridColumnHeader title="Dia do Jogo" column={column} />
        ),
        cell: ({ row }) => formatDate(row.original.event_date),
        size: 150,
      },
      {
        accessorKey: "start_time",
        id: "start_time",
        header: ({ column }) => (
          <DataGridColumnHeader title="Horário" column={column} />
        ),
        cell: ({ row }) => formatTime(row.original.start_time),
        size: 120,
      },
      {
        accessorKey: "venue",
        id: "venue",
        header: ({ column }) => (
          <DataGridColumnHeader title="Local" column={column} />
        ),
        cell: ({ row }) => row.original.venue ?? "—",
        size: 200,
      },
      {
        accessorKey: "phase",
        id: "phase",
        header: ({ column }) => (
          <DataGridColumnHeader title="Fase" column={column} />
        ),
        size: 150,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          const status = row.original.status as EventStatus;
          return (
            <Badge variant={statusVariant[status]}>
              {statusLabel[status]}
            </Badge>
          );
        },
        size: 130,
      },
      {
        accessorKey: "competition_id",
        id: "competition_id",
        header: ({ column }) => (
          <DataGridColumnHeader title="Competição" column={column} />
        ),
        cell: ({ row }) => {
          const comp = competitions.find(
            (c) => c.id === row.original.competition_id,
          );
          return comp
            ? `Competição ${comp.number}`
            : `ID ${row.original.competition_id}`;
        },
        size: 150,
      },
    ],
    [competitions],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil(
      (filteredData?.length || 0) / pagination.pageSize,
    ),
    getRowId: (row: EventResponse) => String(row.id),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Calendário</h1>

      <DataGrid
        table={table}
        recordCount={filteredData.length}
        tableLayout={{}}
      >
        <Card className="w-full gap-3 py-0">
          <CardHeader className="flex items-center justify-between px-3.5 py-2">
            <div className="flex items-center gap-2.5">
              <InputGroup className="w-48">
                <InputGroupAddon align="inline-start">
                  <SearchIcon className="size-4" />
                </InputGroupAddon>

                <InputGroupInput
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery.length > 0 && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="Limpar"
                      title="Limpar"
                      size="icon-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      <XIcon className="size-3.5" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              <Select
                value={selectedCompetitionId}
                onValueChange={(value) => {
                  setSelectedCompetitionId(value ?? "all");
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todas as competições" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todas as competições
                  </SelectItem>
                  {competitions.map((competition) => (
                    <SelectItem
                      key={competition.id}
                      value={String(competition.id)}
                    >
                      Competição {competition.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" size="sm">
                      <FunnelIcon className="size-4" />
                      Status
                      {selectedStatuses.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedStatuses.length}
                        </Badge>
                      )}
                    </Button>
                  }
                />
                <PopoverContent className="w-44" align="start">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">
                      Filtros
                    </div>
                    <div className="space-y-3">
                      {Object.keys(statusCounts).map((status) => (
                        <div
                          key={status}
                          className="flex items-center gap-2.5"
                        >
                          <Checkbox
                            id={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) =>
                              handleStatusChange(checked === true, status)
                            }
                          />
                          <Label
                            htmlFor={status}
                            className="flex grow items-center justify-between gap-1.5 font-normal"
                          >
                            {statusLabel[status as EventStatus]}
                            <span className="text-muted-foreground">
                              {statusCounts[status]}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="border-y px-0">
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </CardContent>
          <CardFooter className="px-3.5 py-2">
            <DataGridPagination
              sizesLabel="Exibir"
              sizesDescription="por página"
              info="{from} - {to} de {count}"
            />
          </CardFooter>
        </Card>
      </DataGrid>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import { Label } from "@sports-system/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sports-system/ui/components/popover";
import { Separator } from "@sports-system/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import {
  CircleIcon,
  CircleDotIcon,
  CircleDashedIcon,
  CheckIcon,
  TrophyIcon,
  FunnelIcon,
} from "lucide-react";

import { formatDate, formatTime } from "@/shared/lib/date";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { EventStatus } from "@/types/events";
import { TableLayout } from "@/shared/components/ui/table-layout";

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

const STATUS_META: Record<
  EventStatus,
  { label: string; icon: typeof CheckIcon; cls: string }
> = {
  SCHEDULED: { label: "Agendado", icon: CircleIcon, cls: "text-muted-foreground" },
  IN_PROGRESS: { label: "Em andamento", icon: CircleDotIcon, cls: "text-amber-500" },
  COMPLETED: { label: "Concluído", icon: CheckIcon, cls: "text-emerald-500" },
  CANCELLED: { label: "Cancelado", icon: CircleDashedIcon, cls: "text-destructive" },
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

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetitionIds, setSelectedCompetitionIds] = useState<
    number[]
  >([]);
  const [selectedStatuses, setSelectedStatuses] = useState<EventStatus[]>([]);

  const filteredData = useMemo(() => {
    let data = events;

    if (selectedCompetitionIds.length > 0) {
      data = data.filter((item) =>
        selectedCompetitionIds.includes(item.competition_id),
      );
    }

    if (selectedStatuses.length > 0) {
      data = data.filter((item) => selectedStatuses.includes(item.status));
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const comp = competitions.find((c) => c.id === item.competition_id);
        const haystack = [
          item.event_date,
          item.start_time,
          item.venue ?? "",
          item.phase,
          STATUS_META[item.status].label,
          comp ? `competicao ${comp.number}` : "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(lower);
      });
    }

    return data.sort(
      (a, b) =>
        new Date(a.event_date + "T" + a.start_time).getTime() -
        new Date(b.event_date + "T" + b.start_time).getTime(),
    );
  }, [events, selectedCompetitionIds, selectedStatuses, searchQuery, competitions]);

  const pagedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  const statusCounts = useMemo(() => {
    return events.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [events]);

  const competitionCounts = useMemo(() => {
    return events.reduce(
      (acc, item) => {
        acc[item.competition_id] = (acc[item.competition_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );
  }, [events]);

  const toggleCompetition = (id: number) => {
    setSelectedCompetitionIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
    setPageIndex(0);
  };

  const toggleStatus = (status: EventStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((v) => v !== status)
        : [...prev, status],
    );
    setPageIndex(0);
  };

  const activeFilterCount =
    selectedCompetitionIds.length + selectedStatuses.length;

  const handleClearFilters = () => {
    setSelectedCompetitionIds([]);
    setSelectedStatuses([]);
    setSearchQuery("");
    setPageIndex(0);
  };

  return (
    <TableLayout
      title="Calendário"
      countLabel="eventos"
      visibleCount={pagedData.length}
      totalCount={filteredData.length}
      searchPlaceholder="Buscar eventos…"
      searchQuery={searchQuery}
      onSearchChange={(value) => {
        setSearchQuery(value);
        setPageIndex(0);
      }}
      activeFilterCount={activeFilterCount}
      onClearFilters={handleClearFilters}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageChange={setPageIndex}
      onPageSizeChange={setPageSize}
      filterActions={
        <>
          <FacetButton
            label="Competição"
            icon={<TrophyIcon className="size-3.5" />}
            count={selectedCompetitionIds.length}
            chips={selectedCompetitionIds.map((id) => {
              const c = competitions.find((x) => x.id === id);
              return c ? `Comp. ${c.number}` : String(id);
            })}
          >
            <div className="p-2">
              <div className="relative">
                <input
                  placeholder="Filtrar…"
                  className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24"
                />
              </div>
            </div>
            <Separator />
            <div className="flex flex-col p-1">
              {competitions.map((comp) => (
                <Label
                  key={comp.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedCompetitionIds.includes(comp.id)}
                    onCheckedChange={() => toggleCompetition(comp.id)}
                  />
                  <span className="flex-1">Competição {comp.number}</span>
                  <span className="text-muted-foreground text-xs">
                    {competitionCounts[comp.id] ?? 0}
                  </span>
                </Label>
              ))}
            </div>
          </FacetButton>

          <FacetButton
            label="Status"
            icon={<FunnelIcon className="size-3.5" />}
            count={selectedStatuses.length}
            chips={selectedStatuses.map((s) => STATUS_META[s].label)}
          >
            <div className="flex flex-col p-1">
              {(
                ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as EventStatus[]
              ).map((status) => {
                const m = STATUS_META[status];
                const Icon = m.icon;
                return (
                  <Label
                    key={status}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <Icon className={"size-3.5 " + m.cls} />
                    <span className="flex-1">{m.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {statusCounts[status] ?? 0}
                    </span>
                  </Label>
                );
              })}
            </div>
          </FacetButton>
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="ps-4 w-28">Data</TableHead>
            <TableHead className="w-24">Horário</TableHead>
            <TableHead>Local</TableHead>
            <TableHead className="w-32">Fase</TableHead>
            <TableHead className="w-36">Status</TableHead>
            <TableHead className="pe-4 w-40">Competição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedData.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhum evento encontrado.
              </TableCell>
            </TableRow>
          )}
          {pagedData.map((event) => {
            const m = STATUS_META[event.status];
            const comp = competitions.find(
              (c) => c.id === event.competition_id,
            );
            return (
              <TableRow key={event.id}>
                <TableCell className="ps-4">
                  <span className="inline-flex items-center gap-2 font-mono text-muted-foreground text-xs">
                    {formatDate(event.event_date)}
                  </span>
                </TableCell>
                <TableCell>{formatTime(event.start_time)}</TableCell>
                <TableCell>
                  <span className="truncate font-medium">
                    {event.venue ?? "—"}
                  </span>
                </TableCell>
                <TableCell>{event.phase}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      "font-mono text-[10px] " +
                      (event.status === "SCHEDULED"
                        ? "border-muted-foreground/30 text-muted-foreground"
                        : event.status === "IN_PROGRESS"
                          ? "border-amber-500/30 text-amber-700 dark:text-amber-400"
                          : event.status === "COMPLETED"
                            ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                            : "border-destructive/30 text-destructive")
                    }
                  >
                    {m.label}
                  </Badge>
                </TableCell>
                <TableCell className="pe-4">
                  {comp
                    ? `Competição ${comp.number}`
                    : `ID ${event.competition_id}`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableLayout>
  );
}

function FacetButton({
  label,
  icon,
  count,
  chips,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  chips?: string[];
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={
              count && count > 0
                ? "border-foreground/20 bg-foreground/5"
                : "border-dashed"
            }
          >
            {icon}
            {label}
            {count && count > 0 ? (
              <>
                <Separator orientation="vertical" className="mx-1 h-3" />
                {chips && chips.length <= 2 ? (
                  chips.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      {c}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px]"
                  >
                    {count}
                  </Badge>
                )}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent className="w-60 p-0" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarPlus2, Sparkles, Waves, SearchIcon, XIcon, FunnelIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@sports-system/ui/components/badge";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sports-system/ui/components/input-group";
import { Label } from "@sports-system/ui/components/label";
import { Separator } from "@sports-system/ui/components/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";

import { client, unwrap, ApiError } from "@/shared/lib/api";
import { formatDate, formatTime } from "@/shared/lib/date";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { queryKeys } from "@/features/keys";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { EventStatus } from "@/types/events";
import { FacetButton, orderCompetitions, StatCard, useWeekSelection } from "./components";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/calendar/")({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(competitionListQueryOptions(Number(leagueId)));
  },
  component: CalendarPage,
});

const statusLabel: Record<EventStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
};

const phaseLabel: Record<string, string> = {
  GROUPS: "Grupos",
  QUARTER: "Quartas",
  SEMI: "Semis",
  FINAL: "Final",
  BRONZE: "Bronze",
};

function CalendarPage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const isAdmin = session?.role === "ADMIN";
  const queryClient = useQueryClient();
  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const competitions = orderCompetitions(competitionsData.data);
  const defaultCompetitionId = competitions[0]?.id;
  const [selectedCompetitionId, setSelectedCompetitionId] = useWeekSelection(defaultCompetitionId);

  const eventsQuery = useQuery({
    ...allEventsQueryOptions(
      Number(leagueId),
      selectedCompetitionId
        ? { per_page: 100, competition_id: selectedCompetitionId }
        : { per_page: 100 },
    ),
    enabled: selectedCompetitionId != null,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompetitionId) {
        throw new Error("Selecione uma competicao antes de gerar.");
      }
      return unwrap(
        client.POST("/leagues/{league_id}/events/ai-generate", {
          params: {
            path: { league_id: Number(leagueId) },
            query: { competition_id: selectedCompetitionId },
          },
        }),
      );
    },
    onSuccess: async () => {
      if (!selectedCompetitionId) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all(Number(leagueId)) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.byCompetition(Number(leagueId), selectedCompetitionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.competitions.detail(Number(leagueId), selectedCompetitionId),
        }),
      ]);
      toast.success("Calendario gerado com IA.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao gerar calendario.");
    },
  });

  const events = eventsQuery.data?.data ?? [];
  const activeCompetition =
    competitions.find((competition) => competition.id === selectedCompetitionId) ?? null;

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<EventStatus[]>([]);

  const filteredData = useMemo(() => {
    let data = [...events];

    if (selectedStatuses.length > 0) {
      data = data.filter((item) => selectedStatuses.includes(item.status));
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const haystack = [
          item.event_date,
          item.start_time,
          item.venue ?? "",
          item.phase,
          statusLabel[item.status],
          String(item.modality_id),
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
  }, [events, selectedStatuses, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
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

  const toggleStatus = (status: EventStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((v) => v !== status)
        : [...prev, status],
    );
    setPageIndex(0);
  };

  const activeFilterCount = selectedStatuses.length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_38%),linear-gradient(165deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.2))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Calendário</Badge>
              {activeCompetition ? (
                <Badge variant="secondary">Competição {activeCompetition.number}</Badge>
              ) : null}
            </div>
            <CardTitle className="text-2xl">Calendário de eventos</CardTitle>
            <CardDescription className="max-w-2xl">
              Acompanhe os eventos agendados por competição e fase.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Competição ativa"
              value={activeCompetition ? `#${activeCompetition.number}` : "Sem competicao"}
            />
            <StatCard label="Eventos visiveis" value={String(events.length)} />
            <StatCard
              label="Periodo"
              value={
                activeCompetition
                  ? `${formatDate(activeCompetition.start_date)} - ${formatDate(activeCompetition.end_date)}`
                  : "—"
              }
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Controles</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Competição, criacao manual e IA."
                : "Selecione a competicao para visualizar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={selectedCompetitionId ? String(selectedCompetitionId) : undefined}
              onValueChange={(value) => setSelectedCompetitionId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a competicao" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((competition) => (
                  <SelectItem key={competition.id} value={String(competition.id)}>
                    Competição {competition.number} · {competition.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin ? (
              <>
                <Link
                  to="/leagues/$leagueId/dashboard/calendar/events/new"
                  params={{ leagueId }}
                  className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
                >
                  <CalendarPlus2 className="mr-2 size-4" />
                  Criar evento
                </Link>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={generateMutation.isPending || !selectedCompetitionId}
                  onClick={() => generateMutation.mutate()}
                >
                  <Sparkles className="mr-2 size-4" />
                  {generateMutation.isPending ? "Gerando..." : "Gerar Calendario com IA"}
                </Button>
              </>
            ) : null}

            {activeCompetition ? (
              <Link
                to="/leagues/$leagueId/calendar/$competitionId"
                params={{ leagueId, competitionId: String(activeCompetition.id) }}
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
              >
                <Waves className="mr-2 size-4" />
                Ver calendario publico
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <div className="min-h-svh">
        <div className="mx-auto max-w-6xl">
          <header className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">Grade da semana</h1>
              <p className="text-muted-foreground text-sm">
                {pagedData.length} visíveis de {filteredData.length} eventos
              </p>
            </div>
          </header>

          <div className="rounded-xl border bg-card shadow-xs/5">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 border-b p-3">
              <InputGroup className="w-64">
                <InputGroupAddon align="inline-start">
                  <SearchIcon className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Buscar eventos…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPageIndex(0);
                  }}
                />
                {searchQuery.length > 0 && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="Limpar"
                      title="Limpar"
                      size="icon-xs"
                      onClick={() => {
                        setSearchQuery("");
                        setPageIndex(0);
                      }}
                    >
                      <XIcon className="size-3.5" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <FacetButton
                label="Status"
                icon={<FunnelIcon className="size-3.5" />}
                count={selectedStatuses.length}
                chips={selectedStatuses.map((s) => statusLabel[s])}
              >
                <div className="flex flex-col p-1">
                  {(
                    ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as EventStatus[]
                  ).map((status) => {
                    return (
                      <Label
                        key={status}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <span className="flex-1">{statusLabel[status]}</span>
                        <span className="text-muted-foreground text-xs">
                          {statusCounts[status] ?? 0}
                        </span>
                      </Label>
                    );
                  })}
                </div>
              </FacetButton>

              {activeFilterCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => {
                    setSelectedStatuses([]);
                    setSearchQuery("");
                    setPageIndex(0);
                  }}
                >
                  <XIcon className="size-3.5 mr-1" />
                  Limpar filtros
                </Button>
              )}

              <span className="ms-auto text-muted-foreground text-xs">
                <span className="text-foreground">
                  {activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""}
                </span>{" "}
                ativo{activeFilterCount !== 1 ? "s" : ""}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4 w-28">Data</TableHead>
                  <TableHead className="w-24">Horário</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="w-32">Fase</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-24">Modalidade</TableHead>
                  {isAdmin ? <TableHead className="pe-4 w-28 text-right">Ações</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 7 : 6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum evento encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {pagedData.map((event) => {
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="ps-4">
                        <span className="font-mono text-muted-foreground text-xs">
                          {formatDate(event.event_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] tabular-nums">
                          {formatTime(event.start_time)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="truncate font-medium">
                          {event.venue ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {phaseLabel[event.phase] ?? event.phase}
                        </Badge>
                      </TableCell>
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
                          {statusLabel[event.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs">
                          #{event.modality_id}
                        </span>
                      </TableCell>
                      {isAdmin ? (
                        <TableCell className="pe-4 text-right">
                          <Link
                            to="/leagues/$leagueId/dashboard/calendar/events/new"
                            params={{ leagueId }}
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                          >
                            Duplicar base
                          </Link>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Exibir</span>
                <select
                  className="h-8 rounded-md border bg-transparent px-2 text-sm"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageIndex(0);
                  }}
                >
                  {[5, 10, 25, 50].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span>por página</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredData.length === 0
                  ? "0"
                  : `${pageIndex * pageSize + 1} - ${Math.min(
                      (pageIndex + 1) * pageSize,
                      filteredData.length,
                    )}`}{" "}
                de {filteredData.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={pageIndex >= totalPages - 1}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



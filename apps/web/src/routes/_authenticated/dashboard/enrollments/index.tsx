import { useMutation, useQueryClient, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Check, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@sports-system/ui/components/badge";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Input } from "@sports-system/ui/components/input";
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

import { EnrollmentStatusBadge } from "@/components/enrollments/enrollment-status-badge";
import { findManagedDelegation } from "@/lib/chief-delegation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/date";
import { athleteListQueryOptions } from "@/queries/athletes";
import { delegationListQueryOptions } from "@/queries/delegations";
import { enrollmentListQueryOptions } from "@/queries/enrollments";
import { allEventsQueryOptions } from "@/queries/events";
import { queryKeys } from "@/queries/keys";
import { sportDetailQueryOptions, sportListQueryOptions } from "@/queries/sports";
import { weekListQueryOptions } from "@/queries/weeks";
import type { EnrollmentReview, EnrollmentStatus, EnrollmentResponse } from "@/types/enrollments";
import type { WeekResponse } from "@/types/weeks";

const enrollmentsSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).catch("ALL").optional(),
  week: z.string().catch("ALL").optional(),
  sort: z.enum(["athlete", "status", "week"]).catch("week").optional(),
  dir: z.enum(["asc", "desc"]).catch("desc").optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard/enrollments/")({
  ssr: false,
  validateSearch: enrollmentsSearchSchema,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(enrollmentListQueryOptions())
    void queryClient.prefetchQuery(athleteListQueryOptions({ per_page: 500 }))
    void queryClient.prefetchQuery(delegationListQueryOptions())
    void queryClient.prefetchQuery(allEventsQueryOptions({ per_page: 200 }))
    void queryClient.prefetchQuery(weekListQueryOptions())
    void queryClient.prefetchQuery(sportListQueryOptions())
  },
  component: EnrollmentsPage,
});

function EnrollmentsPage() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate({ from: Route.fullPath });
  const searchState = Route.useSearch();
  const queryClient = useQueryClient();
  const isAdmin = session.role === "ADMIN";
  const statusFilter = (searchState.status ?? "ALL") as EnrollmentStatus | "ALL";
  const weekFilter = searchState.week ?? "ALL";
  const search = searchState.q?.trim() ?? "";
  const sort = searchState.sort ?? "week";
  const dir = searchState.dir ?? "desc";

  const { data: enrollmentsData } = useSuspenseQuery(enrollmentListQueryOptions({ per_page: 200 }));
  const { data: athletesData } = useSuspenseQuery(athleteListQueryOptions({ per_page: 500 }));
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions());
  const { data: eventsData } = useSuspenseQuery(allEventsQueryOptions({ per_page: 200 }));
  const { data: weeksData } = useSuspenseQuery(weekListQueryOptions());
  const { data: sportsData } = useSuspenseQuery(sportListQueryOptions());
  const sportDetails = useSuspenseQueries({
    queries: sportsData.data.map((sport) => sportDetailQueryOptions(sport.id)),
  });

  const chiefDelegation = findManagedDelegation(delegationsData.data, session);
  const athleteById = useMemo(
    () => new Map(athletesData.data.map((athlete) => [athlete.id, athlete])),
    [athletesData.data],
  );
  const delegationById = useMemo(
    () => new Map(delegationsData.data.map((delegation) => [delegation.id, delegation])),
    [delegationsData.data],
  );
  const eventById = useMemo(
    () => new Map(eventsData.data.map((event) => [event.id, event])),
    [eventsData.data],
  );
  const weekById = useMemo(
    () => new Map(weeksData.data.map((week) => [week.id, week])),
    [weeksData.data],
  );
  const modalityById = useMemo(
    () =>
      new Map(
        sportDetails.flatMap((detail) =>
          detail.data.modalities.map((modality) => [modality.id, modality] as const),
        ),
      ),
    [sportDetails],
  );
  const sportByModalityId = useMemo(
    () =>
      new Map(
        sportDetails.flatMap((detail) =>
          detail.data.modalities.map((modality) => [modality.id, detail.data] as const),
        ),
      ),
    [sportDetails],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...enrollmentsData.data]
      .filter((enrollment) => {
        const event = eventById.get(enrollment.event_id);
        const athlete = athleteById.get(enrollment.athlete_id);
        const delegation = delegationById.get(enrollment.delegation_id);
        const modality = event ? modalityById.get(event.modality_id) : null;
        const sport = event ? sportByModalityId.get(event.modality_id) : null;
        const week = event ? weekById.get(event.week_id) : null;

        const matchesStatus = statusFilter === "ALL" || enrollment.status === statusFilter;
        const matchesWeek = weekFilter === "ALL" || event?.week_id === Number(weekFilter);
        const matchesSearch =
          !normalizedSearch ||
          athlete?.name.toLowerCase().includes(normalizedSearch) ||
          delegation?.name.toLowerCase().includes(normalizedSearch) ||
          modality?.name.toLowerCase().includes(normalizedSearch) ||
          sport?.name.toLowerCase().includes(normalizedSearch) ||
          week?.week_number.toString().includes(normalizedSearch) ||
          enrollment.validation_message?.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesWeek && Boolean(matchesSearch);
      })
      .sort((left, right) => {
        const leftEvent = eventById.get(left.event_id);
        const rightEvent = eventById.get(right.event_id);
        const leftAthlete = athleteById.get(left.athlete_id);
        const rightAthlete = athleteById.get(right.athlete_id);
        const leftWeek = leftEvent ? weekById.get(leftEvent.week_id) : null;
        const rightWeek = rightEvent ? weekById.get(rightEvent.week_id) : null;
        const multiplier = dir === "asc" ? 1 : -1;

        if (sort === "athlete") {
          return (leftAthlete?.name ?? "").localeCompare(rightAthlete?.name ?? "") * multiplier;
        }
        if (sort === "status") {
          return left.status.localeCompare(right.status) * multiplier;
        }
        return ((leftWeek?.week_number ?? 0) - (rightWeek?.week_number ?? 0)) * multiplier;
      });
  }, [
    athleteById,
    delegationById,
    dir,
    enrollmentsData.data,
    eventById,
    modalityById,
    search,
    sort,
    sportByModalityId,
    statusFilter,
    weekById,
    weekFilter,
  ]);

  const stats = useMemo(() => {
    const source = enrollmentsData.data;
    return {
      total: source.length,
      pending: source.filter((item) => item.status === "PENDING").length,
      approved: source.filter((item) => item.status === "APPROVED").length,
      rejected: source.filter((item) => item.status === "REJECTED").length,
    };
  }, [enrollmentsData.data]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
  };

  const reviewMutation = useMutation({
    mutationFn: async ({
      enrollmentId,
      payload,
    }: {
      enrollmentId: number;
      payload: EnrollmentReview;
    }) =>
      apiFetch<EnrollmentResponse>(`/enrollments/${enrollmentId}/review`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async (_, variables) => {
      await refresh();
      toast.success(
        variables.payload.status === "APPROVED"
          ? "Inscrição aprovada."
          : "Inscrição rejeitada.",
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao revisar inscrição.");
    },
  });

  const aiMutation = useMutation({
    mutationFn: async () =>
      apiFetch<EnrollmentResponse[]>("/enrollments/ai-generate", {
        method: "POST",
      }),
    onSuccess: async (created) => {
      await refresh();
      toast.success(
        created.length === 1
          ? "1 inscrição criada com IA."
          : `${created.length} inscrições criadas com IA.`,
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao gerar inscrições.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (enrollmentId: number) =>
      apiFetch<void>(`/enrollments/${enrollmentId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await refresh();
      toast.success("Inscrição cancelada.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao cancelar inscrição.");
    },
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_44%),linear-gradient(165deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Fase 11</Badge>
              {isAdmin ? <Badge variant="secondary">Admin</Badge> : <Badge variant="secondary">Chefe</Badge>}
            </div>
            <CardTitle className="text-2xl">Painel de inscrições</CardTitle>
            <CardDescription className="max-w-2xl">
              {isAdmin
                ? "Visão global para revisar status, acompanhar gargalos e acionar geração automática."
                : "Acompanhe sua delegação, estado das revisões e bloqueios operacionais da semana."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <StatTile label="Total" value={String(stats.total)} />
            <StatTile label="Pendentes" value={String(stats.pending)} />
            <StatTile label="Aprovadas" value={String(stats.approved)} />
            <StatTile label="Rejeitadas" value={String(stats.rejected)} />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Use IA para preencher base e revise rapidamente o que entrou."
                : "Cadastre inscrições novas e acompanhe o ciclo da sua delegação."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isAdmin ? (
              <Link
                to="/dashboard/enrollments/new"
                className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
              >
                <Plus className="mr-2 size-4" />
                Nova inscrição
              </Link>
            ) : null}

            {isAdmin ? (
              <Button
                type="button"
                className="w-full justify-start"
                variant="secondary"
                disabled={aiMutation.isPending}
                onClick={() => aiMutation.mutate()}
              >
                <Bot className="mr-2 size-4" />
                {aiMutation.isPending ? "Gerando..." : "Gerar Inscrições com IA"}
              </Button>
            ) : null}

            {chiefDelegation ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Delegação gerenciada: <span className="font-medium text-foreground">{chiefDelegation.name}</span>.
              </div>
            ) : !isAdmin ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Nenhuma delegação gerenciada. Solicite aprovação antes de inscrever atletas.
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Filtro global habilitado para todas as delegações.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Lista operacional</CardTitle>
              <CardDescription>
                Filtros por semana, status e busca textual sobre atleta, delegação e modalidade.
              </CardDescription>
            </div>
            {!isAdmin ? (
              <Link
                to="/dashboard/enrollments/new"
                className={buttonVariants({ variant: "outline" })}
              >
                <Plus className="mr-2 size-4" />
                Inscrever atleta
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar atleta, delegação ou modalidade"
                value={search}
                onChange={(event) =>
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      q: event.target.value || undefined,
                    }),
                  })
                }
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    status: (value as EnrollmentStatus | "ALL" | null) ?? "ALL",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="APPROVED">Aprovadas</SelectItem>
                <SelectItem value="REJECTED">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={weekFilter}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    week: value ?? "ALL",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as semanas</SelectItem>
                {weeksData.data.map((week) => (
                  <SelectItem key={week.id} value={String(week.id)}>
                    Semana {week.week_number} · {week.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: value as "athlete" | "status" | "week",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Ordenar por semana</SelectItem>
                <SelectItem value="athlete">Ordenar por atleta</SelectItem>
                <SelectItem value="status">Ordenar por status</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={dir}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    dir: value as "asc" | "desc",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascendente</SelectItem>
                <SelectItem value="desc">Descendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              Nenhuma inscrição encontrada com os filtros atuais.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Delegação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((enrollment) => {
                  const event = eventById.get(enrollment.event_id);
                  const week = event ? weekById.get(event.week_id) : null;
                  const modality = event ? modalityById.get(event.modality_id) : null;
                  const sport = event ? sportByModalityId.get(event.modality_id) : null;
                  const athlete = athleteById.get(enrollment.athlete_id);
                  const delegation = delegationById.get(enrollment.delegation_id);
                  const weekLocked = week ? isEnrollmentLocked(week) : false;

                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="font-medium">{athlete?.name ?? `Atleta #${enrollment.athlete_id}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {athlete?.code ?? `#${enrollment.athlete_id}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {modality?.name ?? `Evento #${enrollment.event_id}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sport?.name ?? "Esporte"} · {event ? `${formatDate(event.event_date)} · ${formatTime(event.start_time)}` : "Sem agenda"}
                        </div>
                        {week ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Semana {week.week_number} · {week.status}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {delegation ? delegation.name : `Delegação #${enrollment.delegation_id}`}
                      </TableCell>
                      <TableCell>
                        <EnrollmentStatusBadge status={enrollment.status} />
                      </TableCell>
                      <TableCell>
                        {enrollment.validation_message ? (
                          <span className="text-sm text-muted-foreground">
                            {enrollment.validation_message}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isAdmin && enrollment.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reviewMutation.isPending}
                                onClick={() =>
                                  reviewMutation.mutate({
                                    enrollmentId: enrollment.id,
                                    payload: {
                                      status: "APPROVED",
                                      validation_message: "Aprovada manualmente pelo admin.",
                                    },
                                  })
                                }
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={reviewMutation.isPending}
                                onClick={() =>
                                  reviewMutation.mutate({
                                    enrollmentId: enrollment.id,
                                    payload: {
                                      status: "REJECTED",
                                      validation_message: "Rejeitada em revisão administrativa.",
                                    },
                                  })
                                }
                              >
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : null}

                          {!isAdmin ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={cancelMutation.isPending || weekLocked}
                              onClick={() => cancelMutation.mutate(enrollment.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!isAdmin ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Cancelamento fica indisponível quando a semana está travada, ativa ou concluída.
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Admin revisa inscrições pendentes e pode disparar geração automática para ambiente demo.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function isEnrollmentLocked(week: WeekResponse) {
  return week.status === "LOCKED" || week.status === "ACTIVE" || week.status === "COMPLETED";
}

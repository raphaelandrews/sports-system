import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Check, Plus, Trash2, X } from "lucide-react";
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

import { EnrollmentStatusBadge } from "@/features/enrollments/components/enrollment-status-badge";
import { findManagedDelegation } from "@/shared/lib/chief-delegation";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { formatDate, formatTime } from "@/shared/lib/date";
import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { enrollmentListQueryOptions } from "@/features/enrollments/api/queries";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { queryKeys } from "@/features/keys";
import { sportDetailQueryOptions, sportListQueryOptions } from "@/features/sports/api/queries";
import { TableLayout } from "@/shared/components/ui/table-layout";
import type { CompetitionResponse } from "@/types/competitions";
import type { EnrollmentReview, EnrollmentStatus } from "@/types/enrollments";
import * as m from "@/paraglide/messages";

const enrollmentsSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).catch("ALL").optional(),
  week: z.string().catch("ALL").optional(),
  sort: z.enum(["athlete", "status", "week"]).catch("week").optional(),
  dir: z.enum(["asc", "desc"]).catch("desc").optional(),
});

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/enrollments/")({
  ssr: false,
  validateSearch: enrollmentsSearchSchema,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(enrollmentListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(athleteListQueryOptions(Number(leagueId), { per_page: 500 }));
    void queryClient.prefetchQuery(delegationListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(allEventsQueryOptions(Number(leagueId), { per_page: 200 }));
    void queryClient.prefetchQuery(competitionListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(sportListQueryOptions());
  },
  component: EnrollmentsPage,
});

function EnrollmentsPage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const searchState = Route.useSearch();
  const queryClient = useQueryClient();
  const isAdmin = session?.role === "ADMIN";
  const statusFilter = (searchState.status ?? "ALL") as EnrollmentStatus | "ALL";
  const weekFilter = searchState.week ?? "ALL";
  const search = searchState.q?.trim() ?? "";
  const sort = searchState.sort ?? "week";
  const dir = searchState.dir ?? "desc";

  const { data: enrollmentsData } = useSuspenseQuery(
    enrollmentListQueryOptions(Number(leagueId), { per_page: 200 }),
  );
  const { data: athletesData } = useSuspenseQuery(
    athleteListQueryOptions(Number(leagueId), { per_page: 500 }),
  );
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 200 }),
  );
  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const { data: sportsData } = useSuspenseQuery(sportListQueryOptions());
  const sportDetails = useSuspenseQueries({
    queries: sportsData.data.map((sport) => sportDetailQueryOptions(sport.id)),
  });

  const chiefDelegation = session ? findManagedDelegation(delegationsData.data, session) : null;
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
  const competitionById = useMemo(
    () => new Map(competitionsData.data.map((competition) => [competition.id, competition])),
    [competitionsData.data],
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

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...enrollmentsData.data]
      .filter((enrollment) => {
        const event = eventById.get(enrollment.event_id);
        const athlete = athleteById.get(enrollment.athlete_id);
        const delegation = delegationById.get(enrollment.delegation_id);
        const modality = event ? modalityById.get(event.modality_id) : null;
        const sport = event ? sportByModalityId.get(event.modality_id) : null;
        const competition = event ? competitionById.get(event.competition_id) : null;

        const matchesStatus = statusFilter === "ALL" || enrollment.status === statusFilter;
        const matchesWeek = weekFilter === "ALL" || event?.competition_id === Number(weekFilter);
        const matchesSearch =
          !normalizedSearch ||
          athlete?.name.toLowerCase().includes(normalizedSearch) ||
          delegation?.name.toLowerCase().includes(normalizedSearch) ||
          modality?.name.toLowerCase().includes(normalizedSearch) ||
          sport?.name.toLowerCase().includes(normalizedSearch) ||
          competition?.number.toString().includes(normalizedSearch) ||
          enrollment.validation_message?.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesWeek && Boolean(matchesSearch);
      })
      .sort((left, right) => {
        const leftEvent = eventById.get(left.event_id);
        const rightEvent = eventById.get(right.event_id);
        const leftAthlete = athleteById.get(left.athlete_id);
        const rightAthlete = athleteById.get(right.athlete_id);
        const leftCompetition = leftEvent ? competitionById.get(leftEvent.competition_id) : null;
        const rightCompetition = rightEvent ? competitionById.get(rightEvent.competition_id) : null;
        const multiplier = dir === "asc" ? 1 : -1;

        if (sort === "athlete") {
          return (leftAthlete?.name ?? "").localeCompare(rightAthlete?.name ?? "") * multiplier;
        }
        if (sort === "status") {
          return left.status.localeCompare(right.status) * multiplier;
        }
        return ((leftCompetition?.number ?? 0) - (rightCompetition?.number ?? 0)) * multiplier;
      });
  }, [
    athleteById,
    competitionById,
    delegationById,
    dir,
    enrollmentsData.data,
    eventById,
    modalityById,
    search,
    sort,
    sportByModalityId,
    statusFilter,
    weekFilter,
  ]);

  const pagedData = filtered.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  const stats = useMemo(() => {
    const source = enrollmentsData.data;
    return {
      total: source.length,
      pending: source.filter((item) => item.status === "PENDING").length,
      approved: source.filter((item) => item.status === "APPROVED").length,
      rejected: source.filter((item) => item.status === "REJECTED").length,
    };
  }, [enrollmentsData.data]);

  const activeFilterCount =
    (search ? 1 : 0) +
    (statusFilter !== "ALL" ? 1 : 0) +
    (weekFilter !== "ALL" ? 1 : 0);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all(Number(leagueId)) });
  };

  const reviewMutation = useMutation({
    mutationFn: async ({
      enrollmentId,
      payload,
    }: {
      enrollmentId: number;
      payload: EnrollmentReview;
    }) =>
      unwrap(
        client.PATCH("/leagues/{league_id}/enrollments/{enrollment_id}/review", {
          params: { path: { league_id: Number(leagueId), enrollment_id: enrollmentId } },
          body: payload,
        }),
      ),
    onSuccess: async (_, variables) => {
      await refresh();
      toast.success(
        variables.payload.status === "APPROVED" ? m["common.status.approved"]() : m["common.status.rejected"](),
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["common.actions.submit"]());
    },
  });

  const aiMutation = useMutation({
    mutationFn: async () =>
      unwrap(
        client.POST("/leagues/{league_id}/enrollments/ai-generate", {
          params: { path: { league_id: Number(leagueId) } },
        }),
      ),
    onSuccess: async (created) => {
      await refresh();
      toast.success(
        created.length === 1
          ? m["common.actions.create"]()
          : `${created.length} ${m['enrollments.admin.title']()} created with AI.`,
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : `Failed to generate ${m['enrollments.admin.title']()}.`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (enrollmentId: number) =>
      unwrap(
        client.DELETE("/leagues/{league_id}/enrollments/{enrollment_id}", {
          params: { path: { league_id: Number(leagueId), enrollment_id: enrollmentId } },
        }),
      ),
    onSuccess: async () => {
      await refresh();
      toast.success(m["common.actions.cancel"]());
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["common.actions.submit"]());
    },
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_44%),linear-gradient(165deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <Badge variant="secondary">{m["roles.admin"]()}</Badge>
              ) : (
                <Badge variant="secondary">{m["roles.chief"]()}</Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{m["enrollments.admin.title"]()}</CardTitle>
            <CardDescription className="max-w-2xl">
              {isAdmin
                ? m["enrollments.admin.card.actions.title"]()
                : m["chief.shell.delegationDesc"]()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <StatTile label={m["enrollments.admin.stat.total"]()} value={String(stats.total)} />
            <StatTile label={m["enrollments.admin.stat.pending"]()} value={String(stats.pending)} />
            <StatTile label={m["enrollments.admin.stat.approved"]()} value={String(stats.approved)} />
            <StatTile label={m["enrollments.admin.stat.rejected"]()} value={String(stats.rejected)} />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["enrollments.admin.card.actions.title"]()}</CardTitle>
            <CardDescription>
              {isAdmin
                ? m["enrollments.admin.card.actions.title"]()
                : m["chief.shell.delegationDesc"]()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isAdmin ? (
              <Link
                to="/leagues/$leagueId/dashboard/enrollments/new"
                params={{ leagueId }}
                className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
              >
                <Plus className="mr-2 size-4" />
                {m["enrollment.form.title"]()}
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
                {aiMutation.isPending ? m["common.actions.submit"]() : m["common.actions.submit"]()}
              </Button>
            ) : null}

            {chiefDelegation ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                {m["chief.shell.delegationDesc"]() }{" "}
                <span className="font-medium text-foreground">{chiefDelegation.name}</span>.
              </div>
            ) : !isAdmin ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {m["enrollments.admin.noDelegation"]() }
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                {m["chief.shell.delegationDesc"]() }
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <header className="mb-1 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{m["enrollments.admin.table.actions"]()}</h1>
          <p className="text-muted-foreground text-sm">
            {pagedData.length} {m["common.table.paginationOf"]() } {filtered.length} {m["enrollments.admin.title"]() }
          </p>
        </div>
        {!isAdmin ? (
          <Link
            to="/leagues/$leagueId/dashboard/enrollments/new"
            params={{ leagueId }}
            className={buttonVariants({ variant: "outline" })}
          >
            <Plus className="mr-2 size-4" />
            {m["athlete.form.title.create"]() }
          </Link>
        ) : null}
      </header>

      <TableLayout
        searchPlaceholder={m["common.table.searchPlaceholder"]() }
        searchQuery={search}
        onSearchChange={(value) =>
          void navigate({
            search: (prev) => ({ ...prev, q: value || undefined }),
          })
        }
        activeFilterCount={activeFilterCount}
        onClearFilters={() =>
          void navigate({
            search: (prev) => ({
              ...prev,
              q: undefined,
              status: "ALL",
              week: "ALL",
            }),
          })
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        totalCount={filtered.length}
        visibleCount={pagedData.length}
        filterActions={
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />
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
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{m["enrollments.admin.filter.allStatus"]()}</SelectItem>
                <SelectItem value="PENDING">{m["enrollments.admin.filter.pending"]()}</SelectItem>
                <SelectItem value="APPROVED">{m["enrollments.admin.filter.approved"]()}</SelectItem>
                <SelectItem value="REJECTED">{m["enrollments.admin.filter.rejected"]()}</SelectItem>
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
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{m["enrollments.admin.filter.allCompetitions"]()}</SelectItem>
                {competitionsData.data.map((competition) => (
                  <SelectItem key={competition.id} value={String(competition.id)}>
                    {m["enrollments.admin.table.event"]() } {competition.number} · {competition.status}
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
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{m["enrollments.admin.sort.competition"]()}</SelectItem>
                <SelectItem value="athlete">{m["enrollments.admin.sort.athlete"]()}</SelectItem>
                <SelectItem value="status">{m["enrollments.admin.sort.status"]()}</SelectItem>
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
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{m["enrollments.admin.sort.asc"]()}</SelectItem>
                <SelectItem value="desc">{m["enrollments.admin.sort.desc"]()}</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">{m["enrollments.admin.table.athlete"]()}</TableHead>
              <TableHead>{m["enrollments.admin.table.event"]()}</TableHead>
              <TableHead>{m["enrollments.admin.table.delegation"]()}</TableHead>
              <TableHead>{m["enrollments.admin.table.status"]()}</TableHead>
              <TableHead>{m["enrollments.admin.table.validation"]()}</TableHead>
              <TableHead className="pe-4 text-right">{m["enrollments.admin.table.actions"]()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {m["enrollments.admin.empty"]()}
                </TableCell>
              </TableRow>
            )}
            {pagedData.map((enrollment) => {
              const event = eventById.get(enrollment.event_id);
              const competition = event ? competitionById.get(event.competition_id) : null;
              const modality = event ? modalityById.get(event.modality_id) : null;
              const sport = event ? sportByModalityId.get(event.modality_id) : null;
              const athlete = athleteById.get(enrollment.athlete_id);
              const delegation = delegationById.get(enrollment.delegation_id);
              const competitionLocked = competition ? isEnrollmentLocked(competition) : false;

              return (
                <TableRow key={enrollment.id}>
                  <TableCell className="ps-4">
                    <div className="font-medium">
                      {athlete?.name ?? `m["enrollments.admin.table.athlete"]() #${enrollment.athlete_id}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {athlete?.code ?? `#${enrollment.athlete_id}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {modality?.name ?? `Evento #${enrollment.event_id}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sport?.name ?? m['enrollment.form.label.sport']()} ·{" "}
                      {event
                        ? `${formatDate(event.event_date)} · ${formatTime(event.start_time)}`
                        : m['calendar.public.empty']()}
                    </div>
                    {competition ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {m["enrollments.admin.table.event"]() } {competition.number} · {competition.status}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {delegation ? delegation.name : `m["delegations.public.title"]() #${enrollment.delegation_id}`}
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
                  <TableCell className="pe-4 text-right">
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
                                  validation_message: m["common.status.approved"](),
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
                                  validation_message: m["common.status.rejected"](),
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
                          disabled={cancelMutation.isPending || competitionLocked}
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
      </TableLayout>

      {!isAdmin ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
          m["chief.shell.delegationDesc"]()
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
          Admin revisa {m["enrollments.admin.title"]() } pendentes e pode disparar geração automática para ambiente
          demo.
        </div>
      )}
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

function isEnrollmentLocked(competition: CompetitionResponse) {
  return (
    competition.status === "LOCKED" ||
    competition.status === "ACTIVE" ||
    competition.status === "COMPLETED"
  );
}

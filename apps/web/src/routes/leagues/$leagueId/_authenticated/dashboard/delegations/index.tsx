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
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bot, Search, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { formatEventDate } from "@/shared/lib/date";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { myLeagueMembershipQueryOptions } from "@/features/leagues/api/queries";
import { queryKeys } from "@/features/keys";
import * as m from "@/paraglide/messages";

const PAGE_SIZE = 8;
const delegationsSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).catch("all").optional(),
  sort: z.enum(["name", "code", "created_at"]).catch("name").optional(),
  dir: z.enum(["asc", "desc"]).catch("asc").optional(),
  page: z.coerce.number().int().min(1).catch(1).optional(),
});

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/delegations/")({
  ssr: false,
  validateSearch: delegationsSearchSchema,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(delegationListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(myLeagueMembershipQueryOptions(Number(leagueId)));
  },
  component: DelegationsPage,
});

function DelegationsPage() {
  const { leagueId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const searchState = Route.useSearch();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const { data: membership } = useSuspenseQuery(myLeagueMembershipQueryOptions(Number(leagueId)));
  const isAdmin = membership?.role === "LEAGUE_ADMIN";

  const [aiCount, setAiCount] = useState("5");
  const search = searchState.q?.trim() ?? "";
  const statusFilter = searchState.status ?? "all";
  const sort = searchState.sort ?? "name";
  const dir = searchState.dir ?? "asc";
  const page = searchState.page ?? 1;

  const aiMutation = useMutation({
    mutationFn: async () =>
      unwrap(
        client.POST("/leagues/{league_id}/delegations/ai-generate", {
          params: { path: { league_id: Number(leagueId) }, query: { count: Number(aiCount) } },
        }),
      ),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.all(Number(leagueId)),
      });
      toast.success(
        created.length === 1
          ? m["common.actions.create"]()
          : `${created.length} delegações criadas com IA.`,
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["common.actions.submit"]());
    },
  });

  const aiPopulateMutation = useMutation({
    mutationFn: async () =>
      unwrap(
        client.POST("/leagues/{league_id}/delegations/ai-populate", {
          params: { path: { league_id: Number(leagueId) }, query: { count: Number(aiCount) } },
        }),
      ),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.all(Number(leagueId)),
      });
      toast.success(
        created.length === 1
          ? m["common.actions.create"]()
          : `${created.length} delegações populadas com IA baseadas nas existentes.`,
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["common.actions.submit"]());
    },
  });

  const assignChiefMutation = useMutation({
    mutationFn: async (delegationId: number) =>
      unwrap(
        client.POST("/leagues/{league_id}/delegations/{delegation_id}/assign-chief", {
          params: { path: { league_id: Number(leagueId), delegation_id: delegationId } },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.all(Number(leagueId)),
      });
      toast.success(m["roles.chief"]());
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["common.actions.submit"]());
    },
  });

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return [...data.data]
      .filter((delegation) => {
        const matchesSearch =
          !normalized ||
          delegation.name.toLowerCase().includes(normalized) ||
          delegation.code.toLowerCase().includes(normalized);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && delegation.is_active) ||
          (statusFilter === "inactive" && !delegation.is_active);

        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        const multiplier = dir === "asc" ? 1 : -1;
        if (sort === "code") {
          return left.code.localeCompare(right.code) * multiplier;
        }
        if (sort === "created_at") {
          return left.created_at.localeCompare(right.created_at) * multiplier;
        }
        return left.name.localeCompare(right.name) * multiplier;
      });
  }, [data.data, dir, search, sort, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = data.data.filter((delegation) => delegation.is_active).length;
  const withChiefCount = data.data.filter((delegation) => delegation.chief_id != null).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_46%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.28))]">
          <CardHeader className="gap-3">
            <Badge variant="outline" className="w-fit">
              {m['delegations.public.title']()}
            </Badge>
            <CardTitle className="text-2xl">
              {isAdmin ? m["delegations.public.title"]() : m["delegations.public.title"]() }
            </CardTitle>
            <CardDescription className="max-w-2xl">
              {isAdmin
                ? m["delegations.public.title"]()
                : m["delegations.public.title"]()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={ShieldCheck}
              label={m["enrollments.admin.stat.total"]() }
              value={String(data.data.length)}
              hint={m["delegations.public.title"]() }
            />
            <MetricCard
              icon={Users}
              label={m["common.status.active"]() }
              value={String(activeCount)}
              hint={m["common.status.active"]() }
            />
            <MetricCard
              icon={Bot}
              label={m["roles.chief"]() }
              value={String(withChiefCount)}
              hint={m["roles.chief"]() }
            />
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>{m["nav.admin.ai"]()}</CardTitle>
              <CardDescription>
                m["delegation.form.desc.create"]()
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Select value={aiCount} onValueChange={(value) => setAiCount(value ?? "5")}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["3", "5", "8", "10", "15"].map((value) => (
                       <SelectItem key={value} value={value}>
                         {value} {m['common.items']()}
                       </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => aiMutation.mutate()}
                  disabled={aiMutation.isPending}
                >
                  <Bot className="size-4" />
                  {aiMutation.isPending ? m['ai.generating']() : m['ai.generate']()}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => aiPopulateMutation.mutate()}
                  disabled={aiPopulateMutation.isPending}
                >
                  <Bot className="size-4" />
                  {aiPopulateMutation.isPending ? m['ai.populating']() : m['ai.populate']()}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {m['delegation.form.desc.create']()}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>{m["enrollments.admin.table.actions"]()}</CardTitle>
              <CardDescription>
                {m['delegation.form.desc.create']()}
              </CardDescription>
            </div>
            {isAdmin ? (
              <Link
                to="/leagues/$leagueId/dashboard/delegations/new"
                params={{ leagueId }}
                className={buttonVariants({ variant: "default" })}
              >
                {m["delegation.form.title.create"]() }
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={m["common.table.searchPlaceholder"]() }
                value={search}
                onChange={(event) =>
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      q: event.target.value || undefined,
                      page: 1,
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
                    status: (value as "all" | "active" | "inactive" | null) ?? "all",
                    page: 1,
                  }),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{m['common.filter.allStatuses']()}</SelectItem>
                <SelectItem value="active">{m['common.filter.onlyActive']()}</SelectItem>
                <SelectItem value="inactive">{m['common.filter.onlyInactive']()}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: value as "name" | "code" | "created_at",
                  }),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{m['common.sort.byName']()}</SelectItem>
                <SelectItem value="code">{m['common.sort.byCode']()}</SelectItem>
                <SelectItem value="created_at">{m['common.sort.byCreation']()}</SelectItem>
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
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{m['common.sort.asc']()}</SelectItem>
                <SelectItem value="desc">{m['common.sort.desc']()}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m['delegations.public.table.code']()}</TableHead>
                <TableHead>{m['delegations.public.table.name']()}</TableHead>
                <TableHead>{m['common.status.active']()}</TableHead>
                <TableHead>{m['roles.chief']()}</TableHead>
                <TableHead>{m['common.table.createdAt']()}</TableHead>
                <TableHead className="text-right">{m['competitions.public.table.actions']()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((delegation) => (
                <TableRow key={delegation.id}>
                  <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                    {delegation.code}
                  </TableCell>
                  <TableCell className="font-medium">{delegation.name}</TableCell>
                  <TableCell>
                    <Badge variant={delegation.is_active ? "secondary" : "outline"}>
                      {delegation.is_active ? m['common.status.active']() : m['common.status.inactive']()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {delegation.chief_id ? `User #${delegation.chief_id}` : m['delegation.stats.table.noChief']()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatEventDate(delegation.created_at, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-2">
                        {!delegation.chief_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => assignChiefMutation.mutate(delegation.id)}
                            disabled={assignChiefMutation.isPending}
                          >
                            {assignChiefMutation.isPending && assignChiefMutation.variables === delegation.id
                              ? m['delegation.stats.table.assigning']()
                              : m['delegation.stats.table.becomeChief']()}
                          </Button>
                        )}
                        <Link
                          to="/leagues/$leagueId/dashboard/delegations/$delegationId"
                          params={{ leagueId, delegationId: String(delegation.id) }}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto")}
                        >
                          {m['common.actions.open']()}
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {m['delegation.stats.table.emptyFiltered']()}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              {m['common.table.paginationShow']() } {paginated.length} {m['common.table.paginationOf']() } {filtered.length} {m['delegations.public.title']() }
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      page: Math.max(1, currentPage - 1),
                    }),
                  })
                }
                disabled={currentPage === 1}
              >
                {m['common.actions.previous']()}
              </Button>
              <span className="min-w-28 text-center">
                {currentPage} {m['common.table.paginationOf']() } {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      page: Math.min(totalPages, currentPage + 1),
                    }),
                  })
                }
                disabled={currentPage === totalPages}
              >
                {m['common.actions.next']()}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs uppercase tracking-[0.24em]">{label}</span>
      </div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
    </div>
  );
}

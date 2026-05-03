import { useMemo } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { buttonVariants } from "@sports-system/ui/components/button";
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
import { Bot, Search, UserPlus } from "lucide-react";

import * as m from "@/paraglide/messages";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/date";
import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { queryKeys } from "@/features/keys";

const athletesSearchSchema = z.object({
  q: z.string().optional(),
  linked: z.enum(["all", "linked", "unlinked"]).catch("all").optional(),
  sort: z.enum(["name", "code", "birthdate"]).catch("name").optional(),
  dir: z.enum(["asc", "desc"]).catch("asc").optional(),
});

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/athletes/")({
  ssr: false,
  validateSearch: athletesSearchSchema,
  beforeLoad: ({ context, params }) => {
    if (
      !context.session ||
      (context.session.role !== "ADMIN" && context.session.role !== "CHIEF")
    ) {
      throw redirect({ to: "/leagues/$leagueId/dashboard", params: { leagueId: params.leagueId } });
    }
  },
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(athleteListQueryOptions(Number(leagueId), { per_page: 100 }));
  },
  component: AthletesPage,
});

function AthletesPage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const searchState = Route.useSearch();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(athleteListQueryOptions(Number(leagueId), { per_page: 100 }));
  const isAdmin = session!.role === "ADMIN";
  const search = searchState.q?.trim() ?? "";
  const linkedFilter = searchState.linked ?? "all";
  const sort = searchState.sort ?? "name";
  const dir = searchState.dir ?? "asc";

  const aiMutation = useMutation({
    mutationFn: async () =>
      unwrap(
        client.POST("/leagues/{league_id}/athletes/ai-generate", {
          params: { path: { league_id: Number(leagueId) } },
        }),
      ),
    onSuccess: async (athlete) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all(Number(leagueId)) });
      toast.success(`${m['common.actions.create']()}: ${athlete.name}.`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m['athlete.form.alert.error']());
    },
  });

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return [...data.data]
      .filter((athlete) => {
        const matchesSearch =
          !normalized ||
          athlete.name.toLowerCase().includes(normalized) ||
          athlete.code.toLowerCase().includes(normalized) ||
          String(athlete.user_id ?? "").includes(normalized);
        const matchesLinked =
          linkedFilter === "all" ||
          (linkedFilter === "linked" && athlete.user_id != null) ||
          (linkedFilter === "unlinked" && athlete.user_id == null);
        return matchesSearch && matchesLinked;
      })
      .sort((left, right) => {
        const multiplier = dir === "asc" ? 1 : -1;
        if (sort === "code") {
          return left.code.localeCompare(right.code) * multiplier;
        }
        if (sort === "birthdate") {
          return (left.birthdate ?? "").localeCompare(right.birthdate ?? "") * multiplier;
        }
        return left.name.localeCompare(right.name) * multiplier;
      });
  }, [data.data, dir, linkedFilter, search, sort]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">
              {isAdmin ? m['nav.admin.athletes']() : m['nav.chief.athletes']()}
            </CardTitle>
            <CardDescription className="max-w-2xl">
              {isAdmin
                ? m['athlete.form.desc.admin']()
                : m['athlete.form.desc.chief']()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label={isAdmin ? m['athletes.admin.stat.total']() : m['nav_athletes']()}
              value={String(data.data.length)}
              hint={isAdmin ? m['athletes.admin.hint.linked']() : m['athletes.admin.hint.linked']()}
            />
            <MetricCard
              label={m['athletes.admin.stat.linked']()}
              value={String(data.data.filter((athlete) => athlete.user_id != null).length)}
              hint={m['athletes.admin.hint.linked']()}
            />
            <MetricCard
              label={isAdmin ? m['athletes.admin.stat.missing']() : m['athletes.admin.stat.missing']()}
              value={String(
                data.data.filter((athlete) =>
                  isAdmin ? athlete.gender == null : !athlete.birthdate,
                ).length,
              )}
              hint={isAdmin ? m['athletes.admin.stat.missing']() : m['athletes.admin.stat.missing']()}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m['athletes.admin.card.actions.title']()}</CardTitle>
            <CardDescription>
              {m['athlete.form.desc.admin']()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/leagues/$leagueId/dashboard/athletes/new"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
            >
              <UserPlus className="size-4" />
              {m['athlete.form.title.create']()}
            </Link>
            {isAdmin ? (
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
                onClick={() => aiMutation.mutate()}
                disabled={aiMutation.isPending}
              >
                <Bot className="size-4" />
                {aiMutation.isPending ? m['competition.form.submitting']() : m['common.actions.create']()}
              </button>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>{isAdmin ? m['athletes.admin.list.global']() : m['athletes.admin.list.my']()}</CardTitle>
            <CardDescription>
              {isAdmin
                ? m['athletes.admin.searchPlaceholder']()
                : m['athletes.admin.searchPlaceholder']()}
            </CardDescription>
          </div>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_200px_200px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={m['athletes.admin.searchPlaceholder']()}
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
              value={linkedFilter}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    linked: value as "all" | "linked" | "unlinked",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{m['athletes.admin.filter.allLinks']()}</SelectItem>
                <SelectItem value="linked">{m['athletes.admin.filter.linked']()}</SelectItem>
                <SelectItem value="unlinked">{m['athletes.admin.filter.unlinked']()}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: value as "name" | "code" | "birthdate",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{m['athletes.admin.sort.name']()}</SelectItem>
                <SelectItem value="code">{m['athletes.admin.sort.code']()}</SelectItem>
                <SelectItem value="birthdate">{m['athletes.admin.sort.birthdate']()}</SelectItem>
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
                <SelectItem value="asc">{m['athletes.admin.sort.asc']()}</SelectItem>
                <SelectItem value="desc">{m['athletes.admin.sort.desc']()}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m['athletes.admin.table.name']()}</TableHead>
                <TableHead>{m['athletes.admin.table.code']()}</TableHead>
                <TableHead>{m['athletes.admin.table.gender']()}</TableHead>
                <TableHead>{m['athletes.admin.table.birthdate']()}</TableHead>
                {isAdmin ? <TableHead>{m['athletes.admin.table.user']()}</TableHead> : null}
                <TableHead className="text-right">{m['athletes.admin.table.profile']()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((athlete) => (
                <TableRow key={athlete.id}>
                  <TableCell className="font-medium">{athlete.name}</TableCell>
                  <TableCell className="font-mono text-xs">{athlete.code}</TableCell>
                  <TableCell>{athlete.gender ?? "-"}</TableCell>
                  <TableCell>{athlete.birthdate ? formatDate(athlete.birthdate) : "-"}</TableCell>
                  {isAdmin ? (
                    <TableCell>{athlete.user_id ? `#${athlete.user_id}` : m['athletes.admin.cell.noLink']()}</TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <Link
                      to="/leagues/$leagueId/athletes/$athleteId"
                      params={{ leagueId, athleteId: String(athlete.id) }}
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      {m['common.actions.open']()}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 6 : 5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {m['athletes.admin.empty']()}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

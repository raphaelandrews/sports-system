import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Input } from "@sports-system/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";
import { Search, Trophy, Users } from "lucide-react";

import { formatEventDate } from "@/shared/lib/date";
import { resolveRosterSize } from "@/shared/lib/sports";
import { sportListQueryOptions } from "@/features/sports/api/queries";

const sportsSearchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["all", "team", "individual"]).catch("all").optional(),
  sort: z.enum(["name", "created_at"]).catch("name").optional(),
  dir: z.enum(["asc", "desc"]).catch("asc").optional(),
});

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/sports/")({
  ssr: false,
  validateSearch: sportsSearchSchema,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void leagueId;
    void queryClient.prefetchQuery(sportListQueryOptions());
  },
  component: SportsPage,
});

function SportsPage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const searchState = Route.useSearch();
  const isAdmin = session?.role === "ADMIN";
  const { data } = useSuspenseQuery(sportListQueryOptions());
  const search = searchState.q?.trim() ?? "";
  const typeFilter = searchState.type ?? "all";
  const sort = searchState.sort ?? "name";
  const dir = searchState.dir ?? "asc";

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return [...data.data]
      .filter((sport) => {
        const matchesSearch = !normalized || sport.name.toLowerCase().includes(normalized);
        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "team" && sport.sport_type === "TEAM") ||
          (typeFilter === "individual" && sport.sport_type === "INDIVIDUAL");
        return matchesSearch && matchesType;
      })
      .sort((left, right) => {
        const multiplier = dir === "asc" ? 1 : -1;
        if (sort === "created_at") {
          return left.created_at.localeCompare(right.created_at) * multiplier;
        }
        return left.name.localeCompare(right.name) * multiplier;
      });
  }, [data.data, dir, search, sort, typeFilter]);

  const teamSports = data.data.filter((sport) => sport.sport_type === "TEAM").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <Badge variant="outline" className="w-fit">
              Esportes
            </Badge>
            <CardTitle className="text-2xl">Esportes e modalidades</CardTitle>
            <CardDescription className="max-w-2xl">
              {isAdmin
                ? "Painel administrativo para acompanhar os esportes ativos, revisar status e entrar nas modalidades configuradas."
                : "Esportes e modalidades disponíveis na competição."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Esportes"
              value={String(data.data.length)}
              hint="Cadastros ativos"
              icon={Trophy}
            />
            <MetricCard
              label="Coletivos"
              value={String(teamSports)}
              hint="Esportes por equipe"
              icon={Users}
            />
            <MetricCard
              label="Individuais"
              value={String(data.data.length - teamSports)}
              hint="Esportes individuais"
              icon={Trophy}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Status rapido</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Cada esporte leva para uma tela com modalidades, regras e estatisticas-schema."
                : "Consulte as modalidades de cada esporte."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use a busca para localizar rapidamente um esporte pelo nome.</p>
            {isAdmin ? (
              <p>O cadastro de modalidades acontece dentro da tela de detalhe de cada esporte.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Lista dos esportes</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Acesse o detalhe para editar modalidades e revisar as regras JSON."
                : "Consulte os esportes e suas modalidades."}
            </CardDescription>
          </div>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_200px_220px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar esporte"
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
              value={typeFilter}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    type: value as "all" | "team" | "individual",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="team">Somente coletivos</SelectItem>
                <SelectItem value="individual">Somente individuais</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: value as "name" | "created_at",
                  }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Ordenar por nome</SelectItem>
                <SelectItem value="created_at">Ordenar por criação</SelectItem>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Esporte</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Jogadores</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                {isAdmin ? <TableHead className="text-right">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sport) => (
                <TableRow key={sport.id}>
                  <TableCell className="font-medium">{sport.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sport.sport_type === "TEAM" ? "Coletivo" : "Individual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sport.sport_type === "TEAM"
                      ? resolveRosterSize(sport.player_count, sport.rules_json)
                      : (sport.player_count ?? "-")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sport.is_active ? "secondary" : "outline"}>
                      {sport.is_active ? "Ativo" : "Arquivado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatEventDate(sport.created_at, { dateStyle: "medium" })}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="text-right">
                      <Link
                        to="/leagues/$leagueId/dashboard/sports/$sportId"
                        params={{ leagueId, sportId: String(sport.id) }}
                        className={cn(buttonVariants({ variant: "outline" }))}
                      >
                        Abrir detalhe
                      </Link>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 6 : 5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhum esporte encontrado.
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

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Trophy;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

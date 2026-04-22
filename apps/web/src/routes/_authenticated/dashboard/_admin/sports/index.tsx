import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sports-system/ui/components/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";
import { Search, Trophy, Users } from "lucide-react";

import { formatEventDate } from "@/lib/date";
import { sportListQueryOptions } from "@/queries/sports";

export const Route = createFileRoute("/_authenticated/dashboard/_admin/sports/")({
  ssr: false,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(sportListQueryOptions())
  },
  component: AdminSportsPage,
});

function AdminSportsPage() {
  const { data } = useSuspenseQuery(sportListQueryOptions());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return data.data.filter((sport) => !normalized || sport.name.toLowerCase().includes(normalized));
  }, [data.data, search]);

  const teamSports = data.data.filter((sport) => sport.sport_type === "TEAM").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <Badge variant="outline" className="w-fit">
              Fase 7
            </Badge>
            <CardTitle className="text-2xl">Esportes e modalidades</CardTitle>
            <CardDescription className="max-w-2xl">
              Painel administrativo para acompanhar os esportes ativos, revisar status e entrar nas modalidades configuradas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Esportes" value={String(data.data.length)} hint="Cadastros ativos" icon={Trophy} />
            <MetricCard label="Coletivos" value={String(teamSports)} hint="Esportes por equipe" icon={Users} />
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
              Cada esporte leva para uma tela com modalidades, regras e estatisticas-schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use a busca para localizar rapidamente um esporte pelo nome.</p>
            <p>O cadastro de modalidades acontece dentro da tela de detalhe de cada esporte.</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Lista dos esportes</CardTitle>
            <CardDescription>
              Acesse o detalhe para editar modalidades e revisar as regras JSON.
            </CardDescription>
          </div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar esporte"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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
                <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell>{sport.player_count ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={sport.is_active ? "secondary" : "outline"}>
                      {sport.is_active ? "Ativo" : "Arquivado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatEventDate(sport.created_at, { dateStyle: "medium" })}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/dashboard/sports/$sportId"
                      params={{ sportId: String(sport.id) }}
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      Abrir detalhe
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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

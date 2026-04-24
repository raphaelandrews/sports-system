import { Badge } from "@sports-system/ui/components/badge";
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
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Flag, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { formatDate, formatTime } from "@/lib/date";
import { globalSearchQueryOptions } from "@/queries/search";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard/search")({
  validateSearch: searchSchema,
  component: DashboardSearchPage,
});

function DashboardSearchPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const query = search.q?.trim() ?? "";
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  const searchQuery = useQuery({
    ...globalSearchQueryOptions(query),
    enabled: query.length >= 2,
  });

  const results = searchQuery.data;
  const totalResults =
    (results?.athletes.length ?? 0) +
    (results?.delegations.length ?? 0) +
    (results?.events.length ?? 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Busca global</Badge>
              <Badge variant="secondary">Atletas · Delegações · Eventos</Badge>
            </div>
            <CardTitle className="text-3xl">Localize entidades da competição em um único fluxo</CardTitle>
            <CardDescription className="max-w-2xl">
              Pesquisa unificada sobre atletas, delegações e eventos com acesso rápido para as áreas mais úteis do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="relative max-w-2xl"
              onSubmit={(event) => {
                const formData = new FormData(event.currentTarget);
                const nextQuery = String(formData.get("q") ?? "").trim();
                event.preventDefault();
                void navigate({
                  to: "/dashboard/search",
                  search: nextQuery ? { q: nextQuery } : {},
                });
              }}
            >
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="pl-9"
                placeholder="Buscar por nome, código, modalidade, esporte ou local"
              />
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Estado atual da busca e volume de itens retornados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label="Consulta" value={query || "—"} />
            <SummaryRow
              label="Status"
              value={query.length < 2 ? "Aguardando ao menos 2 caracteres" : searchQuery.isFetching ? "Buscando..." : "Concluído"}
            />
            <SummaryRow label="Resultados" value={String(totalResults)} />
          </CardContent>
        </Card>
      </section>

      {query.length < 2 ? (
        <EmptyState text="Digite pelo menos 2 caracteres para buscar atletas, delegações e eventos." />
      ) : null}

      {query.length >= 2 && results && totalResults === 0 ? (
        <EmptyState text={`Nenhum resultado encontrado para "${query}".`} />
      ) : null}

      {results && totalResults > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="border border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-4" />
                  Atletas
                </CardTitle>
                <CardDescription>
                  Busca por nome e código do atleta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atleta</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.athletes.map((athlete) => (
                      <TableRow key={athlete.id}>
                        <TableCell className="font-medium">
                          <Link
                            to="/athletes/$athleteId"
                            params={{ athleteId: String(athlete.id) }}
                            className="hover:underline"
                          >
                            {athlete.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{athlete.code}</TableCell>
                        <TableCell>
                          <Badge variant={athlete.is_active ? "secondary" : "outline"}>
                            {athlete.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {results.athletes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                          Nenhum atleta correspondente.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="size-4" />
                  Delegações
                </CardTitle>
                <CardDescription>
                  Busca por nome e código da delegação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delegação</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.delegations.map((delegation) => (
                      <TableRow key={delegation.id}>
                        <TableCell className="font-medium">
                          <Link
                            to="/delegations/$delegationId"
                            params={{ delegationId: String(delegation.id) }}
                            className="hover:underline"
                          >
                            {delegation.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{delegation.code}</TableCell>
                        <TableCell>
                          <Badge variant={delegation.is_active ? "secondary" : "outline"}>
                            {delegation.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {results.delegations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                          Nenhuma delegação correspondente.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                Eventos
              </CardTitle>
              <CardDescription>
                Busca por esporte, modalidade ou local do evento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-border/70 bg-muted/25 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {event.sport_name} · {event.modality_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Competição #{event.competition_number} · {formatDate(event.event_date)} · {formatTime(event.start_time)}
                      </div>
                    </div>
                    <Badge variant="outline">{event.phase}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {event.venue ?? "Local não definido"} · {event.status}
                  </div>
                  <div className="mt-3">
                    <Link
                      to="/competitions/$competitionId"
                      params={{ competitionId: String(event.competition_id) }}
                      className="text-sm font-medium hover:underline"
                    >
                      Abrir competição #{event.competition_number}
                    </Link>
                  </div>
                </div>
              ))}
              {results.events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  Nenhum evento correspondente.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border border-dashed border-border/80">
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {text}
      </CardContent>
    </Card>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";
import { toast } from "sonner";

import { SportRulesForm } from "@/components/sports/sport-rules-form";
import { ApiError, apiFetch } from "@/lib/api";
import { resolveRosterSize } from "@/lib/sports";
import { queryKeys } from "@/queries/keys";
import { sportDetailQueryOptions } from "@/queries/sports";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_admin/sports/$sportId/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(sportDetailQueryOptions(Number(params.sportId)))
  },
  component: SportDetailPage,
});

function SportDetailPage() {
  const queryClient = useQueryClient();
  const { sportId } = Route.useParams();
  const sportNumber = Number(sportId);
  const { data: sport } = useSuspenseQuery(sportDetailQueryOptions(sportNumber));

  const rulesMutation = useMutation({
    mutationFn: (payload: { rules_json: Record<string, unknown> }) =>
      apiFetch(`/sports/${sportNumber}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sports.detail(sportNumber),
      });
      toast.success("Regras do esporte atualizadas.");
    },
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{sport.sport_type === "TEAM" ? "Coletivo" : "Individual"}</Badge>
              <Badge variant={sport.is_active ? "secondary" : "outline"}>
                {sport.is_active ? "Ativo" : "Arquivado"}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{sport.name}</CardTitle>
            <CardDescription className="max-w-2xl">
              {sport.description ?? "Sem descricao cadastrada para este esporte."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <QuickStat label="Modalidades" value={String(sport.modalities.length)} />
            <QuickStat
              label={sport.sport_type === "TEAM" ? "Roster size" : "Player count"}
              value={String(
                sport.sport_type === "TEAM"
                  ? resolveRosterSize(sport.player_count, sport.rules_json)
                  : sport.player_count ?? "-",
              )}
            />
            <QuickStat label="Stats schema" value={sport.stats_schema ? "Configurado" : "Vazio"} />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Entre no fluxo de criacao ou ajuste de modalidades deste esporte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/dashboard/sports/$sportId/modalities/new"
              params={{ sportId: String(sport.id) }}
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
            >
              Nova modalidade
            </Link>
            <Link
              to="/dashboard/sports"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              Voltar para lista
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Modalidades</CardTitle>
            <CardDescription>
              Edite regras, genero e categoria de cada modalidade ativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Genero</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Rules</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sport.modalities.map((modality) => (
                  <TableRow key={modality.id}>
                    <TableCell className="font-medium">{modality.name}</TableCell>
                    <TableCell>{modality.gender}</TableCell>
                    <TableCell>{modality.category ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Object.keys(modality.rules_json).length} chaves
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to="/dashboard/sports/$sportId/modalities/$modalityId/edit"
                        params={{
                          sportId: String(sport.id),
                          modalityId: String(modality.id),
                        }}
                        className={cn(buttonVariants({ variant: "outline" }))}
                      >
                        Editar
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {sport.modalities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhuma modalidade ativa cadastrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <SportRulesForm
            defaultRules={sport.rules_json}
            isSubmitting={rulesMutation.isPending}
            errorMessage={
              rulesMutation.error instanceof ApiError ? rulesMutation.error.message : null
            }
            onSubmit={async (value) => {
              await rulesMutation.mutateAsync(value);
            }}
          />
          <JsonCard
            title="Estatisticas-schema"
            description="Schema utilizado para estatisticas esportivas dinamicas."
            value={sport.stats_schema ?? {}}
          />
        </div>
      </section>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function JsonCard({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: Record<string, unknown>;
}) {
  return (
    <Card className="border border-border/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-xl border border-border/70 bg-muted/25 p-4 text-xs leading-6">
          {JSON.stringify(value, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

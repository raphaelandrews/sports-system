import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpenText, History } from "lucide-react";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Input } from "@sports-system/ui/components/input";
import { ScrollArea } from "@sports-system/ui/components/scroll-area";

import { AiGenerateButton } from "@/features/narratives/components/ai-generate-button";
import { NarrativeRichText } from "@/features/reports/components/narrative-rich-text";
import { apiFetch, ApiError } from "@/shared/lib/api";
import { formatDate, formatEventDate } from "@/shared/lib/date";
import {
  aiGenerationHistoryQueryOptions,
  narrativeTodayQueryOptions,
} from "@/features/narratives/api/queries";
import { queryKeys } from "@/features/keys";
import type { NarrativeResponse } from "@/types/reports";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/narrative/")({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(aiGenerationHistoryQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(narrativeTodayQueryOptions(Number(leagueId))),
    ]),
  component: NarrativePage,
});

function NarrativePage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: history } = useSuspenseQuery(aiGenerationHistoryQueryOptions(Number(leagueId)));
  const { data: todayNarrative } = useSuspenseQuery(narrativeTodayQueryOptions(Number(leagueId)));
  const [selectedDate, setSelectedDate] = useState(
    todayNarrative?.narrative_date ?? new Date().toISOString().slice(0, 10),
  );

  const narrativeHistory = useMemo(() => {
    const dates = new Set<string>();

    if (todayNarrative?.narrative_date) {
      dates.add(todayNarrative.narrative_date);
    }

    history
      .filter((entry) => entry.generation_type === "narrative")
      .forEach((entry) => {
        dates.add(entry.created_at.slice(0, 10));
      });

    return [...dates].sort((a, b) => b.localeCompare(a));
  }, [history, todayNarrative]);

  const narrativeQuery = useQuery({
    queryKey: queryKeys.ai.narrative(Number(leagueId), selectedDate),
    queryFn: async () => {
      try {
        return await apiFetch<NarrativeResponse>(`/narrative/${selectedDate}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const activeNarrative =
    narrativeQuery.data ??
    (todayNarrative?.narrative_date === selectedDate ? todayNarrative : null);
  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_38%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.20))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Narrativa IA</Badge>
              <Badge variant="secondary">
                {isAdmin ? "Admin pode gerar" : "Leitura autenticada"}
              </Badge>
            </div>
            <CardTitle className="text-3xl">Crônica diária da competição</CardTitle>
            <CardDescription className="max-w-2xl">
              Acompanhe o histórico editorial por dia e abra a narrativa consolidada com destaque
              visual.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <NarrativeStat label="Dias listados" value={String(narrativeHistory.length)} />
            <NarrativeStat
              label="Última geração"
              value={
                history.find((entry) => entry.generation_type === "narrative")
                  ? formatEventDate(
                      history.find((entry) => entry.generation_type === "narrative")!.created_at,
                      { dateStyle: "short", timeStyle: "short" },
                    )
                  : "—"
              }
            />
            <NarrativeStat label="Data ativa" value={formatDate(selectedDate)} />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Escolha a data editorial e, se você for admin, gere uma nova versão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Data
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            {isAdmin ? (
              <AiGenerateButton<NarrativeResponse>
                label="Gerar narrativa do dia"
                previewTitle="Preview da geração editorial"
                previewDescription="A IA reconstruirá a narrativa com base nas partidas concluídas do dia escolhido."
                previewItems={[
                  { label: "Endpoint", value: "/narrative/generate" },
                  { label: "Data", value: formatDate(selectedDate) },
                  { label: "Histórico", value: `${narrativeHistory.length} dia(s) listados` },
                  {
                    label: "Impacto",
                    value: "Substitui a versão existente da mesma data, se houver",
                  },
                ]}
                successMessage={(data) =>
                  `Narrativa gerada para ${formatDate(data.narrative_date)}.`
                }
                errorMessage="Falha ao gerar narrativa."
                onGenerate={() =>
                  apiFetch("/narrative/generate", {
                    method: "POST",
                    params: { target_date: selectedDate },
                  })
                }
                onSuccess={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.ai.history(Number(leagueId)),
                    }),
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.ai.narrative(Number(leagueId), "today"),
                    }),
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.ai.narrative(Number(leagueId), selectedDate),
                    }),
                  ]);
                }}
              />
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-4" />
              Histórico das narrativas
            </CardTitle>
            <CardDescription>
              Datas recentes identificadas a partir do histórico de geração.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[32rem] pr-4">
              <div className="space-y-3">
                {narrativeHistory.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`w-full rounded-3xl border p-4 text-left transition-colors ${
                      selectedDate === date
                        ? "border-primary/40 bg-primary/8"
                        : "border-border/70 bg-muted/10 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{formatDate(date)}</div>
                      <Badge variant={selectedDate === date ? "secondary" : "outline"}>
                        {selectedDate === date ? "ativo" : "abrir"}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{date}</div>
                  </button>
                ))}
                {narrativeHistory.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                    Nenhuma narrativa registrada ainda.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.12))]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpenText className="size-4" />
              <CardTitle>Narrativa</CardTitle>
            </div>
            <CardDescription>
              Renderização rica com destaque visual para trechos em ênfase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {narrativeQuery.isLoading && !activeNarrative ? (
              <div className="rounded-3xl border border-border/70 p-8 text-center text-sm text-muted-foreground">
                Carregando narrativa...
              </div>
            ) : activeNarrative ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatDate(activeNarrative.narrative_date)}</Badge>
                  <Badge variant="secondary">
                    {formatEventDate(activeNarrative.generated_at, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Badge>
                  <Badge variant="outline">editorial IA</Badge>
                </div>
                <div className="rounded-[2rem] border border-border/70 bg-background/80 p-6">
                  <NarrativeRichText content={activeNarrative.content} />
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
                Nenhuma narrativa encontrada para {formatDate(selectedDate)}.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function NarrativeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

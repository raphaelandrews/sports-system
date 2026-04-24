import { Badge } from "@sports-system/ui/components/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sports-system/ui/components/tabs";
import { Medal, ShieldCheck, Swords, Trophy, Users } from "lucide-react";

import { formatDate, formatEventDate } from "@/lib/date";
import type { DelegationStatisticsResponse } from "@/types/delegations";

const medalLabel = {
  GOLD: "Ouro",
  SILVER: "Prata",
  BRONZE: "Bronze",
} as const;

export function DelegationStatisticsPanel({
  stats,
  title = "Estatisticas da delegacao",
  description = "Recorte consolidado de atletas, medalhas e desempenho semanal.",
}: {
  stats: DelegationStatisticsResponse;
  title?: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Users}
          label="Atletas"
          value={String(stats.athlete_count)}
          hint={`${stats.active_athlete_count} ativos no momento`}
        />
        <StatCard
          icon={Medal}
          label="Medalhas"
          value={String(stats.total_medals)}
          hint={`${stats.gold} ouro · ${stats.silver} prata · ${stats.bronze} bronze`}
        />
        <StatCard
          icon={Swords}
          label="Partidas"
          value={String(stats.total_matches)}
          hint="Recorte historico da delegacao"
        />
        <StatCard
          icon={Trophy}
          label="Vitorias"
          value={String(stats.total_wins)}
          hint="Apuradas por rank 1"
        />
        <StatCard
          icon={ShieldCheck}
          label="Semanas com atividade"
          value={String(stats.weekly_performance.length)}
          hint="Semanas com jogos ou medalhas"
        />
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="athletes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="athletes">Atletas</TabsTrigger>
              <TabsTrigger value="medals">Medalhas</TabsTrigger>
              <TabsTrigger value="weeks">Semanas</TabsTrigger>
            </TabsList>

            <TabsContent value="athletes">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Partidas</TableHead>
                    <TableHead>Medalhas</TableHead>
                    <TableHead>Vinculo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.athletes.map((athlete) => (
                    <TableRow key={athlete.athlete_id}>
                      <TableCell>
                        <div className="font-medium">{athlete.athlete_name}</div>
                        <div className="text-xs text-muted-foreground">{athlete.athlete_code}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={athlete.is_current_member ? "secondary" : "outline"}>
                            {athlete.is_current_member ? "Ativo" : "Historico"}
                          </Badge>
                          {!athlete.is_active ? (
                            <Badge variant="outline">Ficha inativa</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{athlete.total_matches}</TableCell>
                      <TableCell>
                        {athlete.total_medals}
                        <div className="text-xs text-muted-foreground">
                          {athlete.gold}O · {athlete.silver}P · {athlete.bronze}B
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {athlete.joined_at
                          ? `Desde ${formatEventDate(athlete.joined_at, { dateStyle: "medium" })}`
                          : "Sem vinculo formal"}
                        {athlete.left_at
                          ? ` · Ate ${formatEventDate(athlete.left_at, { dateStyle: "medium" })}`
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                  {stats.athletes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhum atleta associado a esta delegacao ainda.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="medals">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medalha</TableHead>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Partida</TableHead>
                    <TableHead>Colocacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.medals.map((medal) => (
                    <TableRow key={medal.result_id}>
                      <TableCell>
                        <Badge variant="outline">{medalLabel[medal.medal]}</Badge>
                      </TableCell>
                      <TableCell>{medal.athlete_name ?? "Delegacao"}</TableCell>
                      <TableCell>#{medal.match_id}</TableCell>
                      <TableCell>{medal.rank}º</TableCell>
                    </TableRow>
                  ))}
                  {stats.medals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma medalha registrada.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="weeks">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competição</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Partidas</TableHead>
                    <TableHead>Vitorias</TableHead>
                    <TableHead>Medalhas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.weekly_performance.map((week) => (
                    <TableRow key={week.competition_id}>
                      <TableCell className="font-medium">#{week.competition_number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(week.start_date)} - {formatDate(week.end_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{week.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {week.matches_played}
                        <div className="text-xs text-muted-foreground">
                          {week.matches_completed} concluidas
                        </div>
                      </TableCell>
                      <TableCell>{week.wins}</TableCell>
                      <TableCell>
                        {week.total_medals}
                        <div className="text-xs text-muted-foreground">
                          {week.gold}O · {week.silver}P · {week.bronze}B
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {stats.weekly_performance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Ainda sem desempenho historico por semana.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border border-border/70">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        </div>
        <div className="rounded-xl bg-muted p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

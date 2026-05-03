import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
import { Badge } from "@sports-system/ui/components/badge";
import { Card, CardContent, CardHeader } from "@sports-system/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sports-system/ui/components/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { formatDate } from "@/shared/lib/date";
import { athleteReportQueryOptions } from "@/features/athletes/api/queries";
import type { Medal } from "@/types/athletes";

export const Route = createFileRoute("/leagues/$leagueId/(public)/athletes/$athleteId")({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId, athleteId } }) =>
    queryClient.ensureQueryData(athleteReportQueryOptions(Number(leagueId), Number(athleteId))),
  component: AthleteProfilePage,
});

const medalEmoji: Record<Medal, string> = {
  GOLD: "🥇",
  SILVER: "🥈",
  BRONZE: "🥉",
};

const medalLabel: Record<Medal, string> = {
  GOLD: "Ouro",
  SILVER: "Prata",
  BRONZE: "Bronze",
};

const genderLabel: Record<"M" | "F", string> = {
  M: "Masculino",
  F: "Feminino",
};

function AthleteProfilePage() {
  const { leagueId, athleteId } = Route.useParams();
  const { data } = useSuspenseQuery(athleteReportQueryOptions(Number(leagueId), Number(athleteId)));

  const { athlete, delegation_history, match_history, medals, statistics } = data;

  const initials = athlete.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="h-16 w-16 text-lg">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{athlete.name}</h1>
            <Badge variant="outline" className="font-mono">
              {athlete.code}
            </Badge>
            {!athlete.is_active && <Badge variant="secondary">Inativo</Badge>}
          </div>
          <div className="text-muted-foreground mt-1 flex gap-3 text-sm">
            {athlete.gender && <span>{genderLabel[athlete.gender]}</span>}
            {athlete.birthdate && <span>{formatDate(athlete.birthdate)}</span>}
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-muted-foreground text-sm">
            ID: {athlete.id}
          </span>
        </div>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
          <TabsTrigger value="medals">Medalhas</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4 space-y-6">
          <div>
            <h3 className="mb-3 font-medium">Delegações</h3>
            {delegation_history.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem histórico de delegações.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delegação</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delegation_history.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <span className="font-mono text-xs">{item.delegation_code}</span>{" "}
                        {item.delegation_name}
                      </TableCell>
                      <TableCell>{item.role}</TableCell>
                      <TableCell>{formatDate(item.joined_at.slice(0, 10))}</TableCell>
                      <TableCell>
                        {item.left_at ? formatDate(item.left_at.slice(0, 10)) : "Atual"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h3 className="mb-3 font-medium">Partidas</h3>
            {match_history.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem histórico de partidas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Esporte</TableHead>
                    <TableHead>Delegação</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {match_history.map((item) => (
                    <TableRow key={item.match_id}>
                      <TableCell>{item.modality_name}</TableCell>
                      <TableCell>{item.sport_name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.delegation_code}</TableCell>
                      <TableCell>{item.role}</TableCell>
                      <TableCell>
                        {item.match_date ? formatDate(item.match_date.slice(0, 10)) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          {Object.keys(statistics).length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma estatística registrada.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(statistics).map(([key, stats]) => {
                const label = key.replace("sport_", "Esporte ").replace("_week_", " · Semana ");
                return (
                  <Card key={key}>
                    <CardHeader className="pb-1 text-sm font-medium">{label}</CardHeader>
                    <CardContent className="space-y-1">
                      {Object.entries(stats as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {k.replace(/_/g, " ")}
                          </span>
                          <span className="font-mono">{String(v)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medals" className="mt-4">
          {medals.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma medalha conquistada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partida</TableHead>
                  <TableHead>Medalha</TableHead>
                  <TableHead>Posição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medals.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">#{m.match_id}</TableCell>
                    <TableCell>
                      {m.medal ? (
                        <>
                          {medalEmoji[m.medal]} {medalLabel[m.medal]}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{m.rank}º</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

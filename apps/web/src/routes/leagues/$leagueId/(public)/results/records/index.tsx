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
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { formatEventDate } from "@/shared/lib/date";
import { recordsQueryOptions } from "@/features/results/api/queries";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/leagues/$leagueId/(public)/results/records/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(recordsQueryOptions(Number(leagueId))),
  component: RecordsPage,
});

function RecordsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(recordsQueryOptions(Number(leagueId)));

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{m["results.records.badge"]()}</Badge>
            <Badge variant="secondary">{data.length} marca(s)</Badge>
          </div>
          <CardTitle className="text-3xl">{m["results.records.title"]()}</CardTitle>
          <CardDescription>m["results.records.desc"]()</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border border-border/70">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m["results.records.table.modality"]()}</TableHead>
                <TableHead>{m["results.records.table.athlete"]()}</TableHead>
                <TableHead>{m["results.records.table.delegation"]()}</TableHead>
                <TableHead>{m["results.records.table.value"]()}</TableHead>
                <TableHead>{m["results.records.table.week"]()}</TableHead>
                <TableHead>{m["results.records.table.date"]()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.modality_name}</TableCell>
                  <TableCell>{record.athlete_name}</TableCell>
                  <TableCell>{record.delegation_name}</TableCell>
                  <TableCell className="font-mono">{record.value}</TableCell>
                  <TableCell>#{record.competition_id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatEventDate(record.set_at, { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {m["results.records.empty"]()}
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

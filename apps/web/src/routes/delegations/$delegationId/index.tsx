import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import * as m from "@/paraglide/messages";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
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
import {
  standaloneDelegationDetailQueryOptions,
  delegationLeaguesQueryOptions,
} from "@/features/delegations/api/queries";

export const Route = createFileRoute("/delegations/$delegationId/")({
  loader: ({ context: { queryClient }, params: { delegationId } }) =>
    Promise.all([
      queryClient.ensureQueryData(standaloneDelegationDetailQueryOptions(Number(delegationId))),
      queryClient.ensureQueryData(delegationLeaguesQueryOptions(Number(delegationId))),
    ]),
  component: StandaloneDelegationPage,
});

const statusLabel: Record<string, string> = {
  INDEPENDENT: m['myDelegations.stat.independent'](),
  PENDING: m['common.status.pending'](),
  APPROVED: m['common.status.approved'](),
  REJECTED: m['common.status.rejected'](),
};

function StandaloneDelegationPage() {
  const { delegationId } = Route.useParams();
  const numericId = Number(delegationId);
  const { data } = useSuspenseQuery(standaloneDelegationDetailQueryOptions(numericId));
  const { data: leagues } = useSuspenseQuery(delegationLeaguesQueryOptions(numericId));

  const activeMembers = data.members.filter((m: any) => !m.left_at);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-6">
      <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {data.code}
            </span>
            {!data.is_active && <Badge variant="destructive">{m['delegation.public.status.inactive']()}</Badge>}
            <Badge variant="outline">{statusLabel[data.status] ?? data.status}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={data.flag_url ?? ""} alt={data.name} />
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-lg">
                {data.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl font-semibold">{data.name}</CardTitle>
            </div>
          </div>
          <CardDescription>
            {m['myDelegations.table.created']()} {new Date(data.created_at).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m['delegation.public.card.leagues']()}</CardTitle>
          <CardDescription>
            {m['myDelegations.stat.inLeague']()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leagues.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {m['myDelegations.empty']()}
            </p>
          ) : (
            <div className="rounded-xl border bg-card shadow-xs/5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m['delegation.public.table.name']()}</TableHead>
                    <TableHead className="w-28 text-right">{m['delegation.public.table.action']()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leagues.map((league: any) => (
                    <TableRow key={league.id}>
                      <TableCell className="font-medium">{league.name}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          to="/leagues/$leagueId"
                          params={{ leagueId: String(league.id) }}
                          className="text-sm text-primary hover:underline"
                        >
                          {m['league.card.cta']()}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m['delegation.public.card.members']()}</CardTitle>
          <CardDescription>
            {activeMembers.length} {m['delegation.public.card.members']()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <p className="text-muted-foreground text-sm">{m['delegation.public.empty.members']()}</p>
          ) : (
            <div className="rounded-xl border bg-card shadow-xs/5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m['delegation.public.table.name']()}</TableHead>
                    <TableHead className="w-28">{m['delegation.public.table.role']()}</TableHead>
                    <TableHead className="w-36">{m['delegation.public.table.joined']()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMembers.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs">
                          {new Date(member.joined_at).toLocaleDateString("pt-BR")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

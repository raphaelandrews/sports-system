import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
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
import { Check, X } from "lucide-react";
import { participationRequestsQueryOptions, type ParticipationRequest } from "@/features/delegations/api/queries";
import { client, unwrap, ApiError } from "@/shared/lib/api";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/participation-requests/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(participationRequestsQueryOptions(Number(leagueId)));
  },
  component: ParticipationRequestsPage,
});

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const statusVariant: Record<string, string> = {
  PENDING: "border-amber-500/30 text-amber-700 dark:text-amber-400",
  APPROVED: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-destructive/30 text-destructive",
};

function ParticipationRequestsPage() {
  const { leagueId } = Route.useParams();
  const numericLeagueId = Number(leagueId);
  const queryClient = useQueryClient();
  const { data: requests } = useSuspenseQuery(participationRequestsQueryOptions(numericLeagueId));

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: number; status: ParticipationRequest["status"] }) =>
      unwrap(
        client.POST("/leagues/{league_id}/delegations/participation-requests/{request_id}/review", {
          params: { path: { league_id: numericLeagueId, request_id: requestId } },
          body: { status },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["participation-requests", numericLeagueId],
      });
      toast.success("Solicitação atualizada.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao atualizar solicitação.");
    },
  });

  const pendingRequests = requests.filter((r: ParticipationRequest) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
        <CardHeader className="gap-3">
          <Badge variant="outline" className="w-fit">
            Solicitações
          </Badge>
          <CardTitle className="text-2xl">Pedidos de participação</CardTitle>
          <CardDescription className="max-w-2xl">
            Aprove ou rejeite solicitações de delegações que querem participar desta liga.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Pendentes" value={String(pendingRequests.length)} />
          <MetricCard label="Total" value={String(requests.length)} />
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card shadow-xs/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">Delegação</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-36">Solicitado em</TableHead>
              <TableHead className="pe-4 w-36 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhuma solicitação encontrada.
                </TableCell>
              </TableRow>
            )}
            {requests.map((request: ParticipationRequest) => (
              <TableRow key={request.id}>
                <TableCell className="ps-4">
                  <span className="font-medium">
                    Delegação #{request.delegation_id}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusVariant[request.status] ?? ""}
                  >
                    {statusLabel[request.status] ?? request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </TableCell>
                <TableCell className="pe-4 text-right">
                  {request.status === "PENDING" ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ requestId: request.id, status: "REJECTED" })
                        }
                      >
                        <X className="size-3.5 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ requestId: request.id, status: "APPROVED" })
                        }
                      >
                        <Check className="size-3.5 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {request.status === "APPROVED" ? "Aprovada" : "Rejeitada"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

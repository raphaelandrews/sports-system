import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Badge } from "@sports-system/ui/components/badge";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@sports-system/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";
import { MoreHorizontal, Pencil, ExternalLink, Flag, Hand } from "lucide-react";
import { myDelegationsQueryOptions } from "@/features/delegations/api/queries";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { DelegationResponse } from "@/types/delegations";

export const Route = createFileRoute("/_authenticated/my-delegations/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(myDelegationsQueryOptions()),
      queryClient.ensureQueryData(leagueListQueryOptions()),
    ]),
  component: MyDelegationsPage,
});

const statusLabel: Record<string, string> = {
  INDEPENDENT: "Independente",
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const statusVariant: Record<string, string> = {
  INDEPENDENT: "border-muted-foreground/30 text-muted-foreground",
  PENDING: "border-amber-500/30 text-amber-700 dark:text-amber-400",
  APPROVED: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-destructive/30 text-destructive",
};

function MyDelegationsPage() {
  const { data: delegations } = useSuspenseQuery(myDelegationsQueryOptions());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationResponse | null>(null);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_38%),linear-gradient(165deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.2))]">
          <CardHeader className="gap-3">
            <Badge variant="outline">Delegações</Badge>
            <CardTitle className="text-2xl">Minhas delegações</CardTitle>
            <CardDescription className="max-w-2xl">
              Gerencie suas delegações independentes e acompanhe o status de participação em ligas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total" value={String(delegations.length)} />
            <StatCard
              label="Independentes"
              value={String(delegations.filter((d) => d.status === "INDEPENDENT").length)}
            />
            <StatCard
              label="Em ligas"
              value={String(delegations.filter((d) => d.league_id != null).length)}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Controles</CardTitle>
            <CardDescription>Crie e gerencie suas delegações.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/delegations/new"
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
            >
              <Flag className="mr-2 size-4" />
              Nova delegação
            </Link>
          </CardContent>
        </Card>
      </section>

      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Lista de delegações</h1>
            <p className="text-muted-foreground text-sm">
              {delegations.length} delegação{delegations.length !== 1 ? "es" : ""}
            </p>
          </div>
        </header>

        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">Nome</TableHead>
                <TableHead className="w-28">Código</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-36">Criada em</TableHead>
                <TableHead className="pe-4 w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delegations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma delegação encontrada.
                  </TableCell>
                </TableRow>
              )}
              {delegations.map((delegation: DelegationResponse) => (
                <TableRow key={delegation.id}>
                  <TableCell className="ps-4">
                    <div className="flex items-center gap-3">
                      {delegation.flag_url ? (
                        <img
                          src={delegation.flag_url}
                          alt={delegation.name}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                          {delegation.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium">{delegation.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-muted-foreground text-xs">
                      {delegation.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-mono text-[10px]", statusVariant[delegation.status])}
                    >
                      {statusLabel[delegation.status] ?? delegation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">
                      {new Date(delegation.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </TableCell>
                  <TableCell className="pe-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link
                            to="/my-delegations/$delegationId/edit"
                            params={{ delegationId: String(delegation.id) }}
                            className="flex items-center gap-2 w-full"
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDelegation(delegation);
                            setDialogOpen(true);
                          }}
                        >
                          <span className="flex items-center gap-2 w-full">
                            <Hand className="size-3.5" />
                            Solicitar participação
                          </span>
                        </DropdownMenuItem>
                        {delegation.league_id ? (
                          <DropdownMenuItem>
                            <Link
                              to="/leagues/$leagueId/delegations/$delegationId"
                              params={{
                                leagueId: String(delegation.league_id),
                                delegationId: String(delegation.id),
                              }}
                              className="flex items-center gap-2 w-full"
                            >
                              <ExternalLink className="size-3.5" />
                              Ver na liga
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedDelegation && (
        <RequestParticipationDialog
          delegation={selectedDelegation}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function RequestParticipationDialog({
  delegation,
  open,
  onOpenChange,
}: {
  delegation: DelegationResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");

  const mutation = useMutation({
    mutationFn: (leagueId: number) =>
      unwrap(
        (client as any).POST("/delegations/{delegation_id}/participation-requests", {
          params: { path: { delegation_id: delegation.id } },
          body: { league_id: leagueId },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.delegations.my() });
      toast.success("Solicitação enviada com sucesso.");
      onOpenChange(false);
      setSelectedLeagueId("");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao enviar solicitação.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar participação</DialogTitle>
          <DialogDescription>
            Escolha a liga onde deseja participar com{" "}
            <strong>{delegation.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedLeagueId} onValueChange={(value) => setSelectedLeagueId(value ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma liga" />
            </SelectTrigger>
            <SelectContent>
              {leagues.map((league) => (
                <SelectItem key={league.id} value={String(league.id)}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!selectedLeagueId || mutation.isPending}
            onClick={() => mutation.mutate(Number(selectedLeagueId))}
          >
            {mutation.isPending ? "Enviando..." : "Solicitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { MoreHorizontal, Pencil, ExternalLink, Hand, Sparkles, ChevronLeft, ChevronRight, Bot, Send } from "lucide-react";
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

const ITEMS_PER_PAGE = 10;

function MyDelegationsPage() {
  const { data: delegations } = useSuspenseQuery(myDelegationsQueryOptions());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationResponse | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(delegations.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedDelegations = delegations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
              <Sparkles className="mr-2 size-4" />
              Nova delegação
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setAiDialogOpen(true)}
            >
              <Bot className="mr-2 size-4" />
              Criar com IA
            </Button>
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
              {paginatedDelegations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma delegação encontrada.
                  </TableCell>
                </TableRow>
              )}
              {paginatedDelegations.map((delegation: DelegationResponse) => (
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
                      {delegation.league_id ? (
                        <Link
                          to="/leagues/$leagueId/delegations/$delegationId"
                          params={{ leagueId: String(delegation.league_id), delegationId: String(delegation.id) }}
                          className="font-medium hover:underline"
                        >
                          {delegation.name}
                        </Link>
                      ) : (
                        <Link
                          to="/delegations/$delegationId"
                          params={{ delegationId: String(delegation.id) }}
                          className="font-medium hover:underline"
                        >
                          {delegation.name}
                        </Link>
                      )}
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
                      <DropdownMenuContent align="end" className="w-full">
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
                          <span className="flex items-center gap-2 w-full whitespace-nowrap">
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} ({delegations.length} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedDelegation && (
        <RequestParticipationDialog
          delegation={selectedDelegation}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}

      <AIGenerateDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} />
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
        client.POST("/delegations/{delegation_id}/participation-requests", {
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

function AIGenerateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Olá! Sou seu assistente de criação de delegações. Me diga quantas delegações você quer e o tema.",
    },
  ]);
  const [input, setInput] = useState("");

  const mutation = useMutation({
    mutationFn: async (prompt: string) =>
      unwrap(
        client.POST("/delegations/ai-generate", {
          body: { prompt, count: 5 },
        }),
      ),
    onSuccess: async (created: DelegationResponse[]) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.delegations.my() });
      const names = created.map((d) => d.name).join(", ");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Pronto! Criei ${created.length} delegações: ${names}.`,
        },
      ]);
      toast.success(
        created.length === 1
          ? "1 delegação criada com IA."
          : `${created.length} delegações criadas com IA.`,
      );
    },
    onError: (error) => {
      const msg = error instanceof ApiError ? error.message : "Falha ao gerar delegações.";
      setMessages((prev) => [...prev, { role: "assistant", content: `Erro: ${msg}` }]);
      toast.error(msg);
    },
  });

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;
    const prompt = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setInput("");
    mutation.mutate(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-5" />
            Criar delegações com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o tema e quantidade. Ex: "5 delegações com nomes de times europeus"
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-96 flex-col gap-3">
          <div className="flex-1 overflow-y-auto space-y-3 rounded-lg border bg-muted/30 p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1 rounded-xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-background border"
                )}
              >
                {msg.content}
              </div>
            ))}
            {mutation.isPending && (
              <div className="mr-auto flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Criando delegações...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Descreva as delegações que deseja..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              disabled={mutation.isPending}
            />
            <Button size="sm" onClick={handleSend} disabled={!input.trim() || mutation.isPending}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

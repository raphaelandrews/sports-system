import { Badge } from "@sports-system/ui/components/badge";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Input } from "@sports-system/ui/components/input";
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
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bot, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatEventDate } from "@/lib/date";
import { apiFetch, ApiError } from "@/lib/api";
import { delegationListQueryOptions } from "@/queries/delegations";
import { queryKeys } from "@/queries/keys";
import type { DelegationResponse } from "@/types/delegations";

const PAGE_SIZE = 8;

export const Route = createFileRoute("/_authenticated/dashboard/_admin/delegations/")({
  ssr: false,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(delegationListQueryOptions())
  },
  component: AdminDelegationsPage,
});

function AdminDelegationsPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(delegationListQueryOptions());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [aiCount, setAiCount] = useState("5");

  const aiMutation = useMutation({
    mutationFn: async () =>
      apiFetch<DelegationResponse[]>("/delegations/ai-generate", {
        method: "POST",
        params: { count: Number(aiCount) },
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.all(),
      });
      toast.success(
        created.length === 1
          ? "1 delegação criada com IA."
          : `${created.length} delegações criadas com IA.`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Falha ao gerar delegações com IA.",
      );
    },
  });

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return data.data.filter((delegation) => {
      const matchesSearch =
        !normalized ||
        delegation.name.toLowerCase().includes(normalized) ||
        delegation.code.toLowerCase().includes(normalized);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && delegation.is_active) ||
        (statusFilter === "INACTIVE" && !delegation.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [data.data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = data.data.filter((delegation) => delegation.is_active).length;
  const withChiefCount = data.data.filter((delegation) => delegation.chief_id != null).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_46%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.28))]">
          <CardHeader className="gap-3">
            <Badge variant="outline" className="w-fit">
              Fase 5
            </Badge>
            <CardTitle className="text-2xl">Gestão de delegações</CardTitle>
            <CardDescription className="max-w-2xl">
              Organize a base competitiva, filtre status, abra cadastros manuais e acelere a criação inicial com geração por IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={ShieldCheck}
              label="Total"
              value={String(data.data.length)}
              hint="Delegações cadastradas"
            />
            <MetricCard
              icon={Users}
              label="Ativas"
              value={String(activeCount)}
              hint="Prontas para competir"
            />
            <MetricCard
              icon={Bot}
              label="Com chefe"
              value={String(withChiefCount)}
              hint="Vínculo administrativo definido"
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Geração rápida com IA</CardTitle>
            <CardDescription>
              Crie blocos de delegações para ambiente demo ou povoamento inicial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={aiCount} onValueChange={(value) => setAiCount(value ?? "5")}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["3", "5", "8", "10", "15"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value} itens
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => aiMutation.mutate()}
                disabled={aiMutation.isPending}
              >
                <Bot className="size-4" />
                {aiMutation.isPending ? "Gerando..." : "Gerar com IA"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Cada execução cria novas delegações. Revise nomes e bandeiras depois do preenchimento automático.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Lista operacional</CardTitle>
              <CardDescription>
                Filtre por nome, código e status para localizar delegações rapidamente.
              </CardDescription>
            </div>
            <Link
              to="/dashboard/delegations/new"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="size-4" />
              Nova delegação
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou código"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter((value as typeof statusFilter | null) ?? "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Somente ativas</SelectItem>
                <SelectItem value="INACTIVE">Somente inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chefe</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((delegation) => (
                <TableRow key={delegation.id}>
                  <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                    {delegation.code}
                  </TableCell>
                  <TableCell className="font-medium">{delegation.name}</TableCell>
                  <TableCell>
                    <Badge variant={delegation.is_active ? "secondary" : "outline"}>
                      {delegation.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {delegation.chief_id ? `Usuário #${delegation.chief_id}` : "Sem chefe"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatEventDate(delegation.created_at, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/dashboard/delegations/$delegationId"
                      params={{ delegationId: String(delegation.id) }}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "ml-auto",
                      )}
                    >
                      Abrir
                      <ArrowRight className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}

              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhuma delegação encontrada para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              Mostrando {paginated.length} de {filtered.length} delegações filtradas.
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="min-w-28 text-center">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs uppercase tracking-[0.24em]">{label}</span>
      </div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
    </div>
  );
}

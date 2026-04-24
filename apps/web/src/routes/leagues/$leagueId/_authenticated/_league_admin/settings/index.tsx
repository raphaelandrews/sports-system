import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Checkbox } from "@sports-system/ui/components/checkbox";
import { Input } from "@sports-system/ui/components/input";
import { Label } from "@sports-system/ui/components/label";
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

import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import { leagueDetailQueryOptions, leagueMembersQueryOptions } from "@/queries/leagues";
import { sportListQueryOptions } from "@/queries/sports";
import type { LeagueMemberRole } from "@/types/leagues";

const roleLabel: Record<LeagueMemberRole, string> = {
  LEAGUE_ADMIN: "Administrador",
  CHIEF: "Chefe",
  COACH: "Técnico",
  ATHLETE: "Atleta",
};

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/_league_admin/settings/")({
  component: LeagueSettingsPage,
});

function LeagueSettingsPage() {
  const { leagueId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lid = Number(leagueId);

  const { data: league } = useSuspenseQuery(leagueDetailQueryOptions(lid));
  const { data: members } = useSuspenseQuery(leagueMembersQueryOptions(lid));
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  const [name, setName] = useState(league.name);
  const [slug, setSlug] = useState(league.slug);
  const [description, setDescription] = useState(league.description ?? "");
  const [timezone, setTimezone] = useState(league.timezone);
  const [selectedSports, setSelectedSports] = useState<number[]>(league.sports_config);
  const [transferWindow, setTransferWindow] = useState(league.transfer_window_enabled);
  const [autoSimulate, setAutoSimulate] = useState(league.auto_simulate);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      slug: string;
      description: string;
      timezone: string;
      sports_config: number[];
      transfer_window_enabled: boolean;
      auto_simulate: boolean;
    }) =>
      apiFetch(`/leagues/${lid}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.detail(lid) });
      toast.success("Liga atualizada com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao atualizar liga.");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/leagues/${lid}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all() });
      toast.success("Liga arquivada com sucesso.");
      await navigate({ to: "/leagues" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao arquivar liga.");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: LeagueMemberRole }) =>
      apiFetch(`/leagues/${lid}/members/${userId}`, {
        method: "PATCH",
        body: { role },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.members(lid) });
      toast.success("Função atualizada com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao atualizar função.");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/leagues/${lid}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.members(lid) });
      toast.success("Membro removido com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao remover membro.");
    },
  });

  const toggleSport = (sportId: number) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      name,
      slug,
      description,
      timezone,
      sports_config: selectedSports,
      transfer_window_enabled: transferWindow,
      auto_simulate: autoSimulate,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-10">
      <h1 className="text-2xl font-bold">Configurações da Liga</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações gerais</CardTitle>
          <CardDescription>Atualize os dados principais da liga.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso horário</Label>
              <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Esportes</Label>
              <div className="flex flex-wrap gap-4">
                {sports.data.map((sport) => (
                  <label key={sport.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedSports.includes(sport.id)}
                      onCheckedChange={() => toggleSport(sport.id)}
                    />
                    <span className="text-sm">{sport.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Janela de transferência</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir transferências entre delegações
                </p>
              </div>
              <Checkbox
                checked={transferWindow}
                onCheckedChange={(checked) => setTransferWindow(checked === true)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Simulação automática</Label>
                <p className="text-sm text-muted-foreground">
                  Iniciar e finalizar partidas automaticamente
                </p>
              </div>
              <Checkbox
                checked={autoSimulate}
                onCheckedChange={(checked) => setAutoSimulate(checked === true)}
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>Gerencie os membros e suas funções na liga.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">#{member.user_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabel[member.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({
                            userId: member.user_id,
                            role: role as LeagueMemberRole,
                          })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabel).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.user_id)}
                        disabled={removeMemberMutation.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de perigo</CardTitle>
          <CardDescription>Ações irreversíveis para esta liga.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? "Arquivando..." : "Arquivar liga"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

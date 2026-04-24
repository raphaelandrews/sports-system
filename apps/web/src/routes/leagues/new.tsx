import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@sports-system/ui/components/button";
import { Input } from "@sports-system/ui/components/input";
import { Label } from "@sports-system/ui/components/label";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import { sportListQueryOptions } from "@/queries/sports";
import type { LeagueResponse } from "@/types/leagues";

export const Route = createFileRoute("/leagues/new")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(sportListQueryOptions());
  },
  component: NewLeaguePage,
});

function NewLeaguePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [transferWindow, setTransferWindow] = useState(false);
  const [autoSimulate, setAutoSimulate] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: {
      name: string;
      slug: string;
      description: string;
      timezone: string;
      sports_config: number[];
      transfer_window_enabled: boolean;
      auto_simulate: boolean;
    }) =>
      apiFetch<LeagueResponse>("/leagues", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (data: LeagueResponse) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all() });
      toast.success("Liga criada com sucesso.");
      await navigate({ to: "/leagues/$leagueId/dashboard", params: { leagueId: String(data.id) } });
    },
  });

  const toggleSport = (sportId: number) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
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
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Criar nova liga</h1>

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
            <Label htmlFor="transfer-window">Janela de transferência</Label>
            <p className="text-sm text-muted-foreground">
              Permitir transferências entre delegações
            </p>
          </div>
          <Checkbox
            id="transfer-window"
            checked={transferWindow}
            onCheckedChange={(checked) => setTransferWindow(checked === true)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="auto-simulate">Simulação automática</Label>
            <p className="text-sm text-muted-foreground">
              Iniciar e finalizar partidas automaticamente
            </p>
          </div>
          <Checkbox
            id="auto-simulate"
            checked={autoSimulate}
            onCheckedChange={(checked) => setAutoSimulate(checked === true)}
          />
        </div>

        {mutation.error instanceof ApiError && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Criando..." : "Criar liga"}
        </Button>
      </form>
    </div>
  );
}

import { type FormEvent, useState } from "react";
import { Button } from "@sports-system/ui/components/button";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import { Input } from "@sports-system/ui/components/input";
import { Label } from "@sports-system/ui/components/label";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import * as m from "@/paraglide/messages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import type { LeagueResponse } from "@/types/leagues";
import { Badge } from "@sports-system/ui/components/badge";
import { Title } from "@/shared/components/ui/title";

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
  const [logoUrl, setLogoUrl] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [transferWindow, setTransferWindow] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: {
      name: string;
      slug: string;
      description: string;
      logo_url?: string;
      timezone: string;
      sports_config: number[];
      transfer_window_enabled: boolean;
    }) => unwrap(client.POST("/leagues", { body: payload })),
    onSuccess: async (data: LeagueResponse) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all() });
      toast.success("Liga criada com sucesso.");
      await navigate({ to: "/leagues/$leagueId", params: { leagueId: String(data.id) } });
    },
  });

  const toggleSport = (sportId: number) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      name,
      slug,
      description,
      ...(logoUrl.trim() ? { logo_url: logoUrl.trim() } : {}),
      timezone,
      sports_config: selectedSports,
      transfer_window_enabled: transferWindow,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-background/60"
    >
      <Title
        title={m['league.new.title']()}
        subtitle={m['league.new.subtitle']()}
      />

      <div className="mt-6 flex flex-col gap-1.5">
        <Label htmlFor="name">{m['league.new.label.name']()}</Label>
        <Input
          id="name"
          placeholder={m['league.new.placeholder.name']()}
          value={name}
          onChange={(e) => {
            const val = e.target.value.replace(/^\s+/, "").replace(/\s+/g, " ");
            setName(val);
            setSlug(val.toLowerCase().trim().replace(/\s+/g, "-"));
          }}
          required
        />
        <p className="text-muted-foreground text-xs">
          Identificador público da competição.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <Label htmlFor="slug">{m['league.new.label.slug']()}</Label>
        <Input id="slug" value={slug} disabled readOnly required />
        <p className="text-muted-foreground text-xs">
          Gerado automaticamente a partir do nome.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <Label htmlFor="description">{m['league.new.label.description']()}</Label>
        <textarea
          id="description"
          placeholder={m['league.new.placeholder.description']()}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/24 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="mt-4">
        <ImageUpload
          value={logoUrl}
          onChange={setLogoUrl}
          label={m['league.new.label.logo']()}
          fallback={name.charAt(0) || "?"}
        />
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <Label htmlFor="timezone">{m['league.new.label.timezone']()}</Label>
        <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
          <SelectTrigger className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/24 focus-visible:border-ring">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="America/Sao_Paulo">{m['league.new.timezone.saoPaulo']()}</SelectItem>
            <SelectItem value="America/New_York">{m['league.new.timezone.newYork']()}</SelectItem>
            <SelectItem value="Europe/London">{m['league.new.timezone.london']()}</SelectItem>
            <SelectItem value="UTC">{m['league.new.timezone.utc']()}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        <Label className="font-medium text-sm">{m['league.new.label.sports']()}</Label>
        <p className="mt-0.5 text-muted-foreground text-xs">
          Selecione as modalidades que farão parte da competição.
        </p>

        <div className="mt-3 grid lg:grid-cols-2 xl:grid-cols-3 gap-2">
          {sports.data.map((sport) => {
            const checked = selectedSports.includes(sport.id);
            return (
              <label
                key={sport.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${checked
                  ? "border-foreground/30 bg-foreground/3"
                  : "border-border/60 bg-background/40 hover:border-border"
                  }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleSport(sport.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">
                    {sport.name}
                  </span>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    Incluir {sport.name.toLowerCase()} na grade da competição.
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${transferWindow
            ? "border-accent/40 bg-accent/4"
            : "border-border/60 bg-background/40 hover:border-border"
            }`}
        >
          <Checkbox
            checked={transferWindow}
            onCheckedChange={(checked) => setTransferWindow(checked === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Janela de transferência
              </span>
              {transferWindow ? (
                <Badge variant="secondary">
                  {m['common.status.active']()}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Permitir transferências de atletas entre delegações.
            </p>
          </div>
        </label>
      </div>

      {mutation.error instanceof ApiError && (
        <p className="mt-4 text-sm text-destructive">{mutation.error.message}</p>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-5">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {selectedSports.length} esporte{selectedSports.length === 1 ? "" : "s"} selecionado
          {selectedSports.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => navigate({ to: "/leagues" })}
          >
            {m['common.actions.cancel']()}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? "Criando..." : m['nav.createLeague']()}
          </Button>
        </div>
      </div>
    </form>
  );
}

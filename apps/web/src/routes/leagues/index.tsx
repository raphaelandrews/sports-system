import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trophy, Zap } from "lucide-react";
import { useState } from "react";

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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@sports-system/ui/components/dialog";
import { Input } from "@sports-system/ui/components/input";
import { Label } from "@sports-system/ui/components/label";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sports-system/ui/components/empty";
import { cn } from "@sports-system/ui/lib/utils";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { buildApiUrl } from "@/shared/lib/url";

export const Route = createFileRoute("/leagues/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(leagueListQueryOptions()),
  component: LeaguesPage,
});

function ShowcaseCreateDialog() {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"normal" | "speed">("normal");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (typeof document !== "undefined") {
        const match = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
        if (match) {
          headers["Authorization"] = `Bearer ${match.split("=")[1]}`;
        }
      }
      const res = await fetch(buildApiUrl("/admin/showcase-leagues"), {
        method: "POST",
        headers,
        body: JSON.stringify({ name: name.trim(), mode }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      window.location.href = `/leagues/${data.league_id}/dashboard`;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          Criar liga showcase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Liga Showcase</DialogTitle>
          <DialogDescription>
            Crie uma liga de demonstração com automação completa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="showcase-name">Nome da liga</Label>
            <Input
              id="showcase-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Liga de Demonstração"
            />
          </div>
          <div className="space-y-2">
            <Label>Modo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "normal" ? "default" : "outline"}
                onClick={() => setMode("normal")}
                size="sm"
                className="flex-1"
              >
                Normal (semanal)
              </Button>
              <Button
                type="button"
                variant={mode === "speed" ? "default" : "outline"}
                onClick={() => setMode("speed")}
                size="sm"
                className="flex-1"
              >
                Speed (10 min)
              </Button>
            </div>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={!name.trim() || loading} className="w-full">
          {loading ? "Criando..." : "Criar liga showcase"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function LeaguesPage() {
  const { session } = Route.useRouteContext();
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());
  const isSuperadmin = session?.role === "SUPERADMIN";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Ligas</h1>
        <div className="flex items-center gap-2">
          {isSuperadmin && <ShowcaseCreateDialog />}
          <Link to="/leagues/new" className={cn(buttonVariants())}>
            Criar liga
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league) => (
          <Card key={league.id} className="rounded-xl bg-surface-1 transition-colors ring-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{league.name}</CardTitle>
                {league.is_showcase && <Badge variant="default">Showcase</Badge>}
              </div>
              <CardDescription>{league.slug}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {league.description ?? "Sem descrição"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{league.member_count} membros</span>
                <span>·</span>
                <span>{league.timezone}</span>
              </div>
              <Link
                to="/leagues/$leagueId"
                params={{ leagueId: String(league.id) }}
                className={cn(buttonVariants({ variant: "default" }), "mt-4 w-full")}
              >
                Ver liga
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {leagues.length === 0 && (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Nenhuma liga cadastrada</EmptyTitle>
            <EmptyDescription>Crie a primeira liga para começar.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/leagues/new" className={cn(buttonVariants())}>
              Criar liga
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}

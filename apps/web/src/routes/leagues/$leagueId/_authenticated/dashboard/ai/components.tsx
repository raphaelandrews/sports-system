import type * as React from "react";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";

export function HeroStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

export function GeneratorCard({
  badge,
  title,
  description,
  icon,
  controls,
  footer,
}: {
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  controls: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Card className="border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.12))]">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">{badge}</Badge>
          <div className="rounded-full border border-border/70 bg-background/80 p-2 text-muted-foreground">
            {icon}
          </div>
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {controls}
        {footer}
      </CardContent>
    </Card>
  );
}

export function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

export function MetricStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}

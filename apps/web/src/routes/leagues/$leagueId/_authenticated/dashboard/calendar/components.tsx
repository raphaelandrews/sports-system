import * as React from "react";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sports-system/ui/components/popover";
import { Separator } from "@sports-system/ui/components/separator";
import type { CompetitionResponse } from "@/types/competitions";

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

export function orderCompetitions(competitions: CompetitionResponse[]) {
  return [...competitions].sort((a, b) => b.number - a.number);
}

export function useWeekSelection(defaultWeekId?: number) {
  const [selectedWeekId, setSelectedWeekId] = React.useState<number | undefined>(defaultWeekId);

  React.useEffect(() => {
    if (selectedWeekId == null && defaultWeekId != null) {
      setSelectedWeekId(defaultWeekId);
    }
  }, [defaultWeekId, selectedWeekId]);

  return [selectedWeekId, setSelectedWeekId] as const;
}

export function FacetButton({
  label,
  icon,
  count,
  chips,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  chips?: string[];
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={
              count && count > 0
                ? "border-foreground/20 bg-foreground/5"
                : "border-dashed"
            }
          >
            {icon}
            {label}
            {count && count > 0 ? (
              <>
                <Separator orientation="vertical" className="mx-1 h-3" />
                {chips && chips.length <= 2 ? (
                  chips.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      {c}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px]"
                  >
                    {count}
                  </Badge>
                )}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent className="w-60 p-0" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

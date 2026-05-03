import { Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";

import { Card } from "@sports-system/ui/components/card";
import leaguePlaceholder from "@/assets/league-placeholder.webp";

interface LeagueCardProps {
  id: number;
  name: string;
  logoUrl: string | null | undefined;
  memberCount: number;
  href: string;
}

export function LeagueCard({ id, name, logoUrl, memberCount, href }: LeagueCardProps) {
  return (
    <Link
      key={id}
      to={href}
      params={{ leagueId: String(id) }}
      className="block w-full"
    >
      <Card className="group/card relative h-96 w-full overflow-hidden rounded-xl border-0 py-0 gap-0">
        <img
          src={logoUrl ?? leaguePlaceholder}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-110"
        />

        {/* Background fade effects */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-background/80 to-transparent transition-opacity duration-500 group-hover/card:from-background/90" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-end p-6">
          <h3 className="text-xl font-bold text-foreground">{name}</h3>
          <p className="mt-2 text-sm font-medium text-foreground/90 flex items-center gap-1">
            <Users className="size-3.5" />
            {memberCount} membros
          </p>
          <div className="mt-3 inline-flex items-center gap-2 self-start rounded-md bg-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors group-hover/card:bg-foreground/30">
            Ver liga
            <ArrowRight className="size-4" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

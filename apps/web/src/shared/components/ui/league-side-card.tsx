import { Link } from "@tanstack/react-router";

import leaguePlaceholder from "@/assets/league-placeholder.webp";
import * as m from "@/paraglide/messages";

interface LeagueSideCardProps {
  id: number;
  name: string;
  logoUrl: string | null | undefined;
  memberCount: number;
  href: string;
}

export function LeagueSideCard({ id, name, logoUrl, memberCount, href }: LeagueSideCardProps) {
  return (
    <Link
      key={id}
      to={href}
      params={{ leagueId: String(id) }}
      className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-input"
    >
      <div className="h-10 w-8 shrink-0 overflow-hidden rounded bg-input">
        <img
          src={logoUrl ?? leaguePlaceholder}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        <span className="text-[11px] text-placeholder">
          {memberCount} {m["league.card.members"]()}
        </span>
      </div>
    </Link>
  );
}

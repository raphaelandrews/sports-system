import { Link } from "@tanstack/react-router";

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
      className="group relative cursor-pointer overflow-hidden rounded-lg lg:rounded-xl bg-input transition-transform hover:scale-105 animate-[gridCardIn_300ms_ease-out_both]"
    >
      <div className="aspect-3/4">
        <img
          src={logoUrl ?? leaguePlaceholder}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-x-0 top-0 bg-linear-to-b from-black/70 to-transparent px-2 pt-1.5 pb-4">
        <span className="line-clamp-2 text-sm font-bold leading-tight text-white drop-shadow-sm">{name}</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm font-semibold text-white/70">{memberCount} membros</span>
        </div>
      </div>
    </Link >
  );
}
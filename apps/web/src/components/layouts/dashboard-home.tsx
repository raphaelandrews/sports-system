import type { Session } from "@/types/auth";
import type { LeagueMemberResponse } from "@/types/leagues";

import { AdminDashboard } from "@/components/layouts/admin-dashboard";
import { AthleteCoachDashboard } from "@/components/layouts/athlete-coach-dashboard";
import { ChiefDashboard } from "@/components/layouts/chief-dashboard";

export function DashboardHome({
  session,
  leagueId,
  membership,
}: {
  session: Session;
  leagueId: number;
  membership: LeagueMemberResponse;
}) {
  if (membership.role === "LEAGUE_ADMIN") return <AdminDashboard leagueId={leagueId} />;
  if (membership.role === "CHIEF") return <ChiefDashboard session={session} leagueId={leagueId} />;
  return <AthleteCoachDashboard session={session} leagueId={leagueId} />;
}

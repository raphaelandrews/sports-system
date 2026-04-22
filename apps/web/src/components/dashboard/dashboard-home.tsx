import type { Session } from "@/types/auth"

import { AdminDashboard } from "./admin-dashboard"
import { AthleteCoachDashboard } from "./athlete-coach-dashboard"
import { ChiefDashboard } from "./chief-dashboard"

export function DashboardHome({ session }: { session: Session }) {
  if (session.role === "ADMIN") return <AdminDashboard />
  if (session.role === "CHIEF") return <ChiefDashboard session={session} />
  return <AthleteCoachDashboard session={session} />
}

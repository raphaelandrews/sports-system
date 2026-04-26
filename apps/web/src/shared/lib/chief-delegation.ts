import type { Session } from "@/types/auth";
import type { DelegationSummary } from "@/types/delegations";

const BUSINESS_TIMEZONE = "America/Sao_Paulo";

export function findManagedDelegation(
  delegations: DelegationSummary[],
  session: Session,
): DelegationSummary | null {
  if (session.role !== "CHIEF" && session.role !== "ADMIN") {
    return null;
  }

  return delegations.find((delegation) => delegation.chief_id === session.id) ?? null;
}

export function isTransferWindowOpen(date = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: BUSINESS_TIMEZONE,
  }).format(date);

  return weekday === "Mon";
}

export function getTransferWindowMessage(date = new Date()): string {
  if (isTransferWindowOpen(date)) {
    return "Janela aberta hoje em America/Sao_Paulo.";
  }

  return "Transferências liberadas apenas às segundas em America/Sao_Paulo.";
}

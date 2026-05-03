import type { Session } from "@/types/auth";
import type { DelegationSummary } from "@/types/delegations";

import * as m from "@/paraglide/messages";

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
    return m['transferWindow.openMessage']();
  }

  return m['transferWindow.closedMessage']();
}

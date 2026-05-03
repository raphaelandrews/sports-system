import { Badge } from "@sports-system/ui/components/badge";

import type { EnrollmentStatus } from "@/types/enrollments";
import * as m from "@/paraglide/messages";

const variantByStatus: Record<
  EnrollmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

const labelByStatus: Record<EnrollmentStatus, string> = {
  PENDING: m["common.status.pending"](),
  APPROVED: m["common.status.approved"](),
  REJECTED: m["common.status.rejected"](),
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  return <Badge variant={variantByStatus[status]}>{labelByStatus[status]}</Badge>;
}

import { Badge } from "@sports-system/ui/components/badge";

import type { EnrollmentStatus } from "@/types/enrollments";

const variantByStatus: Record<
  EnrollmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

const labelByStatus: Record<EnrollmentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

export function EnrollmentStatusBadge({
  status,
}: {
  status: EnrollmentStatus;
}) {
  return <Badge variant={variantByStatus[status]}>{labelByStatus[status]}</Badge>;
}

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface EnrollmentResponse {
  id: number
  athlete_id: number
  event_id: number
  delegation_id: number
  status: EnrollmentStatus
  validation_message: string | null
  created_at: string
}

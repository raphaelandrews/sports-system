import { z } from "zod";

import { NotificationType } from "./enums.js";
export { NotificationType };

export const NotificationResponse = z.object({
  id: z.number(),
  user_id: z.number(),
  notification_type: NotificationType,
  payload: z.record(z.string(), z.unknown()),
  read: z.boolean(),
  created_at: z.string().datetime(),
});
export type NotificationResponse = z.infer<typeof NotificationResponse>;

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.string().url(),
    VITE_TIMEZONE: z.string().default("America/Sao_Paulo"),
  },
  runtimeEnvStrict: {
    VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
    VITE_TIMEZONE: import.meta.env.VITE_TIMEZONE,
  },
  emptyStringAsUndefined: true,
});

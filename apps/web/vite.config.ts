import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const webRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  // Force Vite to read only apps/web/.env* for the web app.
  envDir: resolve(webRoot),
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // Infra/deploy bindings belong to build/deploy, not local dev.
    ...(command === "build" ? [alchemy()] : []),
  ] as PluginOption[],
  server: {
    port: 3001,
  },
}));

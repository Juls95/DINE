import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { SECURITY_HEADERS } from "./src/config/security-headers";

export default defineConfig({
  // render.yaml carries the same headers; a test keeps both in sync so `pnpm preview` reproduces production.
  preview: { headers: SECURITY_HEADERS },
  root: "site",
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../dist",
    chunkSizeWarningLimit: 900,
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        minify: { compress: { dropConsole: true, dropDebugger: true } },
      },
    },
  },
});

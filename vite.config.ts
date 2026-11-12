import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Keep in sync with render.yaml so `pnpm preview` reproduces production. */
const CSP = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'";

export default defineConfig({
  preview: { headers: { "Content-Security-Policy": CSP } },
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

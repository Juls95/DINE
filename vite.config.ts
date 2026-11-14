import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { SECURITY_HEADERS } from "./src/config/security-headers";
import { isAllowedSignupEndpoint } from "./src/schemas/signup";

/** Fail the build on a bad endpoint instead of shipping a form that posts somewhere unexpected. Empty = sign-ups closed. */
function signupEndpoint(): string {
  const value = (process.env.SIGNUP_ENDPOINT ?? "").trim();
  if (value && !isAllowedSignupEndpoint(value)) throw new Error("SIGNUP_ENDPOINT must look like https://formspree.io/f/<id>");
  return value;
}

export default defineConfig({
  // render.yaml carries the same headers; a test keeps both in sync so `pnpm preview` reproduces production.
  preview: { headers: SECURITY_HEADERS },
  root: "site",
  base: "./",
  plugins: [react()],
  define: { __SIGNUP_ENDPOINT__: JSON.stringify(signupEndpoint()) },
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

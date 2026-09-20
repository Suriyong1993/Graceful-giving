import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["client/**", "jsdom"],
      ["server/**", "node"],
    ],
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/**/*.{test,spec}.{ts,tsx}",
    ],
    // Must run before each test file's modules load: it assigns the throwaway
    // CHURCH_ID that server/db.ts reads at module scope.
    setupFiles: ["server/test/setupTenant.ts", "client/test/setup.ts"],
  },
});

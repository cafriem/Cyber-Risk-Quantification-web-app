import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    env: {
      DATABASE_URL: "file:/tmp/northstar-phase11.db",
    },
    setupFiles: ["src/lib/testing/integration-setup.ts"],
    pool: "forks",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

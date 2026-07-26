import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "../client/src") },

      { find: "react", replacement: path.resolve(__dirname, "node_modules/react") },
      { find: "react-dom", replacement: path.resolve(__dirname, "node_modules/react-dom") },
      { find: "react/jsx-runtime", replacement: path.resolve(__dirname, "node_modules/react/jsx-runtime") },
      { find: "react/jsx-dev-runtime", replacement: path.resolve(__dirname, "node_modules/react/jsx-dev-runtime") },
      { find: "react-dom/client", replacement: path.resolve(__dirname, "node_modules/react-dom/client") },
      { find: "lucide-react", replacement: path.resolve(__dirname, "node_modules/lucide-react") },

      { find: "clsx", replacement: path.resolve(__dirname, "node_modules/clsx") },
      { find: "tailwind-merge", replacement: path.resolve(__dirname, "node_modules/tailwind-merge") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./frontend/setup.ts"],
    include: ["frontend/**/*.test.{ts,tsx}"],
    css: false,
  },
});

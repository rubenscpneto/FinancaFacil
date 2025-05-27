import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"; // Removed Replit plugin

export default defineConfig({
  plugins: [
    react(),
    // runtimeErrorOverlay(), // Removed Replit plugin
    // ...(process.env.NODE_ENV !== "production" && // Removed Replit plugin block
    // process.env.REPL_ID !== undefined
    //   ? [
    //       await import("@replit/vite-plugin-cartographer").then((m) =>
    //         m.cartographer(),
    //       ),
    //     ]
    //   : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});

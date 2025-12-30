import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Windows-optimized configuration for stable dev server operation
export default defineConfig({
  plugins: [react()],
  base: "/policy-analyzer/",
  build: {
    outDir: "dist",
    sourcemap: true,
    // Enable module preloading for dynamic imports
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-worker": ["pdfjs-dist"],
          "react-vendor": ["react", "react-dom"],
          "pdf-export": ["jspdf"],
          "ui-vendor": ["dompurify", "react-markdown"],
        },
      },
    },
    // Strip console.log and debugger in production builds
    minify: "esbuild",
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
    exclude: ["**/e2e/**", "**/playwright/**", "**/node_modules/**"],
  },
  server: {
    port: 8765,
    host: "0.0.0.0",
    open: false,
    strictPort: false,
    // HMR disabled to prevent Playwright browser automation crashes
    // The WebSocket connection for HMR causes server instability with Playwright MCP
    hmr: false,
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**", "**/dist/**", "**/context_portal/**", "**/.serena/**", "**/test-results/**", "**/playwright-report/**"],
    },
  },
  preview: {
    port: 8766,
    host: "localhost",
    open: false,
    strictPort: false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "dompurify"],
    esbuildOptions: {
      target: "esnext",
    },
  },
});

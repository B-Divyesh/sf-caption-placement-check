import { defineConfig } from "vite";

export default defineConfig({
  root: "app",
  base: "./",
  publicDir: "../public",
  clearScreen: false,
  build: {
    outDir: "../dist/app",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: true
  },
  server: { strictPort: true, port: 1420 }
});

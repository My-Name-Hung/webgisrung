import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      generateScopedName: "[local]",
      localsConvention: "camelCase",
    },
    postcss: {
      plugins: [autoprefixer()],
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Bỏ assetFileNames → dùng mặc định
        chunkFileNames: "assets/js/[name].js",
        entryFileNames: "assets/js/[name].js",
      },
    },
  },
});

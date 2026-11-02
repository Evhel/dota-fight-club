import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/dota-fight-club/",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  define: { "import.meta.env.VITE_STATIC_SITE": JSON.stringify("true") },
  build: { outDir: "dist-pages", rollupOptions: { input: "index.pages.html" } },
});

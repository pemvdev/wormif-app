import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      persistState: process.env.WORMIF_TEST_STATE_PATH
        ? { path: process.env.WORMIF_TEST_STATE_PATH }
        : true,
    }),
  ],
	  server: {
	    allowedHosts: true,
	  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@Front-end/": `${path.resolve(__dirname, "src/3.Arquitetura/Front-end")}/`,
    },
  },
});

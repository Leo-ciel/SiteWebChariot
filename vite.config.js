import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // écoute sur toutes les interfaces réseau
    port: 5173,
  },
});

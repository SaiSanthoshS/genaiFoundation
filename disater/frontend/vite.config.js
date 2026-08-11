import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Simple dev server config. The frontend calls the Flask backend directly
// at http://localhost:5000 (see src/api.js) so no proxy setup is required.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    // /mnt/c edits from Windows don't fire inotify in WSL — poll instead
    watch: {
      usePolling: true,
      interval: 500,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8010",
        changeOrigin: true,
      },
    },
  },
});

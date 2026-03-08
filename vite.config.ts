import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),

    VitePWA({
      registerType: "autoUpdate", // Atualiza SW automaticamente
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "favicon_16x16.png",
        "favicon_32x32.png",
        "favicon_48x48.png",
        "favicon_150x150.png",
        "favicon_192x192.png",
        "favicon_512x512.png",
        "masked-icon.svg" // Mantido caso seja usado, mesmo que não explicitamente no HTML/manifest.json
      ],
      manifest: {
        name: "Calendário Prontidão",
        short_name: "Prontidão",
        description: "Calendário moderno e responsivo dos Bombeiros de Agudos.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#b91c1c",
        orientation: "portrait",
        scope: "/",
        categories: ["productivity", "utilities"],
        lang: "pt-BR",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icons/icon-180x180.png",
            sizes: "180x180",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,ttf}"], // Cache de assets
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['workbox-window'],
    },
  },
}));
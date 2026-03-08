import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ToastProvider } from "@/contexts/ToastProvider";

// Import global styles (ajuste conforme seu projeto)
import "./index.css";

// 👉 Importa o registrador de Service Worker gerado pelo vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";

// Registra o Service Worker com atualização automática
const updateSW = registerSW({
  onNeedRefresh() {
    // Opcional: você pode exibir um modal informando que há uma nova versão
    console.log("Nova versão disponível. Atualize a página para aplicar as mudanças.");
  },
  onOfflineReady() {
    // Opcional: mensagem quando o app estiver pronto para uso offline
    console.log("App pronto para uso offline.");
  },
});

// Monta o React normalmente
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

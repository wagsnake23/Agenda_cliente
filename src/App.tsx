import React, { Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ToastProvider } from '@/contexts/ToastProvider';

import { CalendarModeProvider } from "@/hooks/use-calendar-mode";
import { CalendarEventsProvider } from "@/contexts/CalendarEventsContext";

import GlobalAgendamentoModal from "@/components/GlobalAgendamentoModal";

// Lazy loaded pages (code splitting)
const AuthPage = React.lazy(() => import("./pages/Auth"));
const MeuPerfil = React.lazy(() => import("./pages/MeuPerfil"));
const AgendamentosPage = React.lazy(() => import("./pages/Agendamentos"));
const UsuariosPage = React.lazy(() => import("./pages/Usuarios"));
const AdminCalendario = React.lazy(() => import("./pages/AdminCalendario"));

const queryClient = new QueryClient();

// Loading fallback for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen bg-[#EFF3F6] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium text-sm">Carregando...</p>
    </div>
  </div>
);

// Root layout wrapper com todos os Providers
const AppProviders = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CalendarModeProvider>
          <CalendarEventsProvider>
            <GlobalAgendamentoModal />
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </CalendarEventsProvider>
        </CalendarModeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const router = createBrowserRouter(
  [
    {
      element: <AppProviders />,
      children: [
        { path: "/", element: <Index /> },
        { path: "/auth", element: <AuthPage /> },
        {
          path: "/meu-perfil",
          element: <ProtectedRoute><MeuPerfil /></ProtectedRoute>,
        },
        {
          path: "/agendamentos",
          element: <ProtectedRoute><AgendamentosPage /></ProtectedRoute>,
        },
        {
          path: "/usuarios",
          element: <ProtectedRoute adminOnly><UsuariosPage /></ProtectedRoute>,
        },
        {
          path: "/admin/calendario",
          element: <ProtectedRoute adminOnly><AdminCalendario /></ProtectedRoute>,
        },
        { path: "*", element: <NotFound /> },
      ],
    },
  ]
);

const App = () => <RouterProvider router={router} />;

export default App;

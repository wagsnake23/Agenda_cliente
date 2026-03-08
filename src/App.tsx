import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import MeuPerfil from "./pages/MeuPerfil";
import AgendamentosPage from "./pages/Agendamentos";
import UsuariosPage from "./pages/Usuarios";
import { ToastProvider } from '@/contexts/ToastProvider';

import { CalendarModeProvider } from "@/hooks/use-calendar-mode";
import { CalendarEventsProvider } from "@/context/CalendarEventsContext";
import AdminCalendario from "./pages/AdminCalendario";

import GlobalAgendamentoModal from "@/components/GlobalAgendamentoModal";

const queryClient = new QueryClient();

// Root layout wrapper com todos os Providers
const AppProviders = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CalendarModeProvider>
          <CalendarEventsProvider>
            <GlobalAgendamentoModal />
            <Outlet />
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
          element: <ProtectedRoute><AdminCalendario /></ProtectedRoute>,
        },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  } as any
);

const App = () => <RouterProvider router={router} />;

export default App;

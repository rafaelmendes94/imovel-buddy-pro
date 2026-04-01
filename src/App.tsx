import { lazy, Suspense, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { DEFAULT_PROTECTED_ROUTE } from "@/config/coreNavigation";

// Inline page loader – lightweight, doesn't cover the whole screen
const PageLoader = () => (
  <div className="flex items-center justify-center py-32">
    <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
  </div>
);

// Wrap lazy component with its own Suspense so the layout stays mounted
const S = (node: ReactNode) => <Suspense fallback={<PageLoader />}>{node}</Suspense>;

// Public pages (lazy)
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BrokerSite = lazy(() => import("./pages/BrokerSite"));
const EmpreendimentoDetail = lazy(() => import("./pages/EmpreendimentoDetail"));
const PartnerDetail = lazy(() => import("./pages/PartnerDetail"));
const ConstrutoraSite = lazy(() => import("./pages/ConstrutoraSite"));

// Broker pages (lazy)
const BrokerAssinatura = lazy(() => import("./pages/broker/BrokerAssinatura"));

// Core pages (lazy)
const Properties = lazy(() => import("./pages/Properties"));
import Buildings from "./pages/Buildings";
const BuildingDetail = lazy(() => import("./pages/BuildingDetail"));
const Condominiums = lazy(() => import("./pages/Condominiums"));
const CondominiumDetail = lazy(() => import("./pages/CondominiumDetail"));
const Site = lazy(() => import("./pages/Site"));
const CadastroImovel = lazy(() => import("./pages/CadastroImovel"));
const EditarImovel = lazy(() => import("./pages/EditarImovel"));
const Parceiros = lazy(() => import("./pages/Parceiros"));
const BrickStore = lazy(() => import("./pages/BrickStore"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={S(<Site />)} />
            <Route path="/login" element={S(<Login />)} />
            <Route path="/registro" element={S(<Registro />)} />
            <Route path="/corretor/:slug" element={S(<BrokerSite />)} />
            <Route path="/empreendimento/:slug" element={S(<EmpreendimentoDetail />)} />
            <Route path="/parceiro/:slug" element={S(<PartnerDetail />)} />
            <Route path="/parceiros" element={S(<Parceiros />)} />
            <Route path="/construtora/:slug" element={S(<ConstrutoraSite />)} />
            <Route path="/brick-store" element={S(<BrickStore />)} />

            {/* Subscription route */}
            <Route path="/painel/assinatura" element={<AuthGuard requiredRoles={["broker"]} allowBlocked>{S(<BrokerAssinatura />)}</AuthGuard>} />

            {/* Core routes */}
            <Route path="/imoveis" element={<AuthGuard>{S(<Properties />)}</AuthGuard>} />
            <Route path="/edificios" element={<AuthGuard>{S(<Buildings />)}</AuthGuard>} />
            <Route path="/edificios/:id" element={<AuthGuard>{S(<BuildingDetail />)}</AuthGuard>} />
            <Route path="/condominios" element={<AuthGuard>{S(<Condominiums />)}</AuthGuard>} />
            <Route path="/condominios/:id" element={<AuthGuard>{S(<CondominiumDetail />)}</AuthGuard>} />
            <Route path="/cadastro-imovel" element={<AuthGuard>{S(<CadastroImovel />)}</AuthGuard>} />
            <Route path="/editar-imovel/:id" element={<AuthGuard>{S(<EditarImovel />)}</AuthGuard>} />

            {/* Legacy entry redirects */}
            <Route path="/dashboard" element={<Navigate to={DEFAULT_PROTECTED_ROUTE} replace />} />
            <Route path="/painel" element={<Navigate to={DEFAULT_PROTECTED_ROUTE} replace />} />
            <Route path="/admin/dashboard" element={<Navigate to={DEFAULT_PROTECTED_ROUTE} replace />} />

            <Route path="*" element={S(<NotFound />)} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

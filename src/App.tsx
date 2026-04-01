import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";

// Public pages
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import NotFound from "./pages/NotFound";
import BrokerSite from "./pages/BrokerSite";
import EmpreendimentoDetail from "./pages/EmpreendimentoDetail";
import PartnerDetail from "./pages/PartnerDetail";
import ConstrutoraSite from "./pages/ConstrutoraSite";

// Admin pages (lazy)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminFuncionarios = lazy(() => import("./pages/admin/AdminFuncionarios"));
const AdminClientes = lazy(() => import("./pages/admin/AdminClientes"));
const AdminPlanos = lazy(() => import("./pages/admin/AdminPlanos"));
const AdminCargos = lazy(() => import("./pages/admin/AdminCargos"));
const AdminBrick = lazy(() => import("./pages/admin/AdminBrick"));

// Broker pages (lazy)
const BrokerDashboard = lazy(() => import("./pages/broker/BrokerDashboard"));
const BrokerAssinatura = lazy(() => import("./pages/broker/BrokerAssinatura"));

// Legacy pages (lazy)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const Buildings = lazy(() => import("./pages/Buildings"));
const BuildingDetail = lazy(() => import("./pages/BuildingDetail"));
const Condominiums = lazy(() => import("./pages/Condominiums"));
const CondominiumDetail = lazy(() => import("./pages/CondominiumDetail"));
const Maps = lazy(() => import("./pages/Maps"));
const CityPhotos = lazy(() => import("./pages/CityPhotos"));
const Brokers = lazy(() => import("./pages/Brokers"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Site = lazy(() => import("./pages/Site"));
const AllProperties = lazy(() => import("./pages/AllProperties"));
const RankingPage = lazy(() => import("./pages/RankingPage"));
const Avaliacoes = lazy(() => import("./pages/Avaliacoes"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Tabelas = lazy(() => import("./pages/Tabelas"));
const Contratos = lazy(() => import("./pages/Contratos"));
const VideoMaker = lazy(() => import("./pages/VideoMaker"));
const Imobiliarias = lazy(() => import("./pages/Imobiliarias"));
const CadastroImovel = lazy(() => import("./pages/CadastroImovel"));
const EditarImovel = lazy(() => import("./pages/EditarImovel"));
const Parceiros = lazy(() => import("./pages/Parceiros"));
const Construtoras = lazy(() => import("./pages/Construtoras"));
const ConstrutoraDetail = lazy(() => import("./pages/ConstrutoraDetail"));
const ConstrutoraAvaliacoes = lazy(() => import("./pages/ConstrutoraAvaliacoes"));
const Brick = lazy(() => import("./pages/Brick"));
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
            <Route path="/" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}><Site /></Suspense>} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/corretor/:slug" element={<BrokerSite />} />
            <Route path="/empreendimento/:slug" element={<EmpreendimentoDetail />} />
            <Route path="/parceiro/:slug" element={<PartnerDetail />} />
            <Route path="/parceiros" element={<Parceiros />} />
            <Route path="/construtora/:slug" element={<ConstrutoraSite />} />
            <Route path="/brick-store" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}><BrickStore /></Suspense>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><AdminDashboard /></AuthGuard>} />
            <Route path="/admin/funcionarios" element={<AuthGuard requiredRoles={["super_admin"]}><AdminFuncionarios /></AuthGuard>} />
            <Route path="/admin/cargos" element={<AuthGuard requiredRoles={["super_admin"]}><AdminCargos /></AuthGuard>} />
            <Route path="/admin/clientes" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><AdminClientes /></AuthGuard>} />
            <Route path="/admin/planos" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><AdminPlanos /></AuthGuard>} />
            <Route path="/admin/brick" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><AdminBrick /></AuthGuard>} />

            {/* Broker routes */}
            <Route path="/painel" element={<AuthGuard requiredRoles={["broker"]}><BrokerDashboard /></AuthGuard>} />
            <Route path="/painel/assinatura" element={<AuthGuard requiredRoles={["broker"]} allowBlocked><BrokerAssinatura /></AuthGuard>} />

            {/* Legacy routes - now require auth */}
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/imoveis" element={<AuthGuard><Properties /></AuthGuard>} />
            <Route path="/edificios" element={<AuthGuard><Buildings /></AuthGuard>} />
            <Route path="/edificios/:id" element={<AuthGuard><BuildingDetail /></AuthGuard>} />
            <Route path="/condominios" element={<AuthGuard><Condominiums /></AuthGuard>} />
            <Route path="/condominios/:id" element={<AuthGuard><CondominiumDetail /></AuthGuard>} />
            <Route path="/mapas" element={<AuthGuard><Maps /></AuthGuard>} />
            <Route path="/fotos-cidade" element={<AuthGuard><CityPhotos /></AuthGuard>} />
            <Route path="/corretores" element={<AuthGuard><Brokers /></AuthGuard>} />
            <Route path="/relatorios" element={<AuthGuard><Reports /></AuthGuard>} />
            <Route path="/configuracoes" element={<AuthGuard><Settings /></AuthGuard>} />
            <Route path="/site-editor" element={<AuthGuard><Site /></AuthGuard>} />
            <Route path="/todos-imoveis" element={<AuthGuard><AllProperties /></AuthGuard>} />
            <Route path="/ranking" element={<AuthGuard><RankingPage /></AuthGuard>} />
            <Route path="/avaliacoes" element={<AuthGuard><Avaliacoes /></AuthGuard>} />
            <Route path="/financeiro" element={<AuthGuard><Financeiro /></AuthGuard>} />
            <Route path="/tabelas" element={<AuthGuard><Tabelas /></AuthGuard>} />
            <Route path="/contratos" element={<AuthGuard><Contratos /></AuthGuard>} />
            <Route path="/videomaker" element={<AuthGuard><VideoMaker /></AuthGuard>} />
            <Route path="/imobiliarias" element={<AuthGuard><Imobiliarias /></AuthGuard>} />
            <Route path="/cadastro-imovel" element={<AuthGuard><CadastroImovel /></AuthGuard>} />
            <Route path="/editar-imovel/:id" element={<AuthGuard><EditarImovel /></AuthGuard>} />
            <Route path="/construtoras" element={<AuthGuard><Construtoras /></AuthGuard>} />
            <Route path="/construtoras/:id" element={<AuthGuard><ConstrutoraDetail /></AuthGuard>} />
            <Route path="/construtoras/:id/avaliacoes" element={<AuthGuard><ConstrutoraAvaliacoes /></AuthGuard>} />
            <Route path="/brick" element={<AuthGuard><Brick /></AuthGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

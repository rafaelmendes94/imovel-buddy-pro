import { lazy, Suspense, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { DEFAULT_PROTECTED_ROUTE } from "@/config/coreNavigation";

const PageLoader = () => (
  <div className="flex items-center justify-center py-32">
    <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
  </div>
);

const S = (node: ReactNode) => <Suspense fallback={<PageLoader />}>{node}</Suspense>;

// Public pages
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BrokerSite = lazy(() => import("./pages/BrokerSite"));
const EmpreendimentoDetail = lazy(() => import("./pages/EmpreendimentoDetail"));
const PartnerDetail = lazy(() => import("./pages/PartnerDetail"));
const ConstrutoraSite = lazy(() => import("./pages/ConstrutoraSite"));
const SitePage = lazy(() => import("./pages/Site"));
const BrickStore = lazy(() => import("./pages/BrickStore"));
const AllProperties = lazy(() => import("./pages/AllProperties"));
const Parceiros = lazy(() => import("./pages/Parceiros"));

// Core protected pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const Buildings = lazy(() => import("./pages/Buildings"));
const BuildingDetail = lazy(() => import("./pages/BuildingDetail"));
const Condominiums = lazy(() => import("./pages/Condominiums"));
const CondominiumDetail = lazy(() => import("./pages/CondominiumDetail"));
const CadastroImovel = lazy(() => import("./pages/CadastroImovel"));
const EditarImovel = lazy(() => import("./pages/EditarImovel"));
const Site = lazy(() => import("./pages/Index"));
const Avaliacoes = lazy(() => import("./pages/Avaliacoes"));
const Brokers = lazy(() => import("./pages/Brokers"));
const ParceirosPanel = lazy(() => import("./pages/Parceiros"));
const Construtoras = lazy(() => import("./pages/Construtoras"));
const ConstrutoraDetail = lazy(() => import("./pages/ConstrutoraDetail"));
const ConstrutoraAvaliacoes = lazy(() => import("./pages/ConstrutoraAvaliacoes"));
const Imobiliarias = lazy(() => import("./pages/Imobiliarias"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Reports = lazy(() => import("./pages/Reports"));
const Tabelas = lazy(() => import("./pages/Tabelas"));
const Maps = lazy(() => import("./pages/Maps"));
const CityPhotos = lazy(() => import("./pages/CityPhotos"));
const VideoMaker = lazy(() => import("./pages/VideoMaker"));
const Brick = lazy(() => import("./pages/Brick"));
const RankingPage = lazy(() => import("./pages/RankingPage"));
const Settings = lazy(() => import("./pages/Settings"));

// Broker pages
const BrokerAssinatura = lazy(() => import("./pages/broker/BrokerAssinatura"));
const BrokerDashboard = lazy(() => import("./pages/broker/BrokerDashboard"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminFuncionarios = lazy(() => import("./pages/admin/AdminFuncionarios"));
const AdminCargos = lazy(() => import("./pages/admin/AdminCargos"));
const AdminClientes = lazy(() => import("./pages/admin/AdminClientes"));
const AdminPlanos = lazy(() => import("./pages/admin/AdminPlanos"));
const AdminBrick = lazy(() => import("./pages/admin/AdminBrick"));

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
            <Route path="/" element={S(<SitePage />)} />
            <Route path="/login" element={S(<Login />)} />
            <Route path="/registro" element={S(<Registro />)} />
            <Route path="/corretor/:slug" element={S(<BrokerSite />)} />
            <Route path="/empreendimento/:slug" element={S(<EmpreendimentoDetail />)} />
            <Route path="/parceiro/:slug" element={S(<PartnerDetail />)} />
            <Route path="/parceiros" element={S(<Parceiros />)} />
            <Route path="/construtora/:slug" element={S(<ConstrutoraSite />)} />
            <Route path="/brick-store" element={S(<BrickStore />)} />
            <Route path="/todos-imoveis" element={S(<AllProperties />)} />

            {/* Subscription route */}
            <Route path="/painel/assinatura" element={<AuthGuard requiredRoles={["broker"]} allowBlocked>{S(<BrokerAssinatura />)}</AuthGuard>} />

            {/* Core protected routes */}
            <Route path="/dashboard" element={<AuthGuard>{S(<Dashboard />)}</AuthGuard>} />
            <Route path="/imoveis" element={<AuthGuard>{S(<Properties />)}</AuthGuard>} />
            <Route path="/edificios" element={<AuthGuard>{S(<Buildings />)}</AuthGuard>} />
            <Route path="/edificios/:id" element={<AuthGuard>{S(<BuildingDetail />)}</AuthGuard>} />
            <Route path="/condominios" element={<AuthGuard>{S(<Condominiums />)}</AuthGuard>} />
            <Route path="/condominios/:id" element={<AuthGuard>{S(<CondominiumDetail />)}</AuthGuard>} />
            <Route path="/cadastro-imovel" element={<AuthGuard>{S(<CadastroImovel />)}</AuthGuard>} />
            <Route path="/editar-imovel/:id" element={<AuthGuard>{S(<EditarImovel />)}</AuthGuard>} />
            <Route path="/meu-site" element={<AuthGuard>{S(<Site />)}</AuthGuard>} />
            <Route path="/avaliacoes" element={<AuthGuard>{S(<Avaliacoes />)}</AuthGuard>} />
            <Route path="/corretores" element={<AuthGuard>{S(<Brokers />)}</AuthGuard>} />
            <Route path="/parceiros-painel" element={<AuthGuard>{S(<ParceirosPanel />)}</AuthGuard>} />
            <Route path="/construtoras" element={<AuthGuard>{S(<Construtoras />)}</AuthGuard>} />
            <Route path="/construtoras/:id" element={<AuthGuard>{S(<ConstrutoraDetail />)}</AuthGuard>} />
            <Route path="/construtora-avaliacoes" element={<AuthGuard>{S(<ConstrutoraAvaliacoes />)}</AuthGuard>} />
            <Route path="/imobiliarias" element={<AuthGuard>{S(<Imobiliarias />)}</AuthGuard>} />
            <Route path="/contratos" element={<AuthGuard>{S(<Contratos />)}</AuthGuard>} />
            <Route path="/financeiro" element={<AuthGuard>{S(<Financeiro />)}</AuthGuard>} />
            <Route path="/relatorios" element={<AuthGuard>{S(<Reports />)}</AuthGuard>} />
            <Route path="/tabelas" element={<AuthGuard>{S(<Tabelas />)}</AuthGuard>} />
            <Route path="/mapas" element={<AuthGuard>{S(<Maps />)}</AuthGuard>} />
            <Route path="/fotos-cidades" element={<AuthGuard>{S(<CityPhotos />)}</AuthGuard>} />
            <Route path="/video-maker" element={<AuthGuard>{S(<VideoMaker />)}</AuthGuard>} />
            <Route path="/brick" element={<AuthGuard>{S(<Brick />)}</AuthGuard>} />
            <Route path="/ranking" element={<AuthGuard>{S(<RankingPage />)}</AuthGuard>} />
            <Route path="/configuracoes" element={<AuthGuard>{S(<Settings />)}</AuthGuard>} />

            {/* Broker dashboard */}
            <Route path="/painel" element={<AuthGuard>{S(<BrokerDashboard />)}</AuthGuard>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminDashboard />)}</AuthGuard>} />
            <Route path="/admin/funcionarios" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminFuncionarios />)}</AuthGuard>} />
            <Route path="/admin/cargos" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminCargos />)}</AuthGuard>} />
            <Route path="/admin/clientes" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminClientes />)}</AuthGuard>} />
            <Route path="/admin/planos" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminPlanos />)}</AuthGuard>} />
            <Route path="/admin/brick" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminBrick />)}</AuthGuard>} />

            <Route path="*" element={S(<NotFound />)} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

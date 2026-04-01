import { lazy, Suspense, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";

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
            <Route path="/" element={S(<Site />)} />
            <Route path="/login" element={S(<Login />)} />
            <Route path="/registro" element={S(<Registro />)} />
            <Route path="/corretor/:slug" element={S(<BrokerSite />)} />
            <Route path="/empreendimento/:slug" element={S(<EmpreendimentoDetail />)} />
            <Route path="/parceiro/:slug" element={S(<PartnerDetail />)} />
            <Route path="/parceiros" element={S(<Parceiros />)} />
            <Route path="/construtora/:slug" element={S(<ConstrutoraSite />)} />
            <Route path="/brick-store" element={S(<BrickStore />)} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminDashboard />)}</AuthGuard>} />
            <Route path="/admin/funcionarios" element={<AuthGuard requiredRoles={["super_admin"]}>{S(<AdminFuncionarios />)}</AuthGuard>} />
            <Route path="/admin/cargos" element={<AuthGuard requiredRoles={["super_admin"]}>{S(<AdminCargos />)}</AuthGuard>} />
            <Route path="/admin/clientes" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminClientes />)}</AuthGuard>} />
            <Route path="/admin/planos" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminPlanos />)}</AuthGuard>} />
            <Route path="/admin/brick" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}>{S(<AdminBrick />)}</AuthGuard>} />

            {/* Broker routes */}
            <Route path="/painel" element={<AuthGuard requiredRoles={["broker"]}>{S(<BrokerDashboard />)}</AuthGuard>} />
            <Route path="/painel/assinatura" element={<AuthGuard requiredRoles={["broker"]} allowBlocked>{S(<BrokerAssinatura />)}</AuthGuard>} />

            {/* Legacy routes */}
            <Route path="/dashboard" element={<AuthGuard>{S(<Dashboard />)}</AuthGuard>} />
            <Route path="/imoveis" element={<AuthGuard>{S(<Properties />)}</AuthGuard>} />
            <Route path="/edificios" element={<AuthGuard>{S(<Buildings />)}</AuthGuard>} />
            <Route path="/edificios/:id" element={<AuthGuard>{S(<BuildingDetail />)}</AuthGuard>} />
            <Route path="/condominios" element={<AuthGuard>{S(<Condominiums />)}</AuthGuard>} />
            <Route path="/condominios/:id" element={<AuthGuard>{S(<CondominiumDetail />)}</AuthGuard>} />
            <Route path="/mapas" element={<AuthGuard>{S(<Maps />)}</AuthGuard>} />
            <Route path="/fotos-cidade" element={<AuthGuard>{S(<CityPhotos />)}</AuthGuard>} />
            <Route path="/corretores" element={<AuthGuard>{S(<Brokers />)}</AuthGuard>} />
            <Route path="/relatorios" element={<AuthGuard>{S(<Reports />)}</AuthGuard>} />
            <Route path="/configuracoes" element={<AuthGuard>{S(<Settings />)}</AuthGuard>} />
            <Route path="/site-editor" element={<AuthGuard>{S(<Site />)}</AuthGuard>} />
            <Route path="/todos-imoveis" element={<AuthGuard>{S(<AllProperties />)}</AuthGuard>} />
            <Route path="/ranking" element={<AuthGuard>{S(<RankingPage />)}</AuthGuard>} />
            <Route path="/avaliacoes" element={<AuthGuard>{S(<Avaliacoes />)}</AuthGuard>} />
            <Route path="/financeiro" element={<AuthGuard>{S(<Financeiro />)}</AuthGuard>} />
            <Route path="/tabelas" element={<AuthGuard>{S(<Tabelas />)}</AuthGuard>} />
            <Route path="/contratos" element={<AuthGuard>{S(<Contratos />)}</AuthGuard>} />
            <Route path="/videomaker" element={<AuthGuard>{S(<VideoMaker />)}</AuthGuard>} />
            <Route path="/imobiliarias" element={<AuthGuard>{S(<Imobiliarias />)}</AuthGuard>} />
            <Route path="/cadastro-imovel" element={<AuthGuard>{S(<CadastroImovel />)}</AuthGuard>} />
            <Route path="/editar-imovel/:id" element={<AuthGuard>{S(<EditarImovel />)}</AuthGuard>} />
            <Route path="/construtoras" element={<AuthGuard>{S(<Construtoras />)}</AuthGuard>} />
            <Route path="/construtoras/:id" element={<AuthGuard>{S(<ConstrutoraDetail />)}</AuthGuard>} />
            <Route path="/construtoras/:id/avaliacoes" element={<AuthGuard>{S(<ConstrutoraAvaliacoes />)}</AuthGuard>} />
            <Route path="/brick" element={<AuthGuard>{S(<Brick />)}</AuthGuard>} />

            <Route path="*" element={S(<NotFound />)} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

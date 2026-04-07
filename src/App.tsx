import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import Home from "./pages/Home";
import EmpreendimentoDetail from "./pages/EmpreendimentoDetail";
import PartnerDetail from "./pages/PartnerDetail";
import ConstrutoraSite from "./pages/ConstrutoraSite";

// Admin pages
// AdminDashboard removed - using unified Dashboard
import AdminFuncionarios from "./pages/admin/AdminFuncionarios";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminCargos from "./pages/admin/AdminCargos";
import AdminBrick from "./pages/admin/AdminBrick";
import AdminOpcoes from "./pages/admin/AdminOpcoes";
import AdminIA from "./pages/admin/AdminIA";

// Broker pages
import BrokerDashboard from "./pages/broker/BrokerDashboard";
import BrokerAssinatura from "./pages/broker/BrokerAssinatura";

// Legacy pages (used in broker panel context)
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Buildings from "./pages/Buildings";
import BuildingDetail from "./pages/BuildingDetail";
import Condominiums from "./pages/Condominiums";
import CondominiumDetail from "./pages/CondominiumDetail";
import Maps from "./pages/Maps";
import CityPhotos from "./pages/CityPhotos";
import Brokers from "./pages/Brokers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Site from "./pages/Site";
import AllProperties from "./pages/AllProperties";
import RankingPage from "./pages/RankingPage";
import Avaliacoes from "./pages/Avaliacoes";
import Financeiro from "./pages/Financeiro";
import Tabelas from "./pages/Tabelas";
import Contratos from "./pages/Contratos";
import VideoMaker from "./pages/VideoMaker";
import Imobiliarias from "./pages/Imobiliarias";
import CadastroImovel from "./pages/CadastroImovel";
import EditarImovel from "./pages/EditarImovel";
import Parceiros from "./pages/Parceiros";
import Construtoras from "./pages/Construtoras";
import ConstrutoraDetail from "./pages/ConstrutoraDetail";
import ConstrutoraAvaliacoes from "./pages/ConstrutoraAvaliacoes";
import Brick from "./pages/Brick";
import BrickStore from "./pages/BrickStore";
import Empreendimentos from "./pages/Empreendimentos";
import CadastroEdificio from "./pages/CadastroEdificio";
import CadastroCondominio from "./pages/CadastroCondominio";
import MapasCondominio from "./pages/MapasCondominio";
import CadastroEmpreendimento from "./pages/CadastroEmpreendimento";

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
            <Route path="/" element={<Site />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/corretor/:slug" element={<BrokerSite />} />
            <Route path="/empreendimento/:slug" element={<EmpreendimentoDetail />} />
            <Route path="/parceiro/:slug" element={<PartnerDetail />} />
            <Route path="/parceiros" element={<Parceiros />} />
            <Route path="/construtora/:slug" element={<ConstrutoraSite />} />
            <Route path="/site" element={<Site />} />
            <Route path="/brick-store" element={<BrickStore />} />

            {/* Admin routes */}
            
            <Route path="/admin/funcionarios" element={<AuthGuard requiredRoles={["super_admin"]}><AdminFuncionarios /></AuthGuard>} />
            <Route path="/admin/cargos" element={<AuthGuard requiredRoles={["super_admin"]}><AdminCargos /></AuthGuard>} />
            <Route path="/admin/clientes" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><AdminClientes /></AuthGuard>} />
            <Route path="/admin/planos" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><AdminPlanos /></AuthGuard>} />
            <Route path="/admin/brick" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><AdminBrick /></AuthGuard>} />
            <Route path="/admin/opcoes" element={<AuthGuard requiredRoles={["super_admin"]}><AdminOpcoes /></AuthGuard>} />
            <Route path="/admin/ia" element={<AuthGuard requiredRoles={["super_admin"]}><AdminIA /></AuthGuard>} />

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
            <Route path="/mapas-condominio" element={<AuthGuard><MapasCondominio /></AuthGuard>} />
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
            <Route path="/empreendimentos" element={<AuthGuard><Empreendimentos /></AuthGuard>} />
            <Route path="/empreendimentos/:id" element={<AuthGuard><EmpreendimentoDetail /></AuthGuard>} />
            <Route path="/cadastro-edificio" element={<AuthGuard><CadastroEdificio /></AuthGuard>} />
            <Route path="/editar-edificio/:id" element={<AuthGuard><CadastroEdificio /></AuthGuard>} />
            <Route path="/cadastro-condominio" element={<AuthGuard><CadastroCondominio /></AuthGuard>} />
            <Route path="/editar-condominio/:id" element={<AuthGuard><CadastroCondominio /></AuthGuard>} />
            <Route path="/cadastro-empreendimento" element={<AuthGuard><CadastroEmpreendimento /></AuthGuard>} />
            <Route path="/editar-empreendimento/:id" element={<AuthGuard><CadastroEmpreendimento /></AuthGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

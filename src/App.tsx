import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard, ModuleGuard } from "@/components/AuthGuard";

// Public pages
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import EscolherPlano from "./pages/EscolherPlano";
import NotFound from "./pages/NotFound";
import BrokerSite from "./pages/BrokerSite";
import Home from "./pages/Home";
import EmpreendimentoDetail from "./pages/EmpreendimentoDetail";
import PartnerDetail from "./pages/PartnerDetail";
import ConstrutoraSite from "./pages/ConstrutoraSite";
import Planos from "./pages/Planos";
import PublicCityPhotos from "./pages/PublicCityPhotos";
import ImovelPublico from "./pages/ImovelPublico";
import Feed from "./pages/Feed";
import TestadorXml from "./pages/TestadorXml";

// Admin pages
// AdminDashboard removed - using unified Dashboard
import AdminFuncionarios from "./pages/admin/AdminFuncionarios";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminCargos from "./pages/admin/AdminCargos";
import AdminBrick from "./pages/admin/AdminBrick";
import AdminOpcoes from "./pages/admin/AdminOpcoes";
import AdminIA from "./pages/admin/AdminIA";
import AdminAsaas from "./pages/admin/AdminAsaas";
import AdminParceiros from "./pages/admin/AdminParceiros";

// Broker pages
import BrokerDashboard from "./pages/broker/BrokerDashboard";
import BrokerAssinatura from "./pages/broker/BrokerAssinatura";
import BrokerXmlFeeds from "./pages/broker/BrokerXmlFeeds";
import BrokerCadastroRapido from "./pages/broker/BrokerCadastroRapido";
import PainelParceiro from "./pages/PainelParceiro";

// Legacy pages (used in broker panel context)
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Buildings from "./pages/Buildings";
import BuildingDetail from "./pages/BuildingDetail";
import Condominiums from "./pages/Condominiums";
import CondominiumDetail from "./pages/CondominiumDetail";
import Maps from "./pages/Maps";
import ExplorarMapa from "./pages/ExplorarMapa";
import CityPhotos from "./pages/CityPhotos";
import Brokers from "./pages/Brokers";
import CadastroCorretores from "./pages/CadastroCorretores";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Site from "./pages/Site";
import AllProperties from "./pages/AllProperties";
import RankingPage from "./pages/RankingPage";
import Avaliacoes from "./pages/Avaliacoes";
import Financeiro from "./pages/Financeiro";
import Tabelas from "./pages/Tabelas";
import GeradorTabela from "./pages/GeradorTabela";
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

const protectedRoute = (
  element: React.ReactNode,
  opts?: { adminModule?: string; brokerModule?: string; adminOnly?: boolean },
) => (
  <AuthGuard>
    <ModuleGuard {...opts}>{element}</ModuleGuard>
  </AuthGuard>
);

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
            <Route path="/escolher-plano" element={<AuthGuard allowNoSubscription><EscolherPlano /></AuthGuard>} />
            <Route path="/corretor/:slug" element={<BrokerSite />} />
            <Route path="/empreendimento/:slug" element={<EmpreendimentoDetail />} />
            <Route path="/parceiro/:slug" element={<PartnerDetail />} />
            <Route path="/parceiros" element={<Parceiros />} />
            <Route path="/construtora/:slug" element={<ConstrutoraSite />} />
            <Route path="/site" element={<Site />} />
            <Route path="/brick-store" element={<BrickStore />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/galeria-cidade" element={<PublicCityPhotos />} />
            <Route path="/imovel/:id" element={<ImovelPublico />} />
            <Route path="/testador-xml" element={<TestadorXml />} />
            <Route path="/construtoras/testador-xml" element={<TestadorXml />} />
            <Route path="/feed" element={protectedRoute(<Feed />, { adminModule: "imoveis" })} />
            <Route path="/mapa" element={<ExplorarMapa />} />
            <Route path="/explorar-mapa" element={<ExplorarMapa />} />

            {/* Admin routes */}
            
            <Route path="/admin/funcionarios" element={<AuthGuard requiredRoles={["super_admin"]}><AdminFuncionarios /></AuthGuard>} />
            <Route path="/admin/cargos" element={<AuthGuard requiredRoles={["super_admin"]}><AdminCargos /></AuthGuard>} />
            <Route path="/admin/clientes" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><ModuleGuard adminModule="clientes" adminOnly><AdminClientes /></ModuleGuard></AuthGuard>} />
            <Route path="/admin/planos" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><ModuleGuard adminModule="planos" adminOnly><AdminPlanos /></ModuleGuard></AuthGuard>} />
            <Route path="/admin/brick" element={<AuthGuard requiredRoles={["super_admin", "admin_staff"]}><ModuleGuard adminModule="brick" adminOnly><AdminBrick /></ModuleGuard></AuthGuard>} />
            <Route path="/admin/opcoes" element={<AuthGuard requiredRoles={["super_admin"]}><AdminOpcoes /></AuthGuard>} />
            <Route path="/admin/ia" element={<AuthGuard requiredRoles={["super_admin"]}><AdminIA /></AuthGuard>} />
            <Route path="/admin/asaas" element={<AuthGuard requiredRoles={["super_admin"]}><AdminAsaas /></AuthGuard>} />
            <Route path="/admin/parceiros" element={<AuthGuard requiredRoles={["super_admin"]}><AdminParceiros /></AuthGuard>} />

            {/* Broker routes */}
            <Route path="/painel" element={<AuthGuard requiredRoles={["broker"]}><BrokerDashboard /></AuthGuard>} />
            <Route path="/painel/assinatura" element={<AuthGuard requiredRoles={["broker"]} allowBlocked><BrokerAssinatura /></AuthGuard>} />
            <Route path="/painel/feeds-xml" element={<AuthGuard requiredRoles={["broker"]}><BrokerXmlFeeds /></AuthGuard>} />
            <Route path="/painel/cadastro-rapido" element={<AuthGuard requiredRoles={["broker"]}><BrokerCadastroRapido /></AuthGuard>} />
            <Route path="/painel/imoveis" element={protectedRoute(<Properties />, { adminModule: "imoveis", brokerModule: "imoveis" })} />
            <Route path="/painel/mapas" element={protectedRoute(<Maps />, { adminModule: "imoveis", brokerModule: "imoveis" })} />
            <Route path="/painel/edificios" element={protectedRoute(<Buildings />, { adminModule: "edificios", brokerModule: "edificios" })} />
            <Route path="/painel/edificios/:id" element={protectedRoute(<BuildingDetail />, { adminModule: "edificios", brokerModule: "edificios" })} />
            <Route path="/painel/condominios" element={protectedRoute(<Condominiums />, { adminModule: "condominios", brokerModule: "condominios" })} />
            <Route path="/painel/condominios/:id" element={protectedRoute(<CondominiumDetail />, { adminModule: "condominios", brokerModule: "condominios" })} />
            <Route path="/painel/mapas-condominio" element={protectedRoute(<MapasCondominio />, { adminModule: "condominios", brokerModule: "condominios" })} />
            <Route path="/painel/fotos-cidade" element={protectedRoute(<CityPhotos />, { adminModule: "fotos_cidade", brokerModule: "fotos" })} />
            <Route path="/painel/site" element={protectedRoute(<Site />, { adminModule: "site_editor", brokerModule: "site" })} />
            <Route path="/painel/corretores" element={protectedRoute(<CadastroCorretores />, { adminModule: "corretores", brokerModule: "corretores" })} />
            <Route path="/painel/brick" element={protectedRoute(<Brick />, { adminModule: "brick", brokerModule: "brick" })} />
            <Route path="/painel/financeiro" element={protectedRoute(<Financeiro />, { adminModule: "financeiro", brokerModule: "financeiro" })} />
            <Route path="/painel-parceiro" element={<AuthGuard requiredRoles={["partner"]}><PainelParceiro /></AuthGuard>} />

            {/* Legacy routes - now require auth */}
            <Route path="/dashboard" element={protectedRoute(<Dashboard />, { adminModule: "dashboard_admin" })} />
            <Route path="/imoveis" element={protectedRoute(<Properties />, { adminModule: "imoveis", brokerModule: "imoveis" })} />
            <Route path="/edificios" element={protectedRoute(<Buildings />, { adminModule: "edificios", brokerModule: "edificios" })} />
            <Route path="/edificios/:id" element={protectedRoute(<BuildingDetail />, { adminModule: "edificios", brokerModule: "edificios" })} />
            <Route path="/condominios" element={protectedRoute(<Condominiums />, { adminModule: "condominios", brokerModule: "condominios" })} />
            <Route path="/condominios/:id" element={protectedRoute(<CondominiumDetail />, { adminModule: "condominios", brokerModule: "condominios" })} />
            <Route path="/mapas-condominio" element={protectedRoute(<MapasCondominio />, { adminModule: "condominios", brokerModule: "condominios" })} />
            <Route path="/mapas" element={protectedRoute(<Maps />, { adminModule: "imoveis", brokerModule: "imoveis" })} />
            <Route path="/fotos-cidade" element={protectedRoute(<CityPhotos />, { adminModule: "fotos_cidade", brokerModule: "fotos" })} />
            <Route path="/corretores" element={protectedRoute(<Brokers />, { adminModule: "corretores", adminOnly: true })} />
            <Route path="/cadastro-corretores" element={protectedRoute(<CadastroCorretores />, { adminModule: "corretores", brokerModule: "corretores" })} />
            <Route path="/relatorios" element={protectedRoute(<Reports />, { adminModule: "relatorios", adminOnly: true })} />
            <Route path="/configuracoes" element={protectedRoute(<Settings />, { adminModule: "configuracoes" })} />
            <Route path="/site-editor" element={protectedRoute(<Site />, { adminModule: "site_editor", brokerModule: "site" })} />
            <Route path="/todos-imoveis" element={<AllProperties />} />
            <Route path="/ranking" element={protectedRoute(<RankingPage />, { adminModule: "relatorios" })} />
            <Route path="/avaliacoes" element={protectedRoute(<Avaliacoes />, { adminModule: "avaliacoes", brokerModule: "avaliacoes" })} />
            <Route path="/painel/avaliacoes" element={protectedRoute(<Avaliacoes />, { adminModule: "avaliacoes", brokerModule: "avaliacoes" })} />
            <Route path="/financeiro" element={protectedRoute(<Financeiro />, { adminModule: "financeiro", adminOnly: true })} />
            <Route path="/tabelas" element={protectedRoute(<Tabelas />, { adminModule: "tabelas", brokerModule: "tabelas" })} />
            <Route path="/painel/tabelas" element={protectedRoute(<Tabelas />, { adminModule: "tabelas", brokerModule: "tabelas" })} />
            <Route path="/ferramentas/gerador-tabela" element={protectedRoute(<GeradorTabela />, { adminModule: "tabelas", brokerModule: "tabelas" })} />
            <Route path="/painel/gerador-tabela" element={protectedRoute(<GeradorTabela />, { adminModule: "tabelas", brokerModule: "tabelas" })} />
            <Route path="/contratos" element={protectedRoute(<Contratos />, { adminModule: "contratos", brokerModule: "contratos" })} />
            <Route path="/painel/contratos" element={protectedRoute(<Contratos />, { adminModule: "contratos", brokerModule: "contratos" })} />
            <Route path="/videomaker" element={protectedRoute(<VideoMaker />, { adminModule: "material_extra", brokerModule: "videomaker" })} />
            <Route path="/painel/videomaker" element={protectedRoute(<VideoMaker />, { adminModule: "material_extra", brokerModule: "videomaker" })} />
            <Route path="/imobiliarias" element={protectedRoute(<Imobiliarias />, { adminModule: "imobiliarias", adminOnly: true })} />
            <Route path="/cadastro-imovel" element={protectedRoute(<CadastroImovel />, { adminModule: "imoveis", brokerModule: "imoveis" })} />
            <Route path="/editar-imovel/:id" element={protectedRoute(<EditarImovel />, { adminModule: "imoveis", brokerModule: "imoveis" })} />
            <Route path="/construtoras" element={protectedRoute(<Construtoras />, { adminModule: "edificios" })} />
            <Route path="/construtoras/:id" element={protectedRoute(<ConstrutoraDetail />, { adminModule: "edificios" })} />
            <Route path="/construtoras/:id/avaliacoes" element={protectedRoute(<ConstrutoraAvaliacoes />, { adminModule: "edificios" })} />
            <Route path="/brick" element={protectedRoute(<Brick />, { adminModule: "brick", brokerModule: "brick" })} />
            <Route path="/empreendimentos" element={protectedRoute(<Empreendimentos />, { adminModule: "edificios", brokerModule: "edificios" })} />
            <Route path="/empreendimentos/:id" element={protectedRoute(<EmpreendimentoDetail />, { adminModule: "edificios", brokerModule: "edificios" })} />
            <Route path="/cadastro-edificio" element={protectedRoute(<CadastroEdificio />, { adminModule: "edificios", adminOnly: true })} />
            <Route path="/editar-edificio/:id" element={protectedRoute(<CadastroEdificio />, { adminModule: "edificios", adminOnly: true })} />
            <Route path="/cadastro-condominio" element={protectedRoute(<CadastroCondominio />, { adminModule: "condominios", adminOnly: true })} />
            <Route path="/editar-condominio/:id" element={protectedRoute(<CadastroCondominio />, { adminModule: "condominios", adminOnly: true })} />
            <Route path="/cadastro-empreendimento" element={protectedRoute(<CadastroEmpreendimento />, { adminModule: "edificios", brokerModule: "edificios" })} />
            <Route path="/editar-empreendimento/:id" element={protectedRoute(<CadastroEmpreendimento />, { adminModule: "edificios", brokerModule: "edificios" })} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

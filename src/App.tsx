import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "./pages/NotFound";
import Site from "./pages/Site";
import BrokerSite from "./pages/BrokerSite";
import EmpreendimentoDetail from "./pages/EmpreendimentoDetail";
import AllProperties from "./pages/AllProperties";
import PartnerDetail from "./pages/PartnerDetail";
import RankingPage from "./pages/RankingPage";
import Avaliacoes from "./pages/Avaliacoes";
import Financeiro from "./pages/Financeiro";
import Tabelas from "./pages/Tabelas";
import Contratos from "./pages/Contratos";
import VideoMaker from "./pages/VideoMaker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/imoveis" element={<Properties />} />
          <Route path="/edificios" element={<Buildings />} />
          <Route path="/edificios/:id" element={<BuildingDetail />} />
          <Route path="/condominios" element={<Condominiums />} />
          <Route path="/condominios/:id" element={<CondominiumDetail />} />
          <Route path="/mapas" element={<Maps />} />
          <Route path="/fotos-cidade" element={<CityPhotos />} />
          <Route path="/corretores" element={<Brokers />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="/site" element={<Site />} />
          <Route path="/corretor/:slug" element={<BrokerSite />} />
          <Route path="/empreendimento/:slug" element={<EmpreendimentoDetail />} />
          <Route path="/todos-imoveis" element={<AllProperties />} />
          <Route path="/parceiro/:slug" element={<PartnerDetail />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/avaliacoes" element={<Avaliacoes />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/tabelas" element={<Tabelas />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/videomaker" element={<VideoMaker />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

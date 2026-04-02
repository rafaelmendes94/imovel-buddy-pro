import type { ComponentType } from "react";
import {
  Building, Building2, Fence, LayoutDashboard, Globe, Star,
  Users, Handshake, FileText, DollarSign, BarChart3,
  Map, Camera, Video, HardHat, Settings, ShoppingBag,
} from "lucide-react";

export type ModuleKey =
  | "dashboard" | "imoveis" | "edificios" | "condominios"
  | "site" | "avaliacoes" | "corretores" | "parceiros"
  | "construtoras" | "contratos" | "financeiro" | "relatorios"
  | "mapas" | "fotos_cidades" | "video_maker" | "tabelas"
  | "brick" | "imobiliarias" | "ranking" | "configuracoes";

export interface CoreNavItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  path: string;
  moduleKey: ModuleKey;
  group?: string;
}

export const DEFAULT_PROTECTED_ROUTE = "/imoveis";

export const CORE_NAV_ITEMS: CoreNavItem[] = [
  // Principal
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", moduleKey: "dashboard", group: "Principal" },
  { icon: Building2, label: "Imóveis", path: "/imoveis", moduleKey: "imoveis", group: "Principal" },
  { icon: Building, label: "Edifícios", path: "/edificios", moduleKey: "edificios", group: "Principal" },
  { icon: Fence, label: "Condomínios", path: "/condominios", moduleKey: "condominios", group: "Principal" },

  // Comercial
  { icon: Globe, label: "Meu Site", path: "/meu-site", moduleKey: "site", group: "Comercial" },
  { icon: Star, label: "Avaliações", path: "/avaliacoes", moduleKey: "avaliacoes", group: "Comercial" },
  { icon: Users, label: "Corretores", path: "/corretores", moduleKey: "corretores", group: "Comercial" },
  { icon: Handshake, label: "Parceiros", path: "/parceiros-painel", moduleKey: "parceiros", group: "Comercial" },
  { icon: HardHat, label: "Construtoras", path: "/construtoras", moduleKey: "construtoras", group: "Comercial" },
  { icon: Users, label: "Imobiliárias", path: "/imobiliarias", moduleKey: "imobiliarias", group: "Comercial" },

  // Gestão
  { icon: FileText, label: "Contratos", path: "/contratos", moduleKey: "contratos", group: "Gestão" },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro", moduleKey: "financeiro", group: "Gestão" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios", moduleKey: "relatorios", group: "Gestão" },
  { icon: ShoppingBag, label: "Tabelas", path: "/tabelas", moduleKey: "tabelas", group: "Gestão" },

  // Ferramentas
  { icon: Map, label: "Mapas", path: "/mapas", moduleKey: "mapas", group: "Ferramentas" },
  { icon: Camera, label: "Fotos Cidades", path: "/fotos-cidades", moduleKey: "fotos_cidades", group: "Ferramentas" },
  { icon: Video, label: "Video Maker", path: "/video-maker", moduleKey: "video_maker", group: "Ferramentas" },
  { icon: ShoppingBag, label: "Brick", path: "/brick", moduleKey: "brick", group: "Ferramentas" },
  { icon: BarChart3, label: "Ranking", path: "/ranking", moduleKey: "ranking", group: "Ferramentas" },

  // Sistema
  { icon: Settings, label: "Configurações", path: "/configuracoes", moduleKey: "configuracoes", group: "Sistema" },
];

export const ADMIN_EXTRA_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard Admin", path: "/admin/dashboard", moduleKey: "admin_dashboard" as ModuleKey, group: "Administração" },
  { icon: Users, label: "Funcionários", path: "/admin/funcionarios", moduleKey: "admin_funcionarios" as ModuleKey, group: "Administração" },
  { icon: Settings, label: "Cargos", path: "/admin/cargos", moduleKey: "admin_cargos" as ModuleKey, group: "Administração" },
  { icon: Users, label: "Clientes", path: "/admin/clientes", moduleKey: "admin_clientes" as ModuleKey, group: "Administração" },
  { icon: DollarSign, label: "Planos", path: "/admin/planos", moduleKey: "admin_planos" as ModuleKey, group: "Administração" },
  { icon: ShoppingBag, label: "Brick Admin", path: "/admin/brick", moduleKey: "admin_brick" as ModuleKey, group: "Administração" },
];

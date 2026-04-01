import type { ComponentType } from "react";
import { Building, Building2, Fence } from "lucide-react";

export interface CoreNavItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  path: string;
  moduleKey: "imoveis" | "edificios" | "condominios";
}

export const DEFAULT_PROTECTED_ROUTE = "/imoveis";

export const CORE_NAV_ITEMS: CoreNavItem[] = [
  { icon: Building2, label: "Imóveis", path: "/imoveis", moduleKey: "imoveis" },
  { icon: Building, label: "Edifícios", path: "/edificios", moduleKey: "edificios" },
  { icon: Fence, label: "Condomínios", path: "/condominios", moduleKey: "condominios" },
];
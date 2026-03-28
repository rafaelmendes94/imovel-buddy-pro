import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { PropertyMap } from "@/components/PropertyMap";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { RoutePlanner } from "@/components/RoutePlanner";
import { SharkAI } from "@/components/SharkAI";
import { properties as initialProperties, formatCurrency, Property } from "@/data/mockData";
import {
  Building2, Search, Plus, MapPin, BedDouble, Bath, Car, Ruler,
  Download, Send, LayoutGrid, List, Map, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, Home, Key, Trophy, FileCode, ChevronDown,
  Star, Fence, TreePine, Waves, Paintbrush, Filter, X, SlidersHorizontal,
  Phone, Heart, FileCheck, Eye, Repeat, CreditCard, DollarSign, Ban,
  Share2, CalendarCheck, CalendarClock, AlertTriangle, Pencil, Image,
  FolderDown, User, ShieldCheck, Percent, Gift, BarChart3, FileSignature,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Broker info
const brokerInfo: Record<string, { photo: string; whatsapp: string }> = {
  "Carlos Silva": {
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
    whatsapp: "5511999990001",
  },
  "Ana Rodrigues": {
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
    whatsapp: "5511999990002",
  },
  "Marcos Oliveira": {
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    whatsapp: "5511999990003",
  },
};

type XmlPortal = "ZAP Imóveis" | "VivaReal" | "OLX" | "Imovelweb" | "Chaves na Mão" | "Personalizado";

const xmlPortals: { name: XmlPortal; description: string }[] = [
  { name: "ZAP Imóveis", description: "Formato padrão ZAP" },
  { name: "VivaReal", description: "Formato VivaReal/Grupo ZAP" },
  { name: "OLX", description: "Formato OLX Pro" },
  { name: "Imovelweb", description: "Formato Imovelweb" },
  { name: "Chaves na Mão", description: "Formato Chaves na Mão" },
  { name: "Personalizado", description: "XML genérico completo" },
];

function generateXml(properties: Property[], portal: XmlPortal): string {
  const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const items = properties.map((p) => `    <Imovel>
      <CodigoImovel>${escapeXml(p.id)}</CodigoImovel>
      <TipoImovel>${escapeXml(p.type)}</TipoImovel>
      <TituloImovel>${escapeXml(p.title)}</TituloImovel>
      <Endereco>${escapeXml(p.address)}</Endereco>
      <Cidade>${escapeXml(p.city)}</Cidade>
      <PrecoVenda>${p.price}</PrecoVenda>
      <AreaUtil>${p.area}</AreaUtil>
      <QtdDormitorios>${p.bedrooms}</QtdDormitorios>
      <QtdBanheiros>${p.bathrooms}</QtdBanheiros>
      <QtdVagas>${p.parking}</QtdVagas>
      <StatusImovel>${escapeXml(p.status)}</StatusImovel>
      <Corretor>${escapeXml(p.broker)}</Corretor>
      <Latitude>${p.lat}</Latitude>
      <Longitude>${p.lng}</Longitude>
    </Imovel>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Imoveis portal="${portal}">\n  <Header>\n    <TotalImoveis>${properties.length}</TotalImoveis>\n  </Header>\n  <ListaImoveis>\n${items}\n  </ListaImoveis>\n</Imoveis>`;
}

function downloadXml(xml: string, portal: string) {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `imoveis_${portal.toLowerCase().replace(/\s+/g, "_")}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

const allStatuses: Property["status"][] = ["Disponível", "Vendido", "Reservado", "Alugado", "Suspenso"];
const statusLabels: Record<Property["status"], string> = {
  Disponível: "Ativo", Vendido: "Vendido", Reservado: "Reservado", Alugado: "Alugado", Suspenso: "Suspenso",
};
const statusConfig: Record<Property["status"], { color: string; bg: string; border: string; icon: typeof Home }> = {
  Disponível: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Home },
  Vendido: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: CheckCircle2 },
  Reservado: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Clock },
  Alugado: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Key },
  Suspenso: { color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", icon: Ban },
};

type Category = "todos" | "apartamentos" | "casas" | "terrenos" | "decorados" | "vista-mar" | "permuta" | "vendidos";

const categories: { key: Category; label: string; icon: typeof Home }[] = [
  { key: "todos", label: "Todos", icon: Search },
  { key: "apartamentos", label: "Apartamentos", icon: Building2 },
  { key: "casas", label: "Casas", icon: Home },
  { key: "terrenos", label: "Terrenos", icon: TreePine },
  { key: "decorados", label: "Decorados", icon: Paintbrush },
  { key: "vista-mar", label: "Vista Mar", icon: Waves },
  { key: "permuta", label: "Permuta", icon: Repeat },
  { key: "vendidos", label: "Vendidos", icon: Trophy },
];

// Auto-generate codes for properties that don't have one
const propertiesWithCodes = initialProperties.map((p, i) => ({
  ...p,
  code: p.code || `MV${String(i + 1).padStart(2, "0")}`,
}));

export default function Properties() {
  const navigate = useNavigate();
  const [propertyList, setPropertyList] = useState<Property[]>(propertiesWithCodes);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("todos");
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [showXmlMenu, setShowXmlMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filterCity, setFilterCity] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterEmpreendimento, setFilterEmpreendimento] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterStreet, setFilterStreet] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterParking, setFilterParking] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "updated" | "created">("default");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [viewingTerm, setViewingTerm] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("mv-favorites") || "[]"); } catch { return []; }
  });
  const [filterFreshness, setFilterFreshness] = useState<"all" | "30" | "60" | "90">("all");
  const [showInactive, setShowInactive] = useState(false);

  const xmlMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (xmlMenuRef.current && !xmlMenuRef.current.contains(e.target as Node)) setShowXmlMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("mv-favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleExportXml = (portal: XmlPortal) => {
    const available = propertyList.filter((p) => p.status === "Disponível");
    const xml = generateXml(available.length > 0 ? available : propertyList, portal);
    downloadXml(xml, portal);
    setShowXmlMenu(false);
  };

  const handleStatusChange = (propertyId: string, newStatus: Property["status"]) => {
    setPropertyList((prev) => prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p)));
  };

  const handlePriceChange = (propertyId: string, field: "price" | "priceInstallment", value: number) => {
    setPropertyList((prev) => prev.map((p) => (p.id === propertyId ? { ...p, [field]: value } : p)));
    toast.success("Valor atualizado!");
  };

  const handleDealLabelChange = (propertyId: string, label: Property["dealLabel"]) => {
    setPropertyList((prev) => prev.map((p) => (p.id === propertyId ? { ...p, dealLabel: label } : p)));
    toast.success(label ? `Classificado como "${label}"` : "Classificação removida");
  };

  const handleNavigateToValuation = (property: Property) => {
    const params = new URLSearchParams({
      tipo: property.type,
      cidade: property.city,
      bairro: property.neighborhood || "",
      area: String(property.area),
      quartos: String(property.bedrooms),
      endereco: property.address,
      titulo: property.title,
    });
    navigate(`/avaliacoes?${params.toString()}`);
  };

  const handleNavigateToContract = (property: Property) => {
    const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);
    const params = new URLSearchParams({
      imovel: property.title,
      endereco: `${property.address}, ${property.city}`,
      valor: String(property.price),
      proprietario: property.owner || "",
      empreendimento: property.empreendimento || "",
      unidade: unitParts.join(" / ") || "",
      dormitorios: property.bedrooms > 0 ? `${property.bedrooms} dormitório(s)` : "",
      vagas: property.parking > 0 ? `${property.parking} vaga(s)` : "",
      cidade: property.city || "",
    });
    navigate(`/contratos?${params.toString()}`);
  };

  const hasActiveFilters = filterCity || filterBedrooms || filterPriceMin || filterPriceMax || filterCondition || filterEmpreendimento || filterType || filterOwner || filterNeighborhood || filterStreet || filterCode || filterParking;

  const clearFilters = () => {
    setFilterCity(""); setFilterBedrooms(""); setFilterPriceMin(""); setFilterPriceMax(""); setFilterCondition("");
    setFilterEmpreendimento(""); setFilterType(""); setFilterOwner(""); setFilterNeighborhood(""); setFilterStreet(""); setFilterCode(""); setFilterParking(""); setSearch("");
    setShowInactive(false); setSortBy("default");
  };

  const cities = useMemo(() => [...new Set(propertyList.map(p => p.city))].sort(), [propertyList]);
  const empreendimentos = useMemo(() => [...new Set(propertyList.map(p => p.empreendimento).filter(Boolean))].sort() as string[], [propertyList]);
  const owners = useMemo(() => [...new Set(propertyList.map(p => p.owner).filter(Boolean))].sort() as string[], [propertyList]);
  const types = useMemo(() => [...new Set(propertyList.map(p => p.type))].sort(), [propertyList]);
  const neighborhoods = useMemo(() => [...new Set(propertyList.map(p => p.neighborhood).filter(Boolean))].sort() as string[], [propertyList]);
  const streets = useMemo(() => [...new Set(propertyList.map(p => p.address))].sort(), [propertyList]);

  // Freshness helpers
  const now = new Date();
  const getDaysSinceUpdate = (p: Property) => {
    const updated = p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt);
    return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  };

  const freshnessStats = useMemo(() => {
    let within30 = 0, within60 = 0, over90 = 0;
    propertyList.forEach(p => {
      const days = getDaysSinceUpdate(p);
      if (days <= 30) within30++;
      else if (days <= 60) within60++;
      else if (days > 90) over90++;
    });
    return { within30, within60, over90 };
  }, [propertyList]);

  const filtered = useMemo(() => {
    return propertyList.filter((p) => {
      // Freshness filter
      if (filterFreshness !== "all") {
        const days = getDaysSinceUpdate(p);
        if (filterFreshness === "30" && days > 30) return false;
        if (filterFreshness === "60" && (days <= 30 || days > 60)) return false;
        if (filterFreshness === "90" && days <= 90) return false;
      }

      // Default: only show Disponível and Reservado unless showInactive or vendidos category
      if (activeCategory !== "vendidos" && !showInactive) {
        if (p.status !== "Disponível" && p.status !== "Reservado") return false;
      }

      // Category
      if (activeCategory === "apartamentos" && p.type !== "Apartamento") return false;
      if (activeCategory === "casas" && p.type !== "Casa") return false;
      if (activeCategory === "terrenos" && p.type !== "Terreno") return false;
      if (activeCategory === "decorados" && !p.decorated) return false;
      if (activeCategory === "vista-mar" && !p.seaView) return false;
      if (activeCategory === "permuta" && !p.acceptsExchange) return false;
      if (activeCategory === "vendidos" && p.status !== "Vendido") return false;

      // Search (includes code)
      if (search) {
        const s = search.toLowerCase();
        if (!p.title.toLowerCase().includes(s) && !p.address.toLowerCase().includes(s) && !p.city.toLowerCase().includes(s) && !p.broker.toLowerCase().includes(s) && !(p.code || "").toLowerCase().includes(s)) return false;
      }

      // Advanced filters
      if (filterCity && p.city !== filterCity) return false;
      if (filterBedrooms && p.bedrooms < parseInt(filterBedrooms)) return false;
      if (filterPriceMin && p.price < parseInt(filterPriceMin)) return false;
      if (filterPriceMax && p.price > parseInt(filterPriceMax)) return false;
      if (filterCondition && !(p.paymentConditions?.some(c => c.toLowerCase().includes(filterCondition.toLowerCase())))) return false;
      if (filterEmpreendimento && p.empreendimento !== filterEmpreendimento) return false;
      if (filterType && p.type !== filterType) return false;
      if (filterOwner && p.owner !== filterOwner) return false;
      if (filterNeighborhood && p.neighborhood !== filterNeighborhood) return false;
      if (filterStreet && p.address !== filterStreet) return false;
      if (filterCode && !(p.code || "").toLowerCase().includes(filterCode.toLowerCase())) return false;
      if (filterParking && p.parking < parseInt(filterParking)) return false;

      return true;
    });
  }, [propertyList, activeCategory, search, filterCity, filterBedrooms, filterPriceMin, filterPriceMax, filterCondition, filterFreshness, filterEmpreendimento, filterType, filterOwner, filterNeighborhood, filterStreet, filterCode, filterParking, showInactive]);

  const sorted = useMemo(() => {
    if (sortBy === "default") return filtered;
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-desc": return b.price - a.price;
        case "price-asc": return a.price - b.price;
        case "name-asc": return (a.empreendimento || a.title).localeCompare(b.empreendimento || b.title);
        case "name-desc": return (b.empreendimento || b.title).localeCompare(a.empreendimento || a.title);
        case "updated": return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        case "created": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return 0;
      }
    });
  }, [filtered, sortBy]);

  const favoritedProperties = propertyList.filter((p) => favoriteIds.includes(p.id));

  // Stats
  const totalVGV = propertyList.filter(p => p.status === "Disponível").reduce((s, p) => s + p.price, 0);
  const totalSold = propertyList.filter(p => p.status === "Vendido").reduce((s, p) => s + p.price, 0);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <BackButton />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Imóveis</h1>
              <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {propertyList.length} cadastrados
                </p>
                <span className="text-xs sm:text-sm font-semibold text-emerald-500">VGV {formatCurrency(totalVGV)}</span>
                <span className="text-xs sm:text-sm font-semibold text-primary">Vendas {formatCurrency(totalSold)}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate("/relatorios")}
                className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-md hover:bg-primary/20 transition-colors"
              >
                <BarChart3 className="w-3 h-3" /> Relatório
              </button>
              <div className="relative" ref={xmlMenuRef}>
                <button
                  onClick={() => setShowXmlMenu(!showXmlMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-input text-foreground text-xs font-medium hover:bg-muted transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exportar</span> XML <ChevronDown className="w-3 h-3" />
                </button>
                {showXmlMenu && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-xl z-50 py-1 animate-scale-in">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Selecione o portal</p>
                    {xmlPortals.map((portal) => (
                      <button key={portal.name} onClick={() => handleExportXml(portal.name)} className="w-full text-left px-3 py-2 hover:bg-muted transition-colors">
                        <span className="text-sm font-medium text-foreground block">{portal.name}</span>
                        <span className="text-[11px] text-muted-foreground">{portal.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-gold text-primary text-xs font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Novo</span> Imóvel
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {[
            { label: "Total", count: propertyList.length, icon: Star, onClick: () => setActiveCategory("todos") },
            { label: "Ativos", count: propertyList.filter(p => p.status === "Disponível").length, icon: Home, onClick: () => setActiveCategory("todos") },
            { label: "Apartamentos", count: propertyList.filter(p => p.type === "Apartamento").length, icon: Building2, onClick: () => setActiveCategory("apartamentos") },
            { label: "Casas", count: propertyList.filter(p => p.type === "Casa").length, icon: Home, onClick: () => setActiveCategory("casas") },
            { label: "Terrenos", count: propertyList.filter(p => p.type === "Terreno").length, icon: TreePine, onClick: () => setActiveCategory("terrenos") },
            { label: "Decorados", count: propertyList.filter(p => p.decorated).length, icon: Paintbrush, onClick: () => setActiveCategory("decorados") },
            { label: "Vista Mar", count: propertyList.filter(p => p.seaView).length, icon: Waves, onClick: () => setActiveCategory("vista-mar") },
            { label: "Vendidos", count: propertyList.filter(p => p.status === "Vendido").length, icon: Trophy, onClick: () => setActiveCategory("vendidos") },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className="bg-card border border-border rounded-xl p-2 sm:p-3 hover:bg-muted/50 transition-colors text-left"
            >
              <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mb-0.5 sm:mb-1" />
              <p className="text-base sm:text-xl font-bold text-foreground">{stat.count}</p>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Freshness Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => setFilterFreshness(filterFreshness === "30" ? "all" : "30")}
            className={cn(
              "bg-card border rounded-xl p-2 sm:p-4 text-left transition-all hover:shadow-md group",
              filterFreshness === "30" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-border"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-500">Atualizados (30d)</p>
                <p className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1">{freshnessStats.within30}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block">imóveis em dia</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              </div>
            </div>
          </button>
          <button
            onClick={() => setFilterFreshness(filterFreshness === "60" ? "all" : "60")}
            className={cn(
              "bg-card border rounded-xl p-2 sm:p-4 text-left transition-all hover:shadow-md group",
              filterFreshness === "60" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-border"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-500">Atenção (31-60d)</p>
                <p className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1">{freshnessStats.within60}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block">precisam de revisão</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </div>
            </div>
          </button>
          <button
            onClick={() => setFilterFreshness(filterFreshness === "90" ? "all" : "90")}
            className={cn(
              "bg-card border rounded-xl p-2 sm:p-4 text-left transition-all hover:shadow-md group",
              filterFreshness === "90" ? "border-destructive ring-2 ring-destructive/20" : "border-border"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-destructive">Desatualizados (+90d)</p>
                <p className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1">{freshnessStats.over90}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block">ação urgente</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              </div>
            </div>
          </button>
        </div>

        {/* Active freshness filter indicator */}
        {filterFreshness !== "all" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm">
            <span className="text-muted-foreground">Filtrando por:</span>
            <span className={cn("font-semibold",
              filterFreshness === "30" && "text-emerald-500",
              filterFreshness === "60" && "text-amber-500",
              filterFreshness === "90" && "text-destructive",
            )}>
              {filterFreshness === "30" ? "Atualizados nos últimos 30 dias" : filterFreshness === "60" ? "Atualizados entre 31-60 dias" : "Desatualizados há mais de 90 dias"}
            </span>
            <button onClick={() => setFilterFreshness("all")} className="ml-auto p-1 rounded hover:bg-muted">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Category Tabs + Search + Filters */}
        <div className="space-y-3">
          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                )}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search + filter toggle + view */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, endereço, cidade, corretor ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border",
                showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-input hover:bg-muted"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filtros
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
            </button>
            <div className="flex border border-input rounded-lg overflow-hidden">
              {([
                { key: "grid" as const, Icon: LayoutGrid },
                { key: "list" as const, Icon: List },
                { key: "map" as const, Icon: Map },
              ]).map(({ key, Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={cn(
                    "p-2.5 transition-colors",
                    view === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-12 gap-2 sm:gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Empreendimento</label>
                  <select value={filterEmpreendimento} onChange={(e) => setFilterEmpreendimento(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Todos</option>
                    {empreendimentos.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Tipo</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Todos</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Proprietário</label>
                  <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Todos</option>
                    {owners.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Cidade</label>
                  <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Todas</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Bairro</label>
                  <select value={filterNeighborhood} onChange={(e) => setFilterNeighborhood(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Todos</option>
                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Rua</label>
                  <select value={filterStreet} onChange={(e) => setFilterStreet(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Todas</option>
                    {streets.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Quartos (mín.)</label>
                  <select value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Qualquer</option>
                    <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Vagas (mín.)</label>
                  <select value={filterParking} onChange={(e) => setFilterParking(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Qualquer</option>
                    <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option>
                  </select>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Preço mín.</label>
                  <select value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Sem mínimo</option>
                    <option value="200000">R$ 200 mil</option><option value="500000">R$ 500 mil</option><option value="800000">R$ 800 mil</option><option value="1000000">R$ 1 milhão</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Preço máx.</label>
                  <select value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Sem máximo</option>
                    <option value="500000">R$ 500 mil</option><option value="800000">R$ 800 mil</option><option value="1000000">R$ 1 milhão</option><option value="1500000">R$ 1,5 milhão</option><option value="2000000">R$ 2 milhões</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Incluir inativos</label>
                  <button
                    onClick={() => setShowInactive(!showInactive)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      showInactive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {showInactive ? "✓ Inativos" : "Apenas ativos"}
                  </button>
                </div>
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors w-full justify-center">
                      <X className="w-3.5 h-3.5" /> Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} imóvel(is) encontrado(s)
            {favoriteIds.length > 0 && <span className="ml-3 text-accent font-medium">♥ {favoriteIds.length} favorito(s)</span>}
          </p>
        </div>

        {/* Content */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
            {filtered.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onStatusChange={handleStatusChange}
                onSelect={setSelectedProperty}
                onViewTerm={setViewingTerm}
                isFavorited={favoriteIds.includes(property.id)}
                onToggleFavorite={toggleFavorite}
                onFilterByTitle={(title) => { setSearch(title.split(" ").slice(0, 2).join(" ")); setActiveCategory("todos"); }}
                onFilterByCondition={(cond) => { setFilterCondition(cond); setShowFilters(true); setActiveCategory("todos"); }}
                onFilterByOwner={(owner) => { setFilterOwner(owner); setShowFilters(true); setActiveCategory("todos"); }}
              />
            ))}
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">
            {filtered.map((property) => (
              <PropertyRow
                key={property.id}
                property={property}
                onStatusChange={handleStatusChange}
                onSelect={setSelectedProperty}
                isFavorited={favoriteIds.includes(property.id)}
                onToggleFavorite={toggleFavorite}
                onFilterByTitle={(title) => { setSearch(title.split(" ").slice(0, 2).join(" ")); setActiveCategory("todos"); }}
                onFilterByCondition={(cond) => { setFilterCondition(cond); setShowFilters(true); setActiveCategory("todos"); }}
                onFilterByOwner={(owner) => { setFilterOwner(owner); setShowFilters(true); setActiveCategory("todos"); }}
                onPriceChange={handlePriceChange}
                allProperties={propertyList}
                onDealLabelChange={handleDealLabelChange}
                onNavigateToValuation={handleNavigateToValuation}
                onNavigateToContract={handleNavigateToContract}
              />
            ))}
          </div>
        ) : (
          <PropertyMap properties={filtered} />
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum imóvel encontrado</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">Limpar filtros</button>
            )}
          </div>
        )}
      </div>

      {/* Floating tools */}
      <RoutePlanner properties={favoritedProperties} />
      <SharkAI properties={propertyList} onSelectProperty={setSelectedProperty} />

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        allProperties={propertyList}
        brokerInfo={brokerInfo}
        onSelectSimilar={(p) => setSelectedProperty(p)}
        onUpdateProperty={(updated) => {
          setPropertyList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setSelectedProperty(updated);
        }}
        onFilterByTitle={(title) => { setSelectedProperty(null); setSearch(title.split(" ").slice(0, 2).join(" ")); setActiveCategory("todos"); }}
        onFilterByCondition={(cond) => { setSelectedProperty(null); setFilterCondition(cond); setShowFilters(true); setActiveCategory("todos"); }}
      />

      {/* Term Viewer Modal */}
      {viewingTerm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingTerm(null)}>
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-foreground">Termo de Exclusividade</h3>
              </div>
              <div className="flex items-center gap-2">
                <a href={viewingTerm} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground bg-muted hover:bg-secondary transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Abrir original
                </a>
                <button onClick={() => setViewingTerm(null)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-60px)] p-4 bg-muted/30 flex items-center justify-center">
              {viewingTerm.toLowerCase().endsWith(".pdf") ? (
                <iframe src={viewingTerm} className="w-full h-[75vh] rounded-lg border border-border" title="Termo de Exclusividade" />
              ) : (
                <img src={viewingTerm} alt="Termo de Exclusividade" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md" />
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ---- Image Carousel ----
function ImageCarousel({ images: rawImages, alt }: { images?: string[]; alt: string }) {
  const images = rawImages && rawImages.length > 0 ? rawImages : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"];
  const [current, setCurrent] = useState(0);

  return (
    <div className="relative h-48 overflow-hidden group/carousel">
      {images.map((src, i) => (
        <img key={i} src={src} alt={`${alt} ${i + 1}`} className={cn("absolute inset-0 w-full h-full object-cover transition-all duration-500", i === current ? "opacity-100 scale-100" : "opacity-0 scale-105")} />
      ))}
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-foreground/80">
            <ChevronLeft className="w-4 h-4 text-background" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-foreground/80">
            <ChevronRight className="w-4 h-4 text-background" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === current ? "bg-background w-4" : "bg-background/50")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Status Bar ----
function StatusBar({ currentStatus, onChangeStatus }: { currentStatus: Property["status"]; onChangeStatus: (status: Property["status"]) => void }) {
  return (
    <div className="flex gap-1.5">
      {allStatuses.map((status) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const isActive = status === currentStatus;
        return (
          <button key={status} onClick={(e) => { e.stopPropagation(); onChangeStatus(status); }} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all duration-200", isActive ? `${config.bg} ${config.color} ${config.border} shadow-sm` : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted")}>
            <Icon className="w-3 h-3" /> {statusLabels[status]}
          </button>
        );
      })}
    </div>
  );
}

// ---- Update Badge ----
function UpdateBadge({ updatedAt, createdAt, compact }: { updatedAt?: string; createdAt: string; compact?: boolean }) {
  const date = updatedAt || createdAt;
  const updated = new Date(date);
  const now = new Date();
  const days = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = updated.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const color = days <= 30
    ? "text-emerald-500 bg-emerald-500/10"
    : days <= 60
    ? "text-amber-500 bg-amber-500/10"
    : "text-destructive bg-destructive/10";

  const label = days <= 30 ? "Atualizado" : days <= 60 ? "Revisar" : "Desatualizado";
  const Icon = days <= 30 ? CalendarCheck : days <= 60 ? CalendarClock : AlertTriangle;

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold", color)}>
        <Icon className="w-3 h-3" />
        {formatted} • {days}d
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold", color)}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span>{label} • {formatted}</span>
      </div>
      <span className="text-[10px] opacity-70">{days} dias</span>
    </div>
  );
}

// ---- Sold Celebration ----
function SoldCelebration() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i, left: `${5 + Math.random() * 90}%`, delay: `${Math.random() * 0.6}s`,
    color: ["hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--info))", "hsl(38 100% 65%)", "hsl(0 84% 60%)"][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 4, rotate: Math.random() * 360,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20 rounded-xl">
      <div className="absolute inset-0 bg-foreground/40 animate-[fade-in_0.3s_ease-out]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center animate-sold-stamp">
        <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mb-2 shadow-lg">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-5 py-2 shadow-xl border border-accent/30">
          <p className="text-lg font-black text-accent tracking-wider">VENDIDO!</p>
        </div>
      </div>
      {particles.map((p) => (
        <div key={p.id} className="absolute animate-confetti-fall" style={{ left: p.left, top: "-10px", animationDelay: p.delay, width: p.size, height: p.size, borderRadius: Math.random() > 0.5 ? "50%" : "2px", backgroundColor: p.color, transform: `rotate(${p.rotate}deg)` }} />
      ))}
    </div>
  );
}

// ---- PropertyCard (enhanced) ----
function PropertyCard({
  property, onStatusChange, onSelect, onViewTerm, isFavorited, onToggleFavorite, onFilterByTitle, onFilterByCondition,
}: {
  property: Property;
  onStatusChange: (id: string, status: Property["status"]) => void;
  onSelect?: (p: Property) => void;
  onViewTerm?: (url: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  onFilterByTitle?: (title: string) => void;
  onFilterByCondition?: (cond: string) => void;
  onFilterByOwner?: (owner: string) => void;
}) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);
  const broker = brokerInfo[property.broker] || { photo: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop&crop=face", whatsapp: "5511999999999" };
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);

  const handleStatusChange = (newStatus: Property["status"]) => {
    if (newStatus === "Vendido" && property.status !== "Vendido") {
      setShowCelebration(true); setAnimatePulse(true);
      setTimeout(() => setShowCelebration(false), 2500);
      setTimeout(() => setAnimatePulse(false), 800);
    }
    onStatusChange(property.id, newStatus);
  };

  return (
    <div className={cn("elevated-card rounded-xl overflow-hidden relative transition-all duration-300", animatePulse && "animate-sold-pulse")}>
      {showCelebration && <SoldCelebration />}

      <div className="relative cursor-pointer" onClick={() => onSelect?.(property)}>
        <ImageCarousel images={property.images} alt={property.title} />

        {/* Exclusivity badge */}
        {property.exclusivityTerm && (
          <button onClick={(e) => { e.stopPropagation(); onViewTerm?.(property.exclusivityTerm!); }}
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm hover:bg-amber-600 transition-colors z-20 shadow-md"
          >
            <FileCheck className="w-3 h-3" /> Ex.Assinada
          </button>
        )}

        {/* Favorite */}
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(property.id); }}
          className={cn("absolute z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110",
            property.exclusivityTerm ? "top-12 right-3" : "top-3 right-3",
            isFavorited ? "bg-red-500 text-white" : "bg-foreground/30 text-white hover:bg-red-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>

        {/* Price + badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <p className="text-xl font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
          <div className="flex gap-1">
            {property.seaView && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/90 text-white backdrop-blur-sm flex items-center gap-0.5"><Waves className="w-2.5 h-2.5" /> Mar</span>}
            {property.decorated && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/90 text-white backdrop-blur-sm flex items-center gap-0.5"><Paintbrush className="w-2.5 h-2.5" /> Dec.</span>}
            {property.acceptsExchange && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm flex items-center gap-0.5"><Repeat className="w-2.5 h-2.5" /> Permuta</span>}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-card-foreground text-sm cursor-pointer hover:text-primary transition-colors uppercase"
            onClick={() => onFilterByTitle?.(property.title)}
            title="Clique para ver títulos semelhantes"
          >{property.title}</h3>
          {(property.empreendimento || unitParts.length > 0) && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {property.empreendimento && (
                <Link
                  to={`/empreendimento/${property.empreendimento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                  className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded hover:bg-accent/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title="Abrir página do empreendimento"
                >
                  {property.empreendimento}
                </Link>
              )}
              {unitParts.map((part) => (
                <span key={part} className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{part}</span>
              ))}
            </div>
          )}
          <button
            className="flex items-center gap-1 mt-1 hover:text-primary transition-colors group"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`, "_blank");
            }}
            title="Abrir localização no Google Maps"
          >
            <MapPin className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
            <p className="text-xs text-muted-foreground group-hover:text-primary">{property.address}, {property.city}</p>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 border-y border-border">
          {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms}</span>}
          {property.parking > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {property.parking}</span>}
          <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {property.area}m² total</span>
          {property.privateArea && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {property.privateArea}m² priv.</span>}
        </div>

        {/* Payment conditions */}
        {property.paymentConditions && property.paymentConditions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.paymentConditions.map((cond) => (
              <button
                key={cond}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onFilterByCondition?.(cond); }}
                title={`Ver imóveis com condição "${cond}"`}
              >
                {cond}
              </button>
            ))}
          </div>
        )}

        {/* Last update indicator */}
        <UpdateBadge updatedAt={property.updatedAt} createdAt={property.createdAt} />

        {/* Broker + WhatsApp */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <img src={broker.photo} alt={property.broker} className="w-7 h-7 rounded-full object-cover border-2 border-accent" />
            <div>
              <p className="text-[11px] font-semibold text-foreground">{property.broker}</p>
              <p className="text-[9px] text-muted-foreground">Corretor(a)</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${broker.whatsapp}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3 h-3" /> WhatsApp
          </a>
        </div>

        {/* Status change bar */}
        <StatusBar currentStatus={property.status} onChangeStatus={handleStatusChange} />
      </div>
    </div>
  );
}

// ---- Row Carousel (compact) ----
function RowCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="relative w-full h-full min-h-[140px] overflow-hidden group/row-carousel">
      {images.map((src, i) => (
        <img key={i} src={src} alt={`Foto ${i + 1}`} className={cn("absolute inset-0 w-full h-full object-cover transition-all duration-400", i === current ? "opacity-100" : "opacity-0")} />
      ))}
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-foreground/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/row-carousel:opacity-100 transition-opacity">
            <ChevronLeft className="w-3.5 h-3.5 text-background" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-foreground/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/row-carousel:opacity-100 transition-opacity">
            <ChevronRight className="w-3.5 h-3.5 text-background" />
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {images.map((_, i) => (
              <span key={i} className={cn("w-1 h-1 rounded-full transition-all", i === current ? "bg-background w-3" : "bg-background/50")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Inline Price Editor ----
function InlinePrice({ value, onChange, className }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(String(value));
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const parsed = parseFloat(draft.replace(/[^\d]/g, ""));
    if (!isNaN(parsed) && parsed > 0 && parsed !== value) onChange(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={cn("bg-transparent border-b border-primary outline-none text-right w-[120px]", className)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={cn("cursor-pointer hover:opacity-70 transition-opacity", className)}
      onClick={startEdit}
      title="Clique para editar o valor"
    >
      {formatCurrency(value)}
    </span>
  );
}

// ---- Deal Score Analysis ----
interface DealScore {
  score: number; // 0-100
  label: "Oferta" | "Bom Negócio" | "Normal" | "Acima da Média";
  estimatedDays: number;
  pricePerM2: number;
  avgPricePerM2: number;
}

function analyzeDealScore(property: Property, allProperties: Property[]): DealScore {
  // Find similar properties: same type, same city or nearby, similar bedrooms (±1)
  const similar = allProperties.filter(p =>
    p.id !== property.id &&
    p.type === property.type &&
    (p.city === property.city || (p.neighborhood && p.neighborhood === property.neighborhood)) &&
    Math.abs(p.bedrooms - property.bedrooms) <= 1 &&
    p.status !== "Vendido" && p.status !== "Suspenso"
  );

  const pricePerM2 = property.area > 0 ? property.price / property.area : 0;

  if (similar.length === 0) {
    return { score: 50, label: "Normal", estimatedDays: 90, pricePerM2, avgPricePerM2: pricePerM2 };
  }

  const avgPricePerM2 = similar.reduce((sum, p) => sum + (p.area > 0 ? p.price / p.area : 0), 0) / similar.length;
  const avgPrice = similar.reduce((sum, p) => sum + p.price, 0) / similar.length;

  // Score: how much cheaper vs average (higher = better deal)
  const priceDiffPercent = avgPrice > 0 ? ((avgPrice - property.price) / avgPrice) * 100 : 0;
  const m2DiffPercent = avgPricePerM2 > 0 ? ((avgPricePerM2 - pricePerM2) / avgPricePerM2) * 100 : 0;

  // Combined score weighted: 60% price comparison, 40% m2 comparison
  let rawScore = (priceDiffPercent * 0.6 + m2DiffPercent * 0.4);

  // Bonus for extras
  if (property.seaView) rawScore += 5;
  if (property.decorated) rawScore += 3;
  if (property.acceptsExchange) rawScore += 2;
  if (property.bonus && property.bonus > 0) rawScore += 3;

  // Normalize to 0-100
  const score = Math.max(0, Math.min(100, 50 + rawScore * 2));

  // Label
  let label: DealScore["label"];
  if (score >= 80) label = "Oferta";
  else if (score >= 60) label = "Bom Negócio";
  else if (score >= 40) label = "Normal";
  else label = "Acima da Média";

  // Estimated days to sell (higher score = faster)
  const estimatedDays = Math.max(7, Math.round(180 - score * 1.5));

  return { score, label, estimatedDays, pricePerM2, avgPricePerM2 };
}

// ---- Deal Thermometer Component ----
function DealThermometer({ dealScore, manualLabel }: { dealScore: DealScore; manualLabel?: Property["dealLabel"] }) {
  const effectiveLabel = manualLabel || dealScore.label;
  const { score, estimatedDays } = dealScore;

  const getThermometerColor = () => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-emerald-400";
    if (score >= 40) return "bg-amber-400";
    return "bg-red-400";
  };

  const getLabelStyle = (lbl: string) => {
    if (lbl === "Oferta") return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    if (lbl === "Bom Negócio") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (lbl === "Normal") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const getTimeIcon = () => {
    if (estimatedDays <= 30) return "🔥";
    if (estimatedDays <= 60) return "⚡";
    if (estimatedDays <= 90) return "📊";
    return "🕐";
  };
  return (
    <div className="mt-1.5 space-y-1">
      {/* Deal label badge */}
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border", getLabelStyle(effectiveLabel))}>
          {effectiveLabel === "Oferta" || effectiveLabel === "Bom Negócio" ? "🏷️ " : ""}{effectiveLabel}
        </span>
        {manualLabel && <span className="text-[7px] text-muted-foreground italic">manual</span>}
        <span className="text-[8px] text-muted-foreground font-semibold">
          R$ {Math.round(dealScore.pricePerM2).toLocaleString("pt-BR")}/m²
        </span>
      </div>

      {/* Thermometer bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", getThermometerColor())}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-[8px] font-black text-muted-foreground">{Math.round(score)}%</span>
      </div>

      {/* Estimated sale time */}
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-muted-foreground">
          {getTimeIcon()} Prev. venda: <span className="font-bold text-foreground">{estimatedDays <= 30 ? `~${estimatedDays} dias` : estimatedDays <= 60 ? "~1-2 meses" : estimatedDays <= 90 ? "~2-3 meses" : `~${Math.round(estimatedDays / 30)} meses`}</span>
        </span>
      </div>
    </div>
  );
}

// ---- PropertyRow (redesigned) ----
function PropertyRow({
  property, onStatusChange, onSelect, isFavorited, onToggleFavorite, onFilterByTitle, onFilterByCondition, onFilterByOwner, onPriceChange, allProperties, onDealLabelChange, onNavigateToValuation, onNavigateToContract,
}: {
  property: Property;
  onStatusChange: (id: string, status: Property["status"]) => void;
  onSelect?: (p: Property) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  onFilterByTitle?: (title: string) => void;
  onFilterByCondition?: (cond: string) => void;
  onFilterByOwner?: (owner: string) => void;
  onPriceChange?: (id: string, field: "price" | "priceInstallment", value: number) => void;
  allProperties?: Property[];
  onDealLabelChange?: (id: string, label: Property["dealLabel"]) => void;
  onNavigateToValuation?: (p: Property) => void;
  onNavigateToContract?: (p: Property) => void;
}) {
  const dealScore = useMemo(() => analyzeDealScore(property, allProperties || []), [property, allProperties]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);

  const handleStatusChange = (newStatus: Property["status"]) => {
    if (newStatus === "Vendido" && property.status !== "Vendido") {
      setShowCelebration(true); setAnimatePulse(true);
      setTimeout(() => setShowCelebration(false), 2500);
      setTimeout(() => setAnimatePulse(false), 800);
    }
    onStatusChange(property.id, newStatus);
  };

  const createdFormatted = new Date(property.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const updatedDate = property.updatedAt || property.createdAt;
  const updatedFormatted = new Date(updatedDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(updatedDate).getTime()) / (1000 * 60 * 60 * 24));
  const updateColor = daysSinceUpdate <= 30 ? "text-emerald-500" : daysSinceUpdate <= 60 ? "text-amber-500" : "text-destructive";

  const ownerTypeConfig: Record<string, { icon: typeof User; color: string; label: string }> = {
    Construtora: { icon: Building2, color: "text-blue-400 bg-blue-500/10", label: "Construtora" },
    Investidor: { icon: DollarSign, color: "text-amber-400 bg-amber-500/10", label: "Investidor" },
    Particular: { icon: User, color: "text-emerald-400 bg-emerald-500/10", label: "Particular" },
    "Adm Comercial": { icon: ShieldCheck, color: "text-purple-400 bg-purple-500/10", label: "Adm Comercial" },
  };

  const ownerTypeInfo = property.ownerType ? ownerTypeConfig[property.ownerType] : null;
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);

  return (
    <div className={cn("elevated-card rounded-xl relative overflow-hidden transition-all duration-300", animatePulse && "animate-sold-pulse")}>
      {showCelebration && <SoldCelebration />}

      <div className="flex items-stretch overflow-x-auto">

        {/* ── COL 1: Foto com carrossel ── */}
        <div className="relative w-[200px] h-[200px] flex-shrink-0">
          <RowCarousel images={property.images.length > 0 ? property.images : [property.image]} />
          {ownerTypeInfo && (
            <span className={cn("absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide shadow-sm", ownerTypeInfo.color)}>
              {ownerTypeInfo.label}
            </span>
          )}
          {/* Favorite heart on photo */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(property.id); }}
            className={cn("absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110",
              isFavorited ? "bg-red-500 text-white" : "bg-foreground/30 text-white hover:bg-red-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
          </button>
        </div>

        {/* ── COL 2: Identidade + Dados Técnicos ── */}
        <div className="flex-1 min-w-0 border-r border-border px-4 py-2 flex flex-col justify-center gap-1">
          {/* Row 1: Title + Code */}
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className="font-bold text-card-foreground text-base truncate hover:text-primary cursor-pointer transition-colors leading-tight uppercase"
              onClick={() => onFilterByTitle?.(property.title)}
              title="Ver títulos semelhantes"
            >{property.title}</h3>
            {property.code && (
              <span className="text-[11px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0">{property.code}</span>
            )}
          </div>

          {/* Row 2: Empreendimento + Units */}
          {(property.empreendimento || unitParts.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {property.empreendimento && (
                <Link
                  to={`/empreendimento/${property.empreendimento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                  className="font-black text-foreground uppercase text-[13px] tracking-wide px-3 py-0.5 rounded-md border border-border bg-background hover:bg-muted transition-colors shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >{property.empreendimento}</Link>
              )}
              {unitParts.map((part) => (
                <span key={part} className="font-black text-foreground uppercase text-[12px] tracking-wide px-2.5 py-0.5 rounded-md border border-border bg-background shadow-sm">{part}</span>
              ))}
            </div>
          )}

          {/* Row 3: Type + Specs (inline) */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5 text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded whitespace-nowrap text-[10px]">
              {property.type === "Apartamento" ? <Building2 className="w-3 h-3" /> : property.type === "Casa" ? <Home className="w-3 h-3" /> : property.type === "Terreno" ? <TreePine className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
              {property.type}
            </span>
            {property.bedrooms > 0 && <span className="flex items-center gap-0.5 whitespace-nowrap"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-0.5 whitespace-nowrap"><Bath className="w-3 h-3" />{property.bathrooms}</span>}
            {property.parking > 0 && <span className="flex items-center gap-0.5 whitespace-nowrap"><Car className="w-3 h-3" />{property.parking}</span>}
            <span className="flex items-center gap-0.5 font-semibold whitespace-nowrap"><Ruler className="w-3 h-3" />{property.area}m²</span>
            {property.privateArea && <span className="flex items-center gap-0.5 font-semibold whitespace-nowrap"><Ruler className="w-3 h-3" />{property.privateArea}m² priv.</span>}
          </div>

          {/* Row 3b: Posição, Solar, Infra, Vista, Condição, Vista Mar, Decorado */}
          {(property.posicaoPredio || property.posicaoSolar || property.vista || property.condicao || (property.infraestrutura && property.infraestrutura.length > 0) || property.seaView || property.decorated) && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
              {property.posicaoPredio && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted font-semibold whitespace-nowrap">
                  <Building2 className="w-3 h-3" /> {property.posicaoPredio}
                </span>
              )}
              {property.posicaoSolar && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold whitespace-nowrap">
                  ☀️ {property.posicaoSolar}
                </span>
              )}
              {property.vista && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-semibold whitespace-nowrap">
                  <Eye className="w-3 h-3" /> {property.vista}
                </span>
              )}
              {property.seaView && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold whitespace-nowrap">🌊 Vista Mar</span>}
              {property.decorated && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold whitespace-nowrap">🎨 Decorado</span>}
              {property.condicao && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold whitespace-nowrap">
                  🏠 {property.condicao}
                </span>
              )}
              {property.infraestrutura && property.infraestrutura.length > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted font-semibold whitespace-nowrap">
                  🏗️ {property.infraestrutura.join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Row 4: Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {property.exclusivityTerm && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold whitespace-nowrap">📄 Exclusivo</span>}
          </div>

          {/* Row 5: Location */}
          <button
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.neighborhood || ""}, ${property.city}`)}`, "_blank");
            }}
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{property.city}{property.neighborhood ? ` • ${property.neighborhood}` : ""} • {property.address}</span>
          </button>
        </div>

        {/* ── COL 3: Financeiro ── */}
        <div className="w-[220px] flex-shrink-0 border-r border-border px-3 py-2 flex flex-col justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {/* Main price */}
          <InlinePrice value={property.price} onChange={(v) => onPriceChange?.(property.id, "price", v)} className="text-[22px] font-black text-emerald-500 drop-shadow-sm" />

          {/* Promotional price */}
          {property.priceInstallment && (
            <div className="mt-0.5">
              <InlinePrice value={property.priceInstallment} onChange={(v) => onPriceChange?.(property.id, "priceInstallment", v)} className="text-[14px] font-bold text-red-500" />
              <span className="text-[8px] text-muted-foreground uppercase font-semibold tracking-wider ml-1">Valor Promocional</span>
            </div>
          )}

          {/* Payment conditions */}
          {property.paymentConditions && property.paymentConditions.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {property.paymentConditions.map((cond) => (
                <button key={cond}
                  className="px-1.5 py-0.5 rounded text-[9px] font-black text-foreground bg-muted uppercase tracking-wide hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => onFilterByCondition?.(cond)}
                >{cond}</button>
              ))}
            </div>
          )}

          {/* Commission */}
          {property.commission != null && (
            <div className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded bg-primary/10 border border-primary/20">
              <Percent className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-primary uppercase tracking-wide">Comissão {property.commission}%</span>
                <span className="text-[14px] font-black text-primary">{formatCurrency(Math.round(property.price * (property.commission / 100)))}</span>
              </div>
            </div>
          )}

          {/* Bonus */}
          {property.bonus != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <Gift className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
              <span className="text-[8px] font-bold text-red-500 uppercase">Bônus</span>
              <span className="text-[10px] font-black text-red-500">{formatCurrency(property.bonus)}</span>
              {property.bonusExpiry && (
                <span className="text-[8px] font-medium text-red-400">• Val. {new Date(property.bonusExpiry).toLocaleDateString("pt-BR")}</span>
              )}
            </div>
          )}

          {/* Contract shortcut */}
          <button
            onClick={() => onNavigateToContract?.(property)}
            className="flex items-center gap-1 mt-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-[9px] font-bold uppercase tracking-wide"
            title="Gerar contrato com dados do imóvel"
          >
            <FileSignature className="w-3 h-3" /> Gerar Contrato
          </button>
        </div>

        {/* ── COL 3.5: Analytics ── */}
        <div className="w-[170px] flex-shrink-0 border-r border-border px-3 py-2 flex flex-col justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-black text-primary uppercase tracking-wider">Analytics</span>
          </div>

          {/* Deal Thermometer */}
          <DealThermometer dealScore={dealScore} manualLabel={property.dealLabel} />

          {/* View counter */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/50">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[12px] font-bold text-foreground">{property.views ?? Math.floor(Math.random() * 200 + 10)}</span>
            <span className="text-[10px] text-muted-foreground">views</span>
          </div>

          {/* Valuation link */}
          <button
            onClick={() => onNavigateToValuation?.(property)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold uppercase tracking-wide"
            title="Avaliar imóvel com IA"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Avaliar com IA
          </button>
        </div>

        {/* ── COL 4: Proprietário + Chaves + Datas + Status ── */}
        <div className="w-[190px] flex-shrink-0 border-r border-border px-3 py-2 flex flex-col justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {property.owner ? (
            <>
              <button
                className="text-[13px] font-bold text-foreground hover:text-primary transition-colors truncate text-left leading-tight"
                onClick={() => onFilterByOwner?.(property.owner!)}
                title={`Ver todos imóveis de ${property.owner}`}
              >{property.owner}</button>
              {property.ownerPhone && (
                <a
                  href={`https://wa.me/${property.ownerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-3 h-3" /> {property.ownerPhone.replace(/^55/, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                </a>
              )}
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Sem proprietário</span>
          )}
          {/* Keys */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Key className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span className="truncate font-bold text-foreground">{property.keysLocation || "Não informado"}</span>
          </div>
          {/* Dates */}
          <div className="space-y-0.5 text-[10px] text-muted-foreground">
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-0.5"><CalendarCheck className="w-3 h-3" /> Inclusão</span>
              <span className="font-medium text-foreground">{createdFormatted}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-0.5"><CalendarClock className="w-3 h-3" /> Atualização</span>
              <span className={cn("font-semibold", updateColor)}>{updatedFormatted}</span>
            </div>
          </div>
          {/* Quick status selector */}
          <div className="flex items-center gap-0.5 flex-wrap mt-0.5">
            {allStatuses.map((s) => {
              const cfg = statusConfig[s];
              const active = s === property.status;
              return (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={cn("px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wide transition-all",
                    active ? `${cfg.bg} ${cfg.color} ${cfg.border} border` : "text-muted-foreground hover:bg-muted"
                  )}
                >{statusLabels[s]}</button>
              );
            })}
          </div>
        </div>

        {/* ── COL 5: Ações (ícones) ── */}
        <div className="w-[52px] flex-shrink-0 flex flex-col items-center justify-center gap-1.5 py-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSelect?.(property)}
            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors" title="Editar"
          ><Pencil className="w-3.5 h-3.5 text-primary" /></button>
          <button
            onClick={() => {
              property.images.forEach((img, i) => {
                const a = document.createElement("a"); a.href = img; a.download = `${property.title.replace(/\s+/g, "_")}_foto_${i + 1}.jpg`; a.target = "_blank"; a.click();
              });
              toast.success(`${property.images.length} foto(s) baixando...`);
            }}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors" title="Fotos"
          ><Image className="w-3.5 h-3.5 text-foreground" /></button>
          <button
            onClick={() => { toast.info("Gerando PDF..."); }}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors" title="PDF"
          ><Download className="w-3.5 h-3.5 text-foreground" /></button>
          <button
            onClick={async () => {
              const shareData = { title: property.title, text: `${property.title} - ${formatCurrency(property.price)}\n${property.address}, ${property.city}`, url: window.location.href };
              if (navigator.share) { try { await navigator.share(shareData); } catch { /* cancelled */ } }
              else { await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`); toast.success("Link copiado!"); }
            }}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors" title="Compartilhar"
          ><Share2 className="w-3.5 h-3.5 text-foreground" /></button>
        </div>
      </div>
    </div>
  );
}

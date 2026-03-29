import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Building2, Paintbrush, Wrench, DollarSign, Shield, Zap, Home, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";

interface Partner {
  name: string;
  logo: string;
  category: string;
  description: string;
}

const allPartners: Partner[] = [
  { name: "Construtora Litoral", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&h=200&fit=crop", category: "Construtoras", description: "Construção civil e empreendimentos residenciais" },
  { name: "Incorporadora Sul", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=200&fit=crop", category: "Construtoras", description: "Incorporação e desenvolvimento imobiliário" },
  { name: "Imobiliária Central", logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop", category: "Imobiliárias", description: "Venda e locação de imóveis residenciais e comerciais" },
  { name: "Porto Seguro Imóveis", logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop", category: "Imobiliárias", description: "Especialistas em imóveis de alto padrão" },
  { name: "Engenharia & Projetos", logo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=200&fit=crop", category: "Engenharia", description: "Projetos estruturais e laudos técnicos" },
  { name: "Financeira Prime", logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop", category: "Financeiro", description: "Financiamento e crédito imobiliário" },
  { name: "Seguradora Atlas", logo: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=200&fit=crop", category: "Seguros", description: "Seguros residenciais e empresariais" },
  { name: "Arquitetura Moderna", logo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=200&fit=crop", category: "Arquitetura", description: "Projetos arquitetônicos e urbanismo" },
  { name: "Design & Interiores", logo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=200&fit=crop", category: "Arquitetura", description: "Design de interiores e decoração" },
  { name: "Solar Energia", logo: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=200&fit=crop", category: "Energia", description: "Energia solar e sustentabilidade" },
  { name: "Pinturas Express", logo: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=200&fit=crop", category: "Reformas", description: "Pintura residencial e comercial" },
  { name: "Elétrica Master", logo: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=200&fit=crop", category: "Reformas", description: "Instalações elétricas e manutenção" },
  { name: "Advocacia Imobiliária", logo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop", category: "Jurídico", description: "Assessoria jurídica para transações imobiliárias" },
  { name: "Cartório Digital", logo: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=400&h=200&fit=crop", category: "Jurídico", description: "Registro e documentação imobiliária" },
  { name: "Mudanças Rápidas", logo: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=200&fit=crop", category: "Serviços", description: "Transporte e mudanças residenciais" },
  { name: "Limpeza Total", logo: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=200&fit=crop", category: "Serviços", description: "Limpeza pós-obra e manutenção" },
];

const categoryIcons: Record<string, typeof Building2> = {
  "Construtoras": Building2,
  "Imobiliárias": Home,
  "Engenharia": Wrench,
  "Financeiro": DollarSign,
  "Seguros": Shield,
  "Arquitetura": Paintbrush,
  "Energia": Zap,
  "Reformas": Wrench,
  "Jurídico": Shield,
  "Serviços": Wrench,
};

const categoryColors: Record<string, string> = {
  "Construtoras": "bg-blue-100 text-blue-700 border-blue-200",
  "Imobiliárias": "bg-amber-100 text-amber-700 border-amber-200",
  "Engenharia": "bg-slate-100 text-slate-700 border-slate-200",
  "Financeiro": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Seguros": "bg-purple-100 text-purple-700 border-purple-200",
  "Arquitetura": "bg-pink-100 text-pink-700 border-pink-200",
  "Energia": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Reformas": "bg-orange-100 text-orange-700 border-orange-200",
  "Jurídico": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Serviços": "bg-teal-100 text-teal-700 border-teal-200",
};

export default function Parceiros() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const categories = useMemo(() => {
    const cats = [...new Set(allPartners.map(p => p.category))];
    return ["Todos", ...cats.sort()];
  }, []);

  const filtered = useMemo(() => {
    return allPartners.filter(p => {
      const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === "Todos" || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [searchTerm, activeCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, Partner[]> = {};
    filtered.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-4">
            <BackButton />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-extrabold">Parceiros</h1>
          </div>
          <p className="text-gray-400 text-sm">Empresas e profissionais que fazem parte da nossa rede de confiança</p>

          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar parceiro..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                activeCategory === cat
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:shadow-sm"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-6">
          {filtered.length} {filtered.length === 1 ? "parceiro encontrado" : "parceiros encontrados"}
          {activeCategory !== "Todos" && ` em "${activeCategory}"`}
          {searchTerm && ` para "${searchTerm}"`}
        </p>

        {/* Grouped by category */}
        {grouped.length > 0 ? (
          <div className="space-y-10">
            {grouped.map(([category, partners]) => {
              const Icon = categoryIcons[category] || Building2;
              return (
                <section key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", categoryColors[category] || "bg-gray-100 text-gray-600")}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{category}</h2>
                    <span className="text-xs text-gray-400 ml-1">({partners.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {partners.map(partner => (
                      <Link
                        key={partner.name}
                        to={`/parceiro/${toSlug(partner.name)}`}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all group overflow-hidden"
                      >
                        <div className="h-36 overflow-hidden">
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-gray-900 group-hover:text-amber-700 transition-colors truncate">{partner.name}</h3>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{partner.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5" />
                          </div>
                          <span className={cn(
                            "inline-block mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                            categoryColors[partner.category] || "bg-gray-100 text-gray-600 border-gray-200"
                          )}>
                            {partner.category}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum parceiro encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

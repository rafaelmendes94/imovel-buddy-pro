import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import {
  Search, ShoppingBag, Package, MapPin, Phone, X,
  ChevronLeft, ChevronRight, Tag, Filter, Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const categorias = ["Eletrônicos", "Móveis", "Veículos", "Roupas", "Esportes", "Ferramentas", "Livros", "Decoração", "Eletrodomésticos", "Outros"];

interface BrickItem {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string;
  preco: number;
  categoria: string;
  estado: string;
  cidade: string;
  telefone: string;
  imagens: string[];
  vendido: boolean;
  created_at: string;
  seller_name?: string;
}

export default function BrickStore() {
  const [items, setItems] = useState<BrickItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [priceSort, setPriceSort] = useState<"" | "asc" | "desc">("");
  const [selectedItem, setSelectedItem] = useState<BrickItem | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("brick_items" as any)
        .select("*")
        .eq("vendido", false)
        .order("created_at", { ascending: false });

      if (data) {
        // Get seller names from profiles
        const userIds = [...new Set((data as any[]).map((d: any) => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach(p => { nameMap[p.user_id] = p.full_name; });

        setItems((data as any[]).map((d: any) => ({
          ...d,
          seller_name: nameMap[d.user_id] || "Corretor",
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.titulo.toLowerCase().includes(search.toLowerCase()) ||
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.cidade?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || item.categoria === filterCat;
    const matchEstado = !filterEstado || item.estado === filterEstado;
    return matchSearch && matchCat && matchEstado;
  }).sort((a, b) => {
    if (priceSort === "asc") return a.preco - b.preco;
    if (priceSort === "desc") return b.preco - a.preco;
    return 0;
  });

  const hasFilters = search || filterCat || filterEstado || priceSort;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-gray-50 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-amber-600 transition-colors">
              <Home className="w-4 h-4" /> Voltar ao Site
            </Link>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-gray-900">Brick</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Brique dos Corretores</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            🛒 Brick – O Brique dos Corretores
          </h1>
          <p className="text-amber-100 text-sm sm:text-base max-w-xl mx-auto">
            Encontre achados incríveis! Corretores anunciam itens usados com preços imbatíveis.
          </p>
          {/* Search */}
          <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-xl max-w-xl mx-auto">
            <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por item, categoria ou cidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-1.5 rounded-lg hover:bg-gray-100 mr-1">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </div>
          {/* Category chips */}
          <button
            onClick={() => setFilterCat("")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              !filterCat ? "bg-amber-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? "" : cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                filterCat === cat ? "bg-amber-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
          <span className="text-gray-300 mx-1">|</span>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white"
          >
            <option value="">Estado: Todos</option>
            <option value="Novo">Novo</option>
            <option value="Semi-novo">Semi-novo</option>
            <option value="Usado">Usado</option>
          </select>
          <select
            value={priceSort}
            onChange={e => setPriceSort(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white"
          >
            <option value="">Ordenar: Recentes</option>
            <option value="asc">Menor preço</option>
            <option value="desc">Maior preço</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterCat(""); setFilterEstado(""); setPriceSort(""); }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-500 hover:bg-gray-200"
            >
              Limpar filtros
            </button>
          )}
          <span className="ml-auto text-xs font-bold text-gray-500">{filtered.length} item(ns)</span>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package className="w-20 h-20 mx-auto text-gray-200" />
            <p className="text-xl font-bold text-gray-400">Nenhum item encontrado</p>
            <p className="text-sm text-gray-400">Tente mudar os filtros ou volte mais tarde!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => { setSelectedItem(item); setImgIndex(0); }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="relative h-40 bg-gray-100">
                  {item.imagens?.length > 0 ? (
                    <img src={item.imagens[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-200" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                    {item.categoria}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-700 shadow-sm border border-gray-100">
                    {item.estado}
                  </span>
                </div>
                <div className="p-3 space-y-1.5">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-amber-600 transition-colors">{item.titulo}</h3>
                  <p className="text-lg font-extrabold text-amber-600">{formatCurrency(item.preco)}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    {item.cidade && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {item.cidade}</span>}
                    <span>{item.seller_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Image gallery */}
            <div className="relative h-64 bg-gray-100">
              {selectedItem.imagens?.length > 0 ? (
                <>
                  <img src={selectedItem.imagens[imgIndex]} className="w-full h-full object-cover" />
                  {selectedItem.imagens.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex(i => i > 0 ? i - 1 : selectedItem.imagens.length - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setImgIndex(i => i < selectedItem.imagens.length - 1 ? i + 1 : 0)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {selectedItem.imagens.map((_, i) => (
                          <span key={i} className={cn("w-2 h-2 rounded-full transition-all", i === imgIndex ? "bg-white w-4" : "bg-white/50")} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-gray-200" /></div>
              )}
              <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">{selectedItem.titulo}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{selectedItem.categoria}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{selectedItem.estado}</span>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-amber-600 whitespace-nowrap">{formatCurrency(selectedItem.preco)}</p>
              </div>

              {selectedItem.descricao && (
                <p className="text-sm text-gray-600 leading-relaxed">{selectedItem.descricao}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                {selectedItem.cidade && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedItem.cidade}</span>}
                <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {selectedItem.seller_name}</span>
              </div>

              {selectedItem.telefone && (
                <a
                  href={`https://wa.me/55${selectedItem.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Vi o anúncio "${selectedItem.titulo}" no Brick e tenho interesse!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-md"
                >
                  <Phone className="w-4 h-4" /> Chamar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-xs">
        <p>Brick – Brique dos Corretores • MV Connect © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

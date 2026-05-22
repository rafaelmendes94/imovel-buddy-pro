import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Building2, Paintbrush, Wrench, DollarSign, Shield, Zap, Home, ChevronRight, X, Handshake, Scale, Truck, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import logoMvBroker from "@/assets/logo-mv-broker.png";

interface Partner {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  category: string;
  city?: string | null;
  phone?: string | null;
  rating?: number | null;
  total_ratings?: number | null;
}

const categoryIcons: Record<string, typeof Building2> = {
  "Construtoras": Building2,
  "Imobiliárias": Home,
  "Engenharia": Wrench,
  "Financeiro": DollarSign,
  "Seguros": Shield,
  "Arquitetura": Paintbrush,
  "Energia": Zap,
  "Reformas": Wrench,
  "Jurídico": Scale,
  "Serviços": Truck,
};

const categoryColors: Record<string, string> = {
  "Construtoras": "bg-blue-950/10 text-blue-950 border-blue-900/20",
  "Imobiliárias": "bg-blue-600/10 text-blue-700 border-blue-600/20",
  "Engenharia": "bg-slate-800/10 text-slate-800 border-slate-700/20",
  "Financeiro": "bg-sky-500/10 text-sky-700 border-sky-500/20",
  "Seguros": "bg-blue-800/10 text-blue-800 border-blue-800/20",
  "Arquitetura": "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  "Energia": "bg-blue-400/10 text-blue-600 border-blue-400/20",
  "Reformas": "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  "Jurídico": "bg-blue-900/10 text-blue-900 border-blue-900/20",
  "Serviços": "bg-slate-600/10 text-slate-700 border-slate-600/20",
};

export default function Parceiros() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [allPartners, setAllPartners] = useState<Partner[]>([]);

  useEffect(() => {
    supabase
      .from("partners")
      .select("id, name, slug, logo_url, description, category, city, phone, rating, total_ratings")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setAllPartners((data as any) || []));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(allPartners.map(p => p.category))];
    return ["Todos", ...cats.sort()];
  }, [allPartners]);

  const filtered = useMemo(() => {
    return allPartners.filter(p => {
      const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === "Todos" || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [searchTerm, activeCategory, allPartners]);

  const grouped = useMemo(() => {
    const groups: Record<string, Partner[]> = {};
    filtered.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const allGrouped = [...new Set(allPartners.map(p => p.category))].sort().map(c => [c, allPartners.filter(p => p.category === c)] as [string, Partner[]]);

    // Cover
    doc.setFillColor(15, 27, 61);
    doc.rect(0, 0, pageW, 160, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Catálogo de Parceiros", 40, 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("MV BROKER CONNECT — Rede de confiança", 40, 95);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), 40, 115);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Sumário", 40, 200);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let y = 225;
    allGrouped.forEach(([cat, list], i) => {
      doc.text(`${i + 1}. ${cat}`, 50, y);
      doc.text(`${list.length} ${list.length === 1 ? "parceiro" : "parceiros"}`, pageW - 40, y, { align: "right" });
      y += 20;
    });

    // One category per page
    allGrouped.forEach(([cat, list]) => {
      doc.addPage();
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, pageW, 70, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(cat, 40, 35);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${list.length} ${list.length === 1 ? "profissional" : "profissionais"}`, 40, 55);

      autoTable(doc, {
        startY: 95,
        head: [["#", "Profissional", "Cidade", "Contato", "Nota"]],
        body: list.map((p, i) => [
          String(i + 1),
          p.name,
          p.city || "—",
          p.phone || "—",
          p.rating && p.rating > 0 ? `★ ${Number(p.rating).toFixed(1)} (${p.total_ratings || 0})` : "Sem avaliação",
        ]),
        styles: { font: "helvetica", fontSize: 10, cellPadding: 8, valign: "middle" },
        headStyles: { fillColor: [15, 27, 61], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles: {
          0: { cellWidth: 30, halign: "center" },
          4: { cellWidth: 110, halign: "center", fontStyle: "bold", textColor: [180, 120, 0] },
        },
        margin: { left: 40, right: 40 },
      });
    });

    // Footer page numbers
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Página ${i} de ${total}`, pageW - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
      doc.text("MV BROKER CONNECT", 40, doc.internal.pageSize.getHeight() - 20);
    }

    doc.save(`parceiros-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-4"><BackButton /></div>
          <div className="flex items-center gap-4 mb-2">
            <img src={logoMvBroker} alt="MV BROKER CONNECT" className="h-16 w-16 object-contain rounded-lg bg-white p-1" />
            <div>
              <div className="flex items-center gap-3">
                <Handshake className="w-7 h-7 text-blue-300" />
                <h1 className="text-3xl font-extrabold">Parceiros</h1>
              </div>
              <p className="text-blue-300 text-sm mt-1">Empresas e profissionais que fazem parte da nossa rede de confiança</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar parceiro..." className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:bg-white/20" />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-blue-300 hover:text-white" />
                </button>
              )}
            </div>
            <button
              onClick={exportPdf}
              disabled={allPartners.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-950 hover:bg-blue-50 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                activeCategory === cat ? "bg-blue-950 text-white border-blue-950 shadow-md" : "bg-card text-foreground border-border hover:border-blue-400 hover:shadow-sm"
              )}>
              {cat}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {filtered.length} {filtered.length === 1 ? "parceiro encontrado" : "parceiros encontrados"}
          {activeCategory !== "Todos" && ` em "${activeCategory}"`}
          {searchTerm && ` para "${searchTerm}"`}
        </p>

        {grouped.length > 0 ? (
          <div className="space-y-10">
            {grouped.map(([category, partners]) => {
              const Icon = categoryIcons[category] || Building2;
              return (
                <section key={category}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/30">
                      <Icon className="w-4.5 h-4.5" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg font-extrabold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 bg-clip-text text-transparent tracking-tight">
                      {category}
                    </h2>
                    <span className="text-xs text-muted-foreground ml-1">({partners.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {partners.map(partner => (
                      <Link key={partner.id} to={`/parceiro/${partner.slug}`}
                        className="bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-blue-400 transition-all group overflow-hidden">
                        <div className="h-36 overflow-hidden">
                          <img src={partner.logo_url || "/placeholder.svg"} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-foreground group-hover:text-blue-700 transition-colors truncate">{partner.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{partner.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
                          </div>
                          <span className={cn("inline-block mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border", categoryColors[partner.category] || "bg-blue-100 text-blue-800 border-blue-200")}>
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
            <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum parceiro encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Phone, Mail, Globe, Star, ArrowLeft, Home,
  Instagram, MessageCircle, Calendar, Layers, TrendingUp, Award,
  BedDouble, Ruler, Car, Bath, ChevronDown, Search, X, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Construtora {
  id: string; nome: string; slug: string; descricao: string;
  logo_url: string | null; cover_url: string | null; perfil_url: string | null;
  cidade: string; estado: string; telefone: string; email: string; website: string;
  instagram: string; whatsapp: string; cnpj: string; ano_fundacao: string;
  cor_primaria: string; cor_secundaria: string; cor_texto: string; cor_fundo: string;
  avaliacao: number; total_avaliacoes: number;
}

interface Empreendimento {
  id: string; nome: string; endereco: string; cidade: string; status: string;
  tipo: string; total_unidades: number; unidades_vendidas: number;
  previsao_entrega: string; imagem_url: string | null; descricao: string;
}

interface Unidade {
  id: string; empreendimento_id: string; numero: string; andar: string;
  tipo: string; area: number; quartos: number; preco: number; status: string;
}

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabels: Record<string, { bg: string; text: string }> = {
  "Lançamento": { bg: "bg-blue-500", text: "text-white" },
  "Em construção": { bg: "bg-amber-500", text: "text-white" },
  "Pronto": { bg: "bg-emerald-500", text: "text-white" },
  "Entregue": { bg: "bg-gray-500", text: "text-white" },
};

const unitColors: Record<string, string> = {
  "Disponível": "bg-emerald-500 text-white",
  "Reservado": "bg-amber-500 text-white",
  "Vendido": "bg-red-500 text-white",
  "Decorado": "bg-blue-500 text-white",
};

type ActiveSection = "sobre" | "empreendimentos" | "contato";

export default function ConstrutoraSite() {
  const { slug } = useParams<{ slug: string }>();
  const [construtora, setConstrutora] = useState<Construtora | null>(null);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [unidades, setUnidades] = useState<Record<string, Unidade[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>("sobre");
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  useEffect(() => {
    if (slug) fetchData();
  }, [slug]);

  const fetchData = async () => {
    const { data: cData } = await supabase.from("construtoras").select("*").eq("slug", slug!).single();
    if (!cData) { setLoading(false); return; }
    setConstrutora(cData as Construtora);

    const { data: eData } = await supabase.from("construtora_empreendimentos").select("*").eq("construtora_id", cData.id).order("nome");
    if (eData) {
      setEmpreendimentos(eData as Empreendimento[]);
      const empIds = (eData as Empreendimento[]).map(e => e.id);
      if (empIds.length > 0) {
        const { data: uData } = await supabase.from("construtora_unidades").select("*").in("empreendimento_id", empIds).order("andar,numero");
        if (uData) {
          const grouped: Record<string, Unidade[]> = {};
          (uData as Unidade[]).forEach(u => {
            if (!grouped[u.empreendimento_id]) grouped[u.empreendimento_id] = [];
            grouped[u.empreendimento_id].push(u);
          });
          setUnidades(grouped);
        }
      }
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Carregando...</div>
    </div>
  );

  if (!construtora) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Building2 className="w-12 h-12 mx-auto text-gray-300" />
        <p className="text-gray-500 text-lg">Construtora não encontrada</p>
        <Link to="/" className="text-amber-600 font-bold hover:underline">← Voltar ao site</Link>
      </div>
    </div>
  );

  const c = construtora;
  const totalUnidades = empreendimentos.reduce((s, e) => s + (e.total_unidades || 0), 0);
  const totalVendidas = empreendimentos.reduce((s, e) => s + (e.unidades_vendidas || 0), 0);
  const whatsappMsg = encodeURIComponent(`Olá! Vi a página da ${c.nome} e gostaria de mais informações.`);

  const navItems: { key: ActiveSection; label: string }[] = [
    { key: "sobre", label: "Sobre" },
    { key: "empreendimentos", label: "Empreendimentos" },
    { key: "contato", label: "Contato" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b shadow-sm" style={{ backgroundColor: `${c.cor_primaria}f0` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 transition-colors" style={{ color: c.cor_texto }}>
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              {c.perfil_url ? (
                <img src={c.perfil_url} alt={c.nome} className="w-8 h-8 rounded-lg object-cover border border-white/30" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.cor_secundaria }}>
                  <Building2 className="w-4 h-4" style={{ color: c.cor_texto }} />
                </div>
              )}
              <span className="text-lg font-extrabold" style={{ color: c.cor_texto }}>{c.nome}</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setActiveSection(item.key)}
                className={cn("transition-colors hover:opacity-100", activeSection === item.key ? "opacity-100 font-bold" : "opacity-70")}
                style={{ color: c.cor_texto }}
              >{item.label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {c.whatsapp && (
              <a href={`https://wa.me/${c.whatsapp}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
                style={{ backgroundColor: c.cor_secundaria, color: c.cor_texto }}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.cor_fundo}, ${c.cor_primaria})` }}>
        {c.cover_url && (
          <div className="absolute inset-0 opacity-20">
            <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 shadow-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm" style={{ borderColor: `${c.cor_secundaria}80` }}>
                {c.perfil_url ? <img src={c.perfil_url} alt={c.nome} className="w-full h-full object-cover" /> : <Building2 className="w-14 h-14" style={{ color: c.cor_texto }} />}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center sm:text-left space-y-3 flex-1">
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight" style={{ color: c.cor_texto }}>{c.nome}</h1>
              {c.cidade && (
                <p className="text-sm flex items-center gap-1 justify-center sm:justify-start" style={{ color: `${c.cor_texto}99` }}>
                  <MapPin className="w-4 h-4" /> {c.cidade}{c.estado ? `, ${c.estado}` : ""}
                </p>
              )}
              {c.ano_fundacao && <p className="text-sm" style={{ color: `${c.cor_texto}80` }}>Desde {c.ano_fundacao}</p>}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                {[
                  { icon: Layers, value: empreendimentos.length, label: "Empreendimentos" },
                  { icon: Building2, value: totalUnidades, label: "Unidades" },
                  { icon: TrendingUp, value: totalVendidas, label: "Vendidas" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 border backdrop-blur-sm"
                    style={{ backgroundColor: `${c.cor_texto}10`, borderColor: `${c.cor_texto}20` }}>
                    <stat.icon className="w-5 h-5" style={{ color: c.cor_secundaria }} />
                    <div>
                      <p className="font-extrabold text-lg leading-none" style={{ color: c.cor_texto }}>{stat.value}</p>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: `${c.cor_texto}70` }}>{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
                {c.avaliacao > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 border backdrop-blur-sm"
                    style={{ backgroundColor: `${c.cor_texto}10`, borderColor: `${c.cor_texto}20` }}>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-4 h-4", s <= Math.round(Number(c.avaliacao)) ? "fill-amber-400 text-amber-400" : "text-gray-500")} />)}
                    </div>
                    <div>
                      <p className="font-extrabold text-lg leading-none" style={{ color: c.cor_texto }}>{Number(c.avaliacao).toFixed(1)}</p>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: `${c.cor_texto}70` }}>{c.total_avaliacoes} avaliações</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile Nav */}
      <div className="md:hidden sticky top-16 z-40 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 p-2">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              className={cn("px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                activeSection === item.key ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              style={activeSection === item.key ? { backgroundColor: c.cor_primaria, color: c.cor_texto } : {}}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Sobre */}
        {activeSection === "sobre" && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {c.descricao && (
              <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Sobre a {c.nome}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{c.descricao}</p>
              </div>
            )}
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Calendar, value: c.ano_fundacao || "-", label: "Fundação", color: c.cor_primaria },
                { icon: Layers, value: `${empreendimentos.length}`, label: "Empreendimentos", color: c.cor_secundaria },
                { icon: Building2, value: `${totalUnidades}`, label: "Unidades Totais", color: c.cor_primaria },
                { icon: Award, value: c.avaliacao > 0 ? Number(c.avaliacao).toFixed(1) : "-", label: "Avaliação", color: "#f59e0b" },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                  <s.icon className="w-6 h-6 mx-auto mb-2" style={{ color: s.color }} />
                  <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Empreendimentos */}
        {activeSection === "empreendimentos" && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: c.cor_primaria }}>
                <Layers className="w-5 h-5" style={{ color: c.cor_texto }} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Empreendimentos</h2>
                <p className="text-sm text-gray-500">{empreendimentos.length} empreendimentos</p>
              </div>
            </div>

            {empreendimentos.map((emp, idx) => {
              const empUnits = unidades[emp.id] || [];
              const progress = emp.total_unidades > 0 ? Math.round((emp.unidades_vendidas / emp.total_unidades) * 100) : 0;
              const isExpanded = expandedEmp === emp.id;
              const statusStyle = statusLabels[emp.status] || { bg: "bg-gray-500", text: "text-white" };

              return (
                <motion.div key={emp.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">{emp.nome}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold", statusStyle.bg, statusStyle.text)}>{emp.status}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{emp.tipo}</span>
                          {emp.previsao_entrega && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{emp.previsao_entrega}</span>}
                        </div>
                      </div>
                      <button onClick={() => setExpandedEmp(isExpanded ? null : emp.id)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <ChevronDown className={cn("w-4 h-4 text-gray-600 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    </div>

                    {emp.endereco && <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{emp.endereco}{emp.cidade ? `, ${emp.cidade}` : ""}</p>}
                    {emp.descricao && <p className="text-sm text-gray-600 line-clamp-2">{emp.descricao}</p>}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-medium">Vendas</span>
                        <span className="font-bold text-gray-900">{emp.unidades_vendidas}/{emp.total_unidades} ({progress}%)</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }}
                          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${c.cor_primaria}, ${c.cor_secundaria})` }} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Espelho de Vendas */}
                  <AnimatePresence>
                    {isExpanded && empUnits.length > 0 && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 overflow-hidden">
                        <div className="p-6 space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Espelho de Vendas</h4>
                          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                            {empUnits.map(u => (
                              <div key={u.id} className="text-center">
                                <div className={cn("py-2 rounded-lg text-[9px] font-bold", unitColors[u.status] || "bg-gray-200 text-gray-600")}>
                                  {u.numero}
                                </div>
                                {u.preco > 0 && <p className="text-[8px] text-gray-400 mt-0.5">{formatCurrency(u.preco)}</p>}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4 flex-wrap pt-2">
                            {Object.entries(unitColors).map(([st, cls]) => (
                              <span key={st} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <span className={cn("w-3 h-3 rounded", cls)} /> {st} ({empUnits.filter(u => u.status === st).length})
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {empreendimentos.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum empreendimento cadastrado</p>
              </div>
            )}
          </motion.section>
        )}

        {/* Contato */}
        {activeSection === "contato" && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Entre em Contato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {c.telefone && (
                <a href={`tel:${c.telefone}`} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.cor_primaria}15` }}>
                    <Phone className="w-6 h-6" style={{ color: c.cor_primaria }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Telefone</p>
                    <p className="text-lg font-bold text-gray-900">{c.telefone}</p>
                  </div>
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.cor_primaria}15` }}>
                    <Mail className="w-6 h-6" style={{ color: c.cor_primaria }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">E-mail</p>
                    <p className="text-lg font-bold text-gray-900">{c.email}</p>
                  </div>
                </a>
              )}
              {c.whatsapp && (
                <a href={`https://wa.me/${c.whatsapp}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                  className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                    <MessageCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">WhatsApp</p>
                    <p className="text-lg font-bold text-gray-900">{c.whatsapp}</p>
                  </div>
                </a>
              )}
              {c.instagram && (
                <a href={`https://instagram.com/${c.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-50">
                    <Instagram className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Instagram</p>
                    <p className="text-lg font-bold text-gray-900">{c.instagram}</p>
                  </div>
                </a>
              )}
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer"
                  className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all flex items-center gap-4 sm:col-span-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.cor_primaria}15` }}>
                    <Globe className="w-6 h-6" style={{ color: c.cor_primaria }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Website</p>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-1">{c.website} <ExternalLink className="w-4 h-4 text-gray-400" /></p>
                  </div>
                </a>
              )}
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ backgroundColor: c.cor_fundo }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            {c.perfil_url ? (
              <img src={c.perfil_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <Building2 className="w-6 h-6" style={{ color: c.cor_texto }} />
            )}
            <span className="font-bold text-lg" style={{ color: c.cor_texto }}>{c.nome}</span>
          </div>
          <p className="text-sm" style={{ color: `${c.cor_texto}60` }}>
            © {new Date().getFullYear()} {c.nome}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Save, Edit, Trash2, Building2, MapPin, Phone, Globe, Star,
  Instagram, MessageCircle, FileText, Calendar, Mail, ExternalLink, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Construtora {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  logo_url: string | null;
  cover_url: string | null;
  perfil_url: string | null;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  website: string;
  instagram: string;
  whatsapp: string;
  cnpj: string;
  ano_fundacao: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_texto: string;
  cor_fundo: string;
  avaliacao: number;
  total_avaliacoes: number;
  status: string;
}

const emptyForm = {
  nome: "", slug: "", descricao: "", cidade: "", estado: "", telefone: "", email: "",
  website: "", instagram: "", whatsapp: "", cnpj: "", ano_fundacao: "",
  cor_primaria: "#1e3a5f", cor_secundaria: "#2563eb", cor_texto: "#ffffff", cor_fundo: "#111827",
};

const estadosBR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

export default function Construtoras() {
  const [construtoras, setConstrutoras] = useState<Construtora[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0=dados, 1=contato, 2=cores
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchConstrutoras = async () => {
    const { data, error } = await supabase.from("construtoras").select("*").order("nome");
    if (error) { toast.error("Erro ao carregar construtoras"); return; }
    setConstrutoras(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchConstrutoras(); }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async () => {
    if (!form.nome || !user) return;
    const slug = form.slug || generateSlug(form.nome);
    if (editingId) {
      const { error } = await supabase.from("construtoras").update({ ...form, slug, updated_at: new Date().toISOString() }).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Construtora atualizada!");
    } else {
      const { error } = await supabase.from("construtoras").insert({ ...form, slug, user_id: user.id });
      if (error) { toast.error("Erro ao cadastrar"); return; }
      toast.success("Construtora cadastrada!");
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setActiveTab(0);
    fetchConstrutoras();
  };

  const handleEdit = (c: Construtora) => {
    setForm({
      nome: c.nome, slug: c.slug, descricao: c.descricao || "", cidade: c.cidade || "",
      estado: c.estado || "", telefone: c.telefone || "", email: c.email || "",
      website: c.website || "", instagram: c.instagram || "", whatsapp: c.whatsapp || "",
      cnpj: c.cnpj || "", ano_fundacao: c.ano_fundacao || "",
      cor_primaria: c.cor_primaria || "#1e3a5f", cor_secundaria: c.cor_secundaria || "#2563eb",
      cor_texto: c.cor_texto || "#ffffff", cor_fundo: c.cor_fundo || "#111827",
    });
    setEditingId(c.id);
    setActiveTab(0);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta construtora?")) return;
    const { error } = await supabase.from("construtoras").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Construtora excluída!");
    fetchConstrutoras();
  };

  const filtered = construtoras.filter(
    (c) => c.nome.toLowerCase().includes(search.toLowerCase()) || c.cidade?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = ["Dados Gerais", "Contato & Redes", "Personalização"];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" /> Construtoras
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{construtoras.length} construtoras cadastradas</p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setActiveTab(0); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg self-start"
          >
            <Plus className="w-4 h-4" /> Nova Construtora
          </button>
        </motion.div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Buscar por nome ou cidade..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25 }}
                className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="text-lg font-bold text-card-foreground">
                    {editingId ? "✏️ Editar Construtora" : "🏗️ Nova Construtora"}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                  {tabs.map((t, i) => (
                    <button key={t} onClick={() => setActiveTab(i)}
                      className={cn("flex-1 py-3 text-xs font-semibold transition-all border-b-2",
                        activeTab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                      )}>{t}</button>
                  ))}
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                  {activeTab === 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nome da Construtora *</label>
                        <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Construtora ABC" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">CNPJ</label>
                        <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Ano de Fundação</label>
                        <input value={form.ano_fundacao} onChange={(e) => setForm({ ...form, ano_fundacao: e.target.value })} placeholder="Ex: 2005" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Cidade</label>
                        <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Ex: São Paulo" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Estado</label>
                        <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="">Selecione</option>
                          {estadosBR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Slug (URL)</label>
                        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Descrição / Sobre a empresa</label>
                        <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} placeholder="Descreva a história, missão e diferenciais da construtora..." className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                      </div>
                    </div>
                  )}

                  {activeTab === 1 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</label>
                        <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</label>
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@construtora.com" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</label>
                        <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
                        <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@construtora" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Globe className="w-3 h-3" /> Website</label>
                        <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://www.construtora.com.br" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-5">
                      <p className="text-xs text-muted-foreground">Personalize as cores da página da construtora para refletir a identidade visual da marca.</p>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: "cor_primaria", label: "Cor Primária", desc: "Usada no cabeçalho e botões" },
                          { key: "cor_secundaria", label: "Cor Secundária", desc: "Usada em gradientes e destaques" },
                          { key: "cor_texto", label: "Cor do Texto", desc: "Texto sobre áreas coloridas" },
                          { key: "cor_fundo", label: "Cor do Fundo", desc: "Fundo de seções escuras" },
                        ].map(c => (
                          <div key={c.key} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-input">
                            <input type="color" value={(form as any)[c.key]} onChange={e => setForm({ ...form, [c.key]: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 flex-shrink-0" />
                            <div>
                              <span className="text-sm font-medium text-card-foreground block">{c.label}</span>
                              <span className="text-[10px] text-muted-foreground">{c.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Preview */}
                      <div className="rounded-xl h-20 flex items-center justify-center shadow-inner overflow-hidden" style={{ background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})` }}>
                        <span style={{ color: form.cor_texto }} className="font-bold text-lg drop-shadow-md">{form.nome || "Preview"}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-5 border-t border-border">
                  <div className="flex gap-1">
                    {tabs.map((_, i) => (
                      <div key={i} className={cn("w-8 h-1 rounded-full transition-all", activeTab >= i ? "bg-primary" : "bg-muted")} />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-all shadow-md">
                      <Save className="w-4 h-4" /> {editingId ? "Salvar" : "Cadastrar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="elevated-card rounded-xl h-60 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/construtoras/${c.id}`)}
                className="elevated-card rounded-xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.cor_primaria}, ${c.cor_secundaria})` }}>
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-sm">
                      <Edit className="w-3.5 h-3.5 text-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-sm">
                      <Trash2 className="w-3.5 h-3.5 text-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`/construtora/${c.slug}`, '_blank'); }} className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-info/90 transition-colors shadow-sm" title="Ver página externa">
                      <ExternalLink className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  </div>
                  <div className="absolute -bottom-7 left-4">
                    <div className="w-14 h-14 rounded-xl border-3 border-card overflow-hidden bg-card shadow-lg flex items-center justify-center">
                      {c.perfil_url ? <img src={c.perfil_url} alt={c.nome} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-10 space-y-2">
                  <h3 className="font-bold text-card-foreground text-sm group-hover:text-primary transition-colors">{c.nome}</h3>
                  {c.cidade && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{c.cidade}{c.estado ? `, ${c.estado}` : ""}</p>
                    </div>
                  )}
                  {c.cnpj && <p className="text-[10px] text-muted-foreground">CNPJ: {c.cnpj}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                    {c.avaliacao > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" /> {Number(c.avaliacao).toFixed(1)}
                      </span>
                    )}
                    {c.telefone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.telefone}</span>}
                    {c.website && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Site</span>}
                    {c.instagram && <span className="flex items-center gap-1"><Instagram className="w-3.5 h-3.5" /></span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma construtora encontrada</p>
            <p className="text-sm mt-1">Cadastre sua primeira construtora</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

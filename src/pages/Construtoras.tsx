import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Search, X, Save, Edit, Trash2, Building2, MapPin, Phone, Globe, Star,
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
  cor_primaria: string;
  cor_secundaria: string;
  avaliacao: number;
  total_avaliacoes: number;
  status: string;
}

const emptyForm = {
  nome: "",
  slug: "",
  descricao: "",
  cidade: "",
  estado: "",
  telefone: "",
  email: "",
  website: "",
  instagram: "",
  whatsapp: "",
  cnpj: "",
  ano_fundacao: "",
  cor_primaria: "#1e3a5f",
  cor_secundaria: "#2563eb",
  cor_texto: "#ffffff",
  cor_fundo: "#111827",
};

export default function Construtoras() {
  const [construtoras, setConstrutoras] = useState<Construtora[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchConstrutoras = async () => {
    const { data, error } = await supabase.from("construtoras").select("*").order("nome");
    if (error) {
      toast.error("Erro ao carregar construtoras");
      return;
    }
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
    fetchConstrutoras();
  };

  const handleEdit = (c: Construtora) => {
    setForm({
      nome: c.nome, slug: c.slug, descricao: c.descricao || "", cidade: c.cidade || "",
      estado: c.estado || "", telefone: c.telefone || "", email: c.email || "",
      website: c.website || "", instagram: "", whatsapp: "", cnpj: "", ano_fundacao: "",
      cor_primaria: c.cor_primaria || "#1e3a5f", cor_secundaria: c.cor_secundaria || "#2563eb",
      cor_texto: "#ffffff", cor_fundo: "#111827",
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("construtoras").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Construtora excluída!");
    fetchConstrutoras();
  };

  const filtered = construtoras.filter(
    (c) => c.nome.toLowerCase().includes(search.toLowerCase()) || c.cidade?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Construtoras</h1>
            <p className="text-sm text-muted-foreground mt-1">{construtoras.length} construtoras cadastradas</p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start"
          >
            <Plus className="w-4 h-4" /> Nova Construtora
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Buscar construtora..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="text-lg font-bold text-card-foreground">
                  {editingId ? "Editar Construtora" : "Nova Construtora"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
                    <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
                    <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
                    <input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefone</label>
                    <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">E-mail</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">CNPJ</label>
                    <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Ano Fundação</label>
                    <input value={form.ano_fundacao} onChange={(e) => setForm({ ...form, ano_fundacao: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
                    <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp</label>
                    <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Instagram</label>
                    <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                    <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                  <div className="col-span-2 border-t border-border pt-4">
                    <label className="text-xs font-semibold text-muted-foreground mb-3 block">🎨 Personalização de Cores</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.cor_primaria} onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <span className="text-xs text-muted-foreground">Cor Primária</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.cor_secundaria} onChange={(e) => setForm({ ...form, cor_secundaria: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <span className="text-xs text-muted-foreground">Cor Secundária</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.cor_texto} onChange={(e) => setForm({ ...form, cor_texto: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <span className="text-xs text-muted-foreground">Cor do Texto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.cor_fundo} onChange={(e) => setForm({ ...form, cor_fundo: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <span className="text-xs text-muted-foreground">Cor do Fundo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border sticky bottom-0 bg-card">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Save className="w-4 h-4" /> {editingId ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/construtoras/${c.id}`)}
                className="elevated-card rounded-xl overflow-hidden group cursor-pointer"
              >
                <div className="relative h-32 overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.cor_primaria}, ${c.cor_secundaria})` }}>
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover opacity-80" />}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                      <Edit className="w-3.5 h-3.5 text-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  </div>
                  {c.perfil_url && (
                    <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-full border-3 border-card overflow-hidden bg-card">
                      <img src={c.perfil_url} alt={c.nome} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {!c.perfil_url && (
                    <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-full border-3 border-card overflow-hidden bg-card flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4 pt-8 space-y-2">
                  <h3 className="font-semibold text-card-foreground text-sm">{c.nome}</h3>
                  {c.cidade && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{c.cidade}{c.estado ? `, ${c.estado}` : ""}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                    {c.avaliacao > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" /> {c.avaliacao.toFixed(1)}
                      </span>
                    )}
                    {c.telefone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.telefone}</span>}
                    {c.website && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Site</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma construtora encontrada</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

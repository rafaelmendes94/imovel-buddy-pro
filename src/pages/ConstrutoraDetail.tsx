import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { SmartLayout } from "@/components/SmartLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuickValues } from "@/hooks/useQuickValues";
import { QuickSelect, QuickSelectDropdown } from "@/components/QuickSelect";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Building2, MapPin, Phone, Mail, Globe, Star, Plus, X, Save, Edit, Trash2,
  Home, Search, Palette, Instagram, MessageCircle, Calendar, FileText,
  ExternalLink, TrendingUp, Eye, Award, Users, Layers, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Construtora {
  id: string; nome: string; slug: string; descricao: string;
  logo_url: string | null; cover_url: string | null; perfil_url: string | null;
  cidade: string; estado: string; telefone: string; email: string; website: string;
  instagram: string; whatsapp: string; cnpj: string; ano_fundacao: string;
  cor_primaria: string; cor_secundaria: string; cor_texto: string; cor_fundo: string;
  avaliacao: number; total_avaliacoes: number; status: string;
}

interface Empreendimento {
  id: string; nome: string; endereco: string; cidade: string; status: string;
  tipo: string; total_unidades: number; unidades_vendidas: number;
  previsao_entrega: string; imagem_url: string | null; descricao: string;
}

interface Unidade {
  id: string; empreendimento_id: string; numero: string; andar: string;
  tipo: string; area: number; quartos: number; preco: number; status: string; observacao: string;
}

interface Imovel {
  id: string; titulo: string; tipo: string; preco: number; quartos: number;
  area: number; endereco: string; cidade: string; status: string;
  imagens: string[] | null; decorado: boolean; empreendimento: string | null;
}

const statusColors: Record<string, string> = {
  "Lançamento": "bg-info/10 text-info border-info/30",
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  "Pronto": "bg-success/10 text-success border-success/30",
  "Entregue": "bg-muted text-muted-foreground border-border",
};

const unitStatusColors: Record<string, string> = {
  "Disponível": "bg-success text-success-foreground",
  "Reservado": "bg-warning text-warning-foreground",
  "Vendido": "bg-destructive text-destructive-foreground",
  "Decorado": "bg-info text-info-foreground",
};

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export default function ConstrutoraDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getValues } = useQuickValues([
    { table: "construtora_empreendimentos", column: "cidade" },
    { table: "construtora_empreendimentos", column: "endereco" },
    { table: "construtora_empreendimentos", column: "tipo" },
    { table: "construtora_empreendimentos", column: "previsao_entrega" },
  ]);
  const [construtora, setConstrutora] = useState<Construtora | null>(null);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [unidades, setUnidades] = useState<Record<string, Unidade[]>>({});
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchImoveis, setSearchImoveis] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);

  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const emptyEmpForm = { nome: "", endereco: "", cidade: "", status: "Lançamento", tipo: "Residencial", total_unidades: 0, previsao_entrega: "", descricao: "" };
  const [empForm, setEmpForm] = useState(emptyEmpForm);

  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitEmpId, setUnitEmpId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState({ numero: "", andar: "", tipo: "Apartamento", area: 0, quartos: 0, preco: 0, status: "Disponível", observacao: "" });

  const [showColors, setShowColors] = useState(false);
  const [colorsForm, setColorsForm] = useState({ cor_primaria: "#1e3a5f", cor_secundaria: "#2563eb", cor_texto: "#ffffff", cor_fundo: "#111827" });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [perfilFile, setPerfilFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (id) fetchAll(); }, [id]);

  const fetchAll = async () => {
    const [cRes, eRes] = await Promise.all([
      supabase.from("construtoras").select("*").eq("id", id!).single(),
      supabase.from("construtora_empreendimentos").select("*").eq("construtora_id", id!).order("nome"),
    ]);
    if (cRes.data) {
      setConstrutora(cRes.data as Construtora);
      setColorsForm({ cor_primaria: cRes.data.cor_primaria, cor_secundaria: cRes.data.cor_secundaria, cor_texto: cRes.data.cor_texto, cor_fundo: cRes.data.cor_fundo });
    }
    if (eRes.data) {
      setEmpreendimentos(eRes.data as Empreendimento[]);
      const empIds = (eRes.data as Empreendimento[]).map(e => e.id);
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
    if (cRes.data) {
      const { data: imData } = await supabase.from("imoveis").select("*").ilike("empreendimento", `%${cRes.data.nome}%`);
      setImoveis((imData || []) as Imovel[]);
    }
    setLoading(false);
  };

  const uploadImage = async (file: File, type: 'cover' | 'perfil') => {
    if (!id) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `construtoras/${id}/${type}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, file);
    if (uploadError) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(path);
    const field = type === 'cover' ? 'cover_url' : 'perfil_url';
    await supabase.from("construtoras").update({ [field]: publicUrl, updated_at: new Date().toISOString() }).eq("id", id);
    setUploading(false);
    toast.success(`${type === 'cover' ? 'Capa' : 'Foto de perfil'} atualizada!`);
    fetchAll();
  };

  const saveEmpreendimento = async () => {
    if (!empForm.nome || !id) return;
    if (editingEmpId) {
      await supabase.from("construtora_empreendimentos").update({ ...empForm, updated_at: new Date().toISOString() }).eq("id", editingEmpId);
    } else {
      await supabase.from("construtora_empreendimentos").insert({ ...empForm, construtora_id: id });
    }
    setShowEmpForm(false); setEditingEmpId(null); setEmpForm(emptyEmpForm);
    fetchAll(); toast.success("Empreendimento salvo!");
  };

  const deleteEmpreendimento = async (empId: string) => {
    if (!confirm("Excluir empreendimento?")) return;
    await supabase.from("construtora_empreendimentos").delete().eq("id", empId);
    fetchAll(); toast.success("Excluído!");
  };

  const saveUnit = async () => {
    if (!unitForm.numero || !unitEmpId) return;
    await supabase.from("construtora_unidades").insert({ ...unitForm, empreendimento_id: unitEmpId });
    setShowUnitForm(false);
    setUnitForm({ numero: "", andar: "", tipo: "Apartamento", area: 0, quartos: 0, preco: 0, status: "Disponível", observacao: "" });
    fetchAll(); toast.success("Unidade adicionada!");
  };

  const updateUnitStatus = async (unitId: string, newStatus: string) => {
    await supabase.from("construtora_unidades").update({ status: newStatus }).eq("id", unitId);
    fetchAll();
  };

  const deleteUnit = async (unitId: string) => {
    await supabase.from("construtora_unidades").delete().eq("id", unitId);
    fetchAll(); toast.success("Removida!");
  };

  const saveColors = async () => {
    if (!id) return;
    await supabase.from("construtoras").update({ ...colorsForm, updated_at: new Date().toISOString() }).eq("id", id);
    setShowColors(false); fetchAll(); toast.success("Cores atualizadas!");
  };

  if (loading) return <SmartLayout><div className="p-8 text-center text-muted-foreground">Carregando...</div></SmartLayout>;
  if (!construtora) return <SmartLayout><div className="p-8 text-center text-muted-foreground">Construtora não encontrada</div></SmartLayout>;

  const filteredImoveis = imoveis.filter(i => {
    if (searchImoveis && !i.titulo.toLowerCase().includes(searchImoveis.toLowerCase())) return false;
    if (filterTipo && i.tipo !== filterTipo) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    return true;
  });

  const tipos = [...new Set(imoveis.map(i => i.tipo))];
  const statuses = [...new Set(imoveis.map(i => i.status))];

  const totalUnidades = empreendimentos.reduce((s, e) => s + (e.total_unidades || 0), 0);
  const totalVendidas = empreendimentos.reduce((s, e) => s + (e.unidades_vendidas || 0), 0);

  return (
    <SmartLayout>
      <div className="space-y-0">
        {/* Hero/Cover */}
        <motion.div {...fadeUp} className="relative h-52 sm:h-64 overflow-hidden" style={{ background: `linear-gradient(135deg, ${construtora.cor_primaria}, ${construtora.cor_secundaria})` }}>
          {construtora.cover_url && <img src={construtora.cover_url} alt="" className="w-full h-full object-cover opacity-70" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-4 left-4"><BackButton /></div>
          <div className="absolute top-4 right-4 flex gap-2">
            <label className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors cursor-pointer shadow-sm">
              <Upload className="w-4 h-4 text-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'cover'); }} />
            </label>
            <button onClick={() => setShowColors(true)} className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-sm">
              <Palette className="w-4 h-4 text-foreground" />
            </button>
            <Link to={`/construtora/${construtora.slug}`} target="_blank" className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-sm">
              <ExternalLink className="w-4 h-4 text-foreground" />
            </Link>
          </div>
        </motion.div>

        {/* Profile info */}
        <div className="px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <div className="flex items-end gap-4">
            <label className="relative cursor-pointer group flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-card overflow-hidden bg-card flex items-center justify-center shadow-xl">
                {construtora.perfil_url ? <img src={construtora.perfil_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-10 h-10 text-muted-foreground" />}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'perfil'); }} />
            </label>
            <div className="pb-2 flex-1">
              <h1 className="text-2xl font-bold text-foreground">{construtora.nome}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                {construtora.cidade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{construtora.cidade}{construtora.estado ? `, ${construtora.estado}` : ""}</span>}
                {construtora.cnpj && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{construtora.cnpj}</span>}
                {construtora.ano_fundacao && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Fundada em {construtora.ano_fundacao}</span>}
                {construtora.avaliacao > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning fill-warning" />{Number(construtora.avaliacao).toFixed(1)} ({construtora.total_avaliacoes})</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="px-4 sm:px-6 lg:px-8 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: Layers, label: "Empreendimentos", value: empreendimentos.length },
              { icon: Building2, label: "Total Unidades", value: totalUnidades },
              { icon: TrendingUp, label: "Vendidas", value: totalVendidas },
              { icon: Home, label: "Imóveis", value: imoveis.length },
              { icon: Award, label: "Avaliação", value: construtora.avaliacao > 0 ? Number(construtora.avaliacao).toFixed(1) : "-" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="elevated-card rounded-xl p-3 text-center hover:shadow-lg transition-shadow">
                <s.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          <Tabs defaultValue="sobre">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 border-b border-border">
              <TabsList className="bg-secondary w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="sobre" className="flex-1 sm:flex-auto text-xs gap-1"><FileText className="w-3 h-3" />Sobre</TabsTrigger>
                <TabsTrigger value="empreendimentos" className="flex-1 sm:flex-auto text-xs gap-1"><Layers className="w-3 h-3" />Empreendimentos</TabsTrigger>
                <TabsTrigger value="imoveis" className="flex-1 sm:flex-auto text-xs gap-1"><Home className="w-3 h-3" />Imóveis</TabsTrigger>
                <TabsTrigger value="decorados" className="flex-1 sm:flex-auto text-xs gap-1"><Eye className="w-3 h-3" />Decorados</TabsTrigger>
                <TabsTrigger value="avaliacao" className="flex-1 sm:flex-auto text-xs gap-1"><Star className="w-3 h-3" />Avaliação</TabsTrigger>
              </TabsList>
            </div>

            {/* Sobre */}
            <TabsContent value="sobre" className="pt-4 space-y-4">
              <motion.div {...fadeUp} className="elevated-card rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-card-foreground text-lg">Sobre a Construtora</h3>
                {construtora.descricao ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{construtora.descricao}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">Nenhuma descrição cadastrada. Edite na página de construtoras.</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                  {construtora.cnpj && <div><span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">CNPJ</span><span className="text-sm font-medium text-card-foreground">{construtora.cnpj}</span></div>}
                  {construtora.ano_fundacao && <div><span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Fundação</span><span className="text-sm font-medium text-card-foreground">{construtora.ano_fundacao}</span></div>}
                  {construtora.telefone && <div><span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Telefone</span><span className="text-sm font-medium text-card-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{construtora.telefone}</span></div>}
                  {construtora.email && <div><span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">E-mail</span><span className="text-sm font-medium text-card-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{construtora.email}</span></div>}
                  {construtora.website && <div><span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Website</span><a href={construtora.website} target="_blank" className="text-sm font-medium text-info hover:underline flex items-center gap-1"><Globe className="w-3 h-3" />{construtora.website}</a></div>}
                  {construtora.instagram && <div><span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Instagram</span><span className="text-sm font-medium text-card-foreground flex items-center gap-1"><Instagram className="w-3 h-3" />{construtora.instagram}</span></div>}
                  {construtora.whatsapp && <div><span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">WhatsApp</span><span className="text-sm font-medium text-card-foreground flex items-center gap-1"><MessageCircle className="w-3 h-3" />{construtora.whatsapp}</span></div>}
                </div>
              </motion.div>
            </TabsContent>

            {/* Empreendimentos */}
            <TabsContent value="empreendimentos" className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-foreground text-lg">Empreendimentos</h3>
                <button onClick={() => { setEmpForm(emptyEmpForm); setEditingEmpId(null); setShowEmpForm(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-gold text-primary text-xs font-semibold hover:opacity-90 shadow-md">
                  <Plus className="w-3.5 h-3.5" /> Novo Empreendimento
                </button>
              </div>
              {empreendimentos.map((emp, idx) => {
                const empUnits = unidades[emp.id] || [];
                const progress = emp.total_unidades > 0 ? Math.round((emp.unidades_vendidas / emp.total_unidades) * 100) : 0;
                const disponivel = empUnits.filter(u => u.status === "Disponível").length;
                const reservado = empUnits.filter(u => u.status === "Reservado").length;
                const vendido = empUnits.filter(u => u.status === "Vendido").length;
                return (
                  <motion.div key={emp.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="elevated-card rounded-xl overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-card-foreground">{emp.nome}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", statusColors[emp.status] || "bg-muted text-muted-foreground")}>{emp.status}</span>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{emp.tipo}</span>
                            {emp.previsao_entrega && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{emp.previsao_entrega}</span>}
                          </div>
                          {emp.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{emp.descricao}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEmpForm({ nome: emp.nome, endereco: emp.endereco, cidade: emp.cidade, status: emp.status, tipo: emp.tipo, total_unidades: emp.total_unidades, previsao_entrega: emp.previsao_entrega, descricao: emp.descricao }); setEditingEmpId(emp.id); setShowEmpForm(true); }} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteEmpreendimento(emp.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      {emp.endereco && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{emp.endereco}{emp.cidade ? `, ${emp.cidade}` : ""}</p>}
                      
                      {/* Progress */}
                      <div className="space-y-2 p-3 bg-background rounded-xl border border-input">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Progresso de Vendas</span>
                          <span className="font-bold text-foreground">{emp.unidades_vendidas}/{emp.total_unidades} ({progress}%)</span>
                        </div>
                        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.3 }}
                            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${construtora.cor_primaria}, ${construtora.cor_secundaria})` }} />
                        </div>
                        <div className="flex gap-4 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> {disponivel} Disponíveis</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> {reservado} Reservados</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> {vendido} Vendidos</span>
                        </div>
                      </div>

                      {/* Espelho de Vendas */}
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Espelho de Vendas</span>
                          <button onClick={() => { setUnitEmpId(emp.id); setShowUnitForm(true); }} className="text-[10px] text-info hover:underline flex items-center gap-1 font-semibold"><Plus className="w-3 h-3" />Adicionar Unidade</button>
                        </div>
                        {empUnits.length > 0 ? (
                          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                            {empUnits.map(u => (
                              <div key={u.id} className="relative group">
                                <select
                                  value={u.status}
                                  onChange={(e) => updateUnitStatus(u.id, e.target.value)}
                                  className={cn("w-full text-center py-2 rounded-lg text-[9px] font-bold cursor-pointer appearance-none border-0 shadow-sm transition-all hover:shadow-md", unitStatusColors[u.status] || "bg-muted text-muted-foreground")}
                                >
                                  <option>Disponível</option><option>Reservado</option><option>Vendido</option><option>Decorado</option>
                                </select>
                                <span className="block text-center text-[9px] text-muted-foreground mt-0.5 font-medium">{u.numero}</span>
                                {u.preco > 0 && <span className="block text-center text-[8px] text-muted-foreground/70">{formatCurrency(u.preco)}</span>}
                                <button onClick={() => deleteUnit(u.id)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground hidden group-hover:flex items-center justify-center text-[8px] shadow-sm">×</button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4 bg-background rounded-lg">Nenhuma unidade cadastrada</p>
                        )}
                        <div className="flex gap-3 mt-3 flex-wrap">
                          {Object.entries(unitStatusColors).map(([st, cls]) => (
                            <span key={st} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span className={cn("w-3 h-3 rounded", cls)} /> {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {empreendimentos.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum empreendimento cadastrado</p>
                </div>
              )}
            </TabsContent>

            {/* Imóveis */}
            <TabsContent value="imoveis" className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input placeholder="Buscar imóvel..." value={searchImoveis} onChange={(e) => setSearchImoveis(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="px-3 py-2.5 bg-card border border-input rounded-xl text-sm">
                  <option value="">Todos os tipos</option>
                  {tipos.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-card border border-input rounded-xl text-sm">
                  <option value="">Todos os status</option>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredImoveis.map((i, idx) => (
                  <motion.div key={i.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="elevated-card rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                    <div className="h-36 bg-secondary overflow-hidden relative">
                      {i.imagens && i.imagens[0] ? <img src={i.imagens[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-muted-foreground/20" /></div>}
                      {i.decorado && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-info text-info-foreground text-[10px] font-bold shadow-sm">DECORADO</span>}
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-card/90 backdrop-blur-sm text-[10px] font-bold text-foreground shadow-sm">{i.status}</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-card-foreground truncate">{i.titulo}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{i.endereco}, {i.cidade}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(i.preco)}</span>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          <span>{i.quartos}q</span>
                          <span>{i.area}m²</span>
                          <span>{i.tipo}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredImoveis.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">Nenhum imóvel encontrado</p>}
            </TabsContent>

            {/* Decorados */}
            <TabsContent value="decorados" className="pt-4 space-y-4">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2"><Eye className="w-5 h-5 text-info" /> Imóveis Decorados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {imoveis.filter(i => i.decorado).map((i, idx) => (
                  <motion.div key={i.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                    className="elevated-card rounded-xl overflow-hidden group hover:shadow-lg transition-all">
                    <div className="h-40 bg-secondary overflow-hidden relative">
                      {i.imagens && i.imagens[0] ? <img src={i.imagens[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-muted-foreground/20" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-info text-info-foreground text-[10px] font-bold shadow-md">✨ DECORADO</span>
                      <div className="absolute bottom-3 left-3">
                        <span className="text-white font-bold text-lg drop-shadow-lg">{formatCurrency(i.preco)}</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h4 className="text-sm font-bold text-card-foreground truncate">{i.titulo}</h4>
                      <p className="text-xs text-muted-foreground">{i.endereco}</p>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span>{i.quartos} quartos</span>
                        <span>{i.area}m²</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {imoveis.filter(i => i.decorado).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum imóvel decorado encontrado</p>
                </div>
              )}
            </TabsContent>

            {/* Avaliação */}
            <TabsContent value="avaliacao" className="pt-4 space-y-4">
              <motion.div {...fadeUp} className="elevated-card rounded-xl p-8 text-center space-y-4">
                <Award className="w-12 h-12 mx-auto text-warning" />
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("w-10 h-10 transition-all", s <= Math.round(Number(construtora.avaliacao)) ? "text-warning fill-warning" : "text-muted-foreground/20")} />
                  ))}
                </div>
                <p className="text-4xl font-bold text-foreground">{construtora.avaliacao > 0 ? Number(construtora.avaliacao).toFixed(1) : "Sem avaliação"}</p>
                <p className="text-sm text-muted-foreground">{construtora.total_avaliacoes} avaliações recebidas</p>
                <Link to={`/construtoras/${construtora.id}/avaliacoes`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors mt-4">
                  <Star className="w-4 h-4" /> Avaliar / Ver Avaliações Detalhadas
                </Link>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showEmpForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                  <h2 className="text-lg font-bold text-card-foreground">{editingEmpId ? "✏️ Editar" : "🏗️ Novo"} Empreendimento</h2>
                  <button onClick={() => setShowEmpForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nome *</label><input value={empForm.nome} onChange={e => setEmpForm({ ...empForm, nome: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                  <QuickSelect label="Endereço" value={empForm.endereco} onChange={(v) => setEmpForm({ ...empForm, endereco: v })} suggestions={getValues("construtora_empreendimentos", "endereco")} placeholder="Rua, número..." icon={<MapPin className="w-3 h-3" />} className="col-span-2" />
                  <QuickSelect label="Cidade" value={empForm.cidade} onChange={(v) => setEmpForm({ ...empForm, cidade: v })} suggestions={getValues("construtora_empreendimentos", "cidade")} placeholder="Ex: Capão da Canoa" icon={<MapPin className="w-3 h-3" />} />
                  <QuickSelectDropdown label="Tipo" value={empForm.tipo} onChange={(v) => setEmpForm({ ...empForm, tipo: v })} options={["Residencial", "Comercial", "Misto", "Loteamento"]} suggestions={getValues("construtora_empreendimentos", "tipo")} />
                  <QuickSelectDropdown label="Status" value={empForm.status} onChange={(v) => setEmpForm({ ...empForm, status: v })} options={["Lançamento", "Em construção", "Pronto", "Entregue"]} />
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Total Unidades</label><input type="number" value={empForm.total_unidades} onChange={e => setEmpForm({ ...empForm, total_unidades: +e.target.value })} className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                  <QuickSelect label="Previsão de Entrega" value={empForm.previsao_entrega} onChange={(v) => setEmpForm({ ...empForm, previsao_entrega: v })} suggestions={getValues("construtora_empreendimentos", "previsao_entrega")} placeholder="Ex: Dezembro/2027" icon={<Calendar className="w-3 h-3" />} className="col-span-2" />
                  <div className="col-span-2"><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Descrição</label><textarea value={empForm.descricao} onChange={e => setEmpForm({ ...empForm, descricao: e.target.value })} rows={3} placeholder="Descreva o empreendimento, diferenciais, localização..." className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm resize-none focus:ring-2 focus:ring-ring" /></div>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-border">
                  <button onClick={() => setShowEmpForm(false)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm">Cancelar</button>
                  <button onClick={saveEmpreendimento} className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-gold text-primary text-sm font-semibold shadow-md"><Save className="w-4 h-4" />Salvar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUnitForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="text-lg font-bold text-card-foreground">🏠 Nova Unidade</h2>
                  <button onClick={() => setShowUnitForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Número *</label><input value={unitForm.numero} onChange={e => setUnitForm({ ...unitForm, numero: e.target.value })} placeholder="Ex: 101" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Andar</label><input value={unitForm.andar} onChange={e => setUnitForm({ ...unitForm, andar: e.target.value })} placeholder="Ex: 1º" className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Área (m²)</label><input type="number" value={unitForm.area || ''} onChange={e => setUnitForm({ ...unitForm, area: +e.target.value })} className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Quartos</label><input type="number" value={unitForm.quartos || ''} onChange={e => setUnitForm({ ...unitForm, quartos: +e.target.value })} className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Preço</label><input type="number" value={unitForm.preco || ''} onChange={e => setUnitForm({ ...unitForm, preco: +e.target.value })} className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status</label><select value={unitForm.status} onChange={e => setUnitForm({ ...unitForm, status: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm"><option>Disponível</option><option>Reservado</option><option>Vendido</option><option>Decorado</option></select></div>
                  <div className="col-span-2"><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Observação</label><input value={unitForm.observacao} onChange={e => setUnitForm({ ...unitForm, observacao: e.target.value })} placeholder="Ex: Vista mar, sacada..." className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring" /></div>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-border">
                  <button onClick={() => setShowUnitForm(false)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm">Cancelar</button>
                  <button onClick={saveUnit} className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-gold text-primary text-sm font-semibold shadow-md"><Save className="w-4 h-4" />Salvar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showColors && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="text-lg font-bold text-card-foreground">🎨 Personalizar Cores</h2>
                  <button onClick={() => setShowColors(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { key: "cor_primaria", label: "Cor Primária" },
                    { key: "cor_secundaria", label: "Cor Secundária" },
                    { key: "cor_texto", label: "Cor do Texto" },
                    { key: "cor_fundo", label: "Cor do Fundo" },
                  ].map(c => (
                    <div key={c.key} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-input">
                      <input type="color" value={(colorsForm as any)[c.key]} onChange={e => setColorsForm({ ...colorsForm, [c.key]: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                      <span className="text-sm font-medium text-card-foreground">{c.label}</span>
                    </div>
                  ))}
                  <div className="rounded-xl h-16 flex items-center justify-center shadow-inner" style={{ background: `linear-gradient(135deg, ${colorsForm.cor_primaria}, ${colorsForm.cor_secundaria})` }}>
                    <span style={{ color: colorsForm.cor_texto }} className="font-bold text-sm drop-shadow-md">Preview</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-border">
                  <button onClick={() => setShowColors(false)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm">Cancelar</button>
                  <button onClick={saveColors} className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-gold text-primary text-sm font-semibold shadow-md"><Save className="w-4 h-4" />Salvar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SmartLayout>
  );
}

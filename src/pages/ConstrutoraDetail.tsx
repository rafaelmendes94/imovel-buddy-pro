import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, MapPin, Phone, Mail, Globe, Star, Plus, X, Save, Edit, Trash2,
  Home, Search, Filter, Palette, Instagram, MessageCircle, Calendar, FileText,
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

export default function ConstrutoraDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [construtora, setConstrutora] = useState<Construtora | null>(null);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [unidades, setUnidades] = useState<Record<string, Unidade[]>>({});
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchImoveis, setSearchImoveis] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDecorados, setShowDecorados] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);

  // Emp form
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({ nome: "", endereco: "", cidade: "", status: "Lançamento", tipo: "Residencial", total_unidades: 0, previsao_entrega: "", descricao: "" });

  // Unit form
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitEmpId, setUnitEmpId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState({ numero: "", andar: "", tipo: "Apartamento", area: 0, quartos: 0, preco: 0, status: "Disponível", observacao: "" });

  // Colors form
  const [showColors, setShowColors] = useState(false);
  const [colorsForm, setColorsForm] = useState({ cor_primaria: "#1e3a5f", cor_secundaria: "#2563eb", cor_texto: "#ffffff", cor_fundo: "#111827" });

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
      // Fetch units for each emp
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
    // Fetch imoveis matching construtora name
    if (cRes.data) {
      const { data: imData } = await supabase.from("imoveis").select("*").ilike("empreendimento", `%${cRes.data.nome}%`);
      setImoveis((imData || []) as Imovel[]);
    }
    setLoading(false);
  };

  const saveEmpreendimento = async () => {
    if (!empForm.nome || !id) return;
    if (editingEmpId) {
      await supabase.from("construtora_empreendimentos").update({ ...empForm, updated_at: new Date().toISOString() }).eq("id", editingEmpId);
    } else {
      await supabase.from("construtora_empreendimentos").insert({ ...empForm, construtora_id: id });
    }
    setShowEmpForm(false);
    setEditingEmpId(null);
    setEmpForm({ nome: "", endereco: "", cidade: "", status: "Lançamento", tipo: "Residencial", total_unidades: 0, previsao_entrega: "", descricao: "" });
    fetchAll();
    toast.success("Empreendimento salvo!");
  };

  const deleteEmpreendimento = async (empId: string) => {
    await supabase.from("construtora_empreendimentos").delete().eq("id", empId);
    fetchAll();
    toast.success("Empreendimento excluído!");
  };

  const saveUnit = async () => {
    if (!unitForm.numero || !unitEmpId) return;
    await supabase.from("construtora_unidades").insert({ ...unitForm, empreendimento_id: unitEmpId });
    setShowUnitForm(false);
    setUnitForm({ numero: "", andar: "", tipo: "Apartamento", area: 0, quartos: 0, preco: 0, status: "Disponível", observacao: "" });
    fetchAll();
    toast.success("Unidade adicionada!");
  };

  const updateUnitStatus = async (unitId: string, newStatus: string) => {
    await supabase.from("construtora_unidades").update({ status: newStatus }).eq("id", unitId);
    fetchAll();
  };

  const deleteUnit = async (unitId: string) => {
    await supabase.from("construtora_unidades").delete().eq("id", unitId);
    fetchAll();
    toast.success("Unidade removida!");
  };

  const saveColors = async () => {
    if (!id) return;
    await supabase.from("construtoras").update({ ...colorsForm, updated_at: new Date().toISOString() }).eq("id", id);
    setShowColors(false);
    fetchAll();
    toast.success("Cores atualizadas!");
  };

  if (loading) return <AppLayout><div className="p-8 text-center text-muted-foreground">Carregando...</div></AppLayout>;
  if (!construtora) return <AppLayout><div className="p-8 text-center text-muted-foreground">Construtora não encontrada</div></AppLayout>;

  const filteredImoveis = imoveis.filter(i => {
    if (searchImoveis && !i.titulo.toLowerCase().includes(searchImoveis.toLowerCase())) return false;
    if (filterTipo && i.tipo !== filterTipo) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    if (showDecorados && !i.decorado) return false;
    return true;
  });

  const tipos = [...new Set(imoveis.map(i => i.tipo))];
  const statuses = [...new Set(imoveis.map(i => i.status))];

  return (
    <AppLayout>
      <div className="space-y-0">
        {/* Hero/Cover */}
        <div className="relative h-48 sm:h-56" style={{ background: `linear-gradient(135deg, ${construtora.cor_primaria}, ${construtora.cor_secundaria})` }}>
          {construtora.cover_url && <img src={construtora.cover_url} alt="" className="w-full h-full object-cover opacity-70" />}
          <div className="absolute top-4 left-4"><BackButton /></div>
          <button onClick={() => setShowColors(true)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
            <Palette className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Profile info */}
        <div className="px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl border-4 border-card overflow-hidden bg-card flex items-center justify-center shadow-lg flex-shrink-0">
              {construtora.perfil_url ? <img src={construtora.perfil_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-muted-foreground" />}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-foreground">{construtora.nome}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                {construtora.cidade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{construtora.cidade}{construtora.estado ? `, ${construtora.estado}` : ""}</span>}
                {construtora.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{construtora.telefone}</span>}
                {construtora.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{construtora.email}</span>}
                {construtora.avaliacao > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning fill-warning" />{construtora.avaliacao.toFixed(1)} ({construtora.total_avaliacoes})</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          <Tabs defaultValue="sobre">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 border-b border-border">
              <TabsList className="bg-secondary w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="sobre" className="flex-1 sm:flex-auto text-xs">Sobre</TabsTrigger>
                <TabsTrigger value="empreendimentos" className="flex-1 sm:flex-auto text-xs">Empreendimentos</TabsTrigger>
                <TabsTrigger value="imoveis" className="flex-1 sm:flex-auto text-xs">Imóveis</TabsTrigger>
                <TabsTrigger value="decorados" className="flex-1 sm:flex-auto text-xs">Decorados</TabsTrigger>
                <TabsTrigger value="avaliacao" className="flex-1 sm:flex-auto text-xs">Avaliação</TabsTrigger>
              </TabsList>
            </div>

            {/* Sobre */}
            <TabsContent value="sobre" className="pt-4 space-y-4">
              <div className="elevated-card rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-card-foreground">Informações da Construtora</h3>
                {construtora.descricao && <p className="text-sm text-muted-foreground leading-relaxed">{construtora.descricao}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {construtora.cnpj && <div><span className="text-[10px] text-muted-foreground block">CNPJ</span><span className="text-sm font-medium text-card-foreground">{construtora.cnpj}</span></div>}
                  {construtora.ano_fundacao && <div><span className="text-[10px] text-muted-foreground block">Fundação</span><span className="text-sm font-medium text-card-foreground">{construtora.ano_fundacao}</span></div>}
                  {construtora.website && <div><span className="text-[10px] text-muted-foreground block">Website</span><a href={construtora.website} target="_blank" className="text-sm font-medium text-info hover:underline">{construtora.website}</a></div>}
                  {construtora.instagram && <div><span className="text-[10px] text-muted-foreground block">Instagram</span><span className="text-sm font-medium text-card-foreground flex items-center gap-1"><Instagram className="w-3 h-3" />{construtora.instagram}</span></div>}
                  {construtora.whatsapp && <div><span className="text-[10px] text-muted-foreground block">WhatsApp</span><span className="text-sm font-medium text-card-foreground flex items-center gap-1"><MessageCircle className="w-3 h-3" />{construtora.whatsapp}</span></div>}
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="elevated-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{empreendimentos.length}</p>
                  <p className="text-xs text-muted-foreground">Empreendimentos</p>
                </div>
                <div className="elevated-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{imoveis.length}</p>
                  <p className="text-xs text-muted-foreground">Imóveis</p>
                </div>
                <div className="elevated-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{imoveis.filter(i => i.decorado).length}</p>
                  <p className="text-xs text-muted-foreground">Decorados</p>
                </div>
                <div className="elevated-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{construtora.avaliacao > 0 ? construtora.avaliacao.toFixed(1) : "-"}</p>
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                </div>
              </div>
            </TabsContent>

            {/* Empreendimentos */}
            <TabsContent value="empreendimentos" className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Empreendimentos</h3>
                <button onClick={() => { setEmpForm({ nome: "", endereco: "", cidade: "", status: "Lançamento", tipo: "Residencial", total_unidades: 0, previsao_entrega: "", descricao: "" }); setEditingEmpId(null); setShowEmpForm(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-gold text-primary text-xs font-semibold hover:opacity-90">
                  <Plus className="w-3.5 h-3.5" /> Novo
                </button>
              </div>
              {empreendimentos.map(emp => {
                const empUnits = unidades[emp.id] || [];
                const progress = emp.total_unidades > 0 ? Math.round((emp.unidades_vendidas / emp.total_unidades) * 100) : 0;
                return (
                  <div key={emp.id} className="elevated-card rounded-xl overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-card-foreground text-sm">{emp.nome}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", statusColors[emp.status] || "bg-muted text-muted-foreground")}>{emp.status}</span>
                            <span className="text-xs text-muted-foreground">{emp.tipo}</span>
                            {emp.previsao_entrega && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{emp.previsao_entrega}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEmpForm({ nome: emp.nome, endereco: emp.endereco, cidade: emp.cidade, status: emp.status, tipo: emp.tipo, total_unidades: emp.total_unidades, previsao_entrega: emp.previsao_entrega, descricao: emp.descricao }); setEditingEmpId(emp.id); setShowEmpForm(true); }} className="w-6 h-6 rounded bg-secondary flex items-center justify-center"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => deleteEmpreendimento(emp.id)} className="w-6 h-6 rounded bg-secondary flex items-center justify-center hover:bg-destructive/20"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      {emp.endereco && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{emp.endereco}{emp.cidade ? `, ${emp.cidade}` : ""}</p>}
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{emp.unidades_vendidas}/{emp.total_unidades} vendidas</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${construtora.cor_primaria}, ${construtora.cor_secundaria})` }} />
                        </div>
                      </div>

                      {/* Espelho de Vendas */}
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">Espelho de Vendas</span>
                          <button onClick={() => { setUnitEmpId(emp.id); setShowUnitForm(true); }} className="text-[10px] text-info hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Unidade</button>
                        </div>
                        {empUnits.length > 0 ? (
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                            {empUnits.map(u => (
                              <div key={u.id} className="relative group">
                                <select
                                  value={u.status}
                                  onChange={(e) => updateUnitStatus(u.id, e.target.value)}
                                  className={cn("w-full text-center py-1.5 rounded text-[9px] font-bold cursor-pointer appearance-none border-0", unitStatusColors[u.status] || "bg-muted text-muted-foreground")}
                                >
                                  <option>Disponível</option>
                                  <option>Reservado</option>
                                  <option>Vendido</option>
                                  <option>Decorado</option>
                                </select>
                                <span className="block text-center text-[9px] text-muted-foreground mt-0.5">{u.numero}</span>
                                <button onClick={() => deleteUnit(u.id)} className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground hidden group-hover:flex items-center justify-center text-[8px]">×</button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">Nenhuma unidade cadastrada</p>
                        )}
                        {/* Legend */}
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {Object.entries(unitStatusColors).map(([st, cls]) => (
                            <span key={st} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <span className={cn("w-2.5 h-2.5 rounded-sm", cls)} /> {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {empreendimentos.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum empreendimento cadastrado</p>}
            </TabsContent>

            {/* Imóveis */}
            <TabsContent value="imoveis" className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input placeholder="Buscar imóvel..." value={searchImoveis} onChange={(e) => setSearchImoveis(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="px-3 py-2 bg-card border border-input rounded-lg text-sm">
                  <option value="">Todos os tipos</option>
                  {tipos.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-card border border-input rounded-lg text-sm">
                  <option value="">Todos os status</option>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredImoveis.map(i => (
                  <div key={i.id} className="elevated-card rounded-xl overflow-hidden">
                    <div className="h-32 bg-secondary overflow-hidden">
                      {i.imagens && i.imagens[0] ? <img src={i.imagens[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-muted-foreground/30" /></div>}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="text-sm font-semibold text-card-foreground truncate">{i.titulo}</h4>
                      <p className="text-xs text-muted-foreground">{i.endereco}, {i.cidade}</p>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(i.preco)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{i.status}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span>{i.quartos} quartos</span>
                        <span>{i.area}m²</span>
                        <span>{i.tipo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredImoveis.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum imóvel encontrado para esta construtora</p>}
            </TabsContent>

            {/* Decorados */}
            <TabsContent value="decorados" className="pt-4 space-y-4">
              <h3 className="font-semibold text-foreground">Imóveis Decorados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {imoveis.filter(i => i.decorado).map(i => (
                  <div key={i.id} className="elevated-card rounded-xl overflow-hidden">
                    <div className="h-32 bg-secondary overflow-hidden relative">
                      {i.imagens && i.imagens[0] ? <img src={i.imagens[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-muted-foreground/30" /></div>}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-info text-info-foreground text-[10px] font-bold">DECORADO</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="text-sm font-semibold text-card-foreground truncate">{i.titulo}</h4>
                      <p className="text-xs text-muted-foreground">{i.endereco}</p>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(i.preco)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {imoveis.filter(i => i.decorado).length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum imóvel decorado encontrado</p>}
            </TabsContent>

            {/* Avaliação */}
            <TabsContent value="avaliacao" className="pt-4 space-y-4">
              <div className="elevated-card rounded-xl p-6 text-center space-y-3">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("w-8 h-8", s <= Math.round(construtora.avaliacao) ? "text-warning fill-warning" : "text-muted-foreground/30")} />
                  ))}
                </div>
                <p className="text-3xl font-bold text-foreground">{construtora.avaliacao > 0 ? construtora.avaliacao.toFixed(1) : "Sem avaliação"}</p>
                <p className="text-sm text-muted-foreground">{construtora.total_avaliacoes} avaliações</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Emp Form Modal */}
        {showEmpForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-bold text-card-foreground">{editingEmpId ? "Editar" : "Novo"} Empreendimento</h2>
                <button onClick={() => setShowEmpForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label><input value={empForm.nome} onChange={e => setEmpForm({ ...empForm, nome: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço</label><input value={empForm.endereco} onChange={e => setEmpForm({ ...empForm, endereco: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label><input value={empForm.cidade} onChange={e => setEmpForm({ ...empForm, cidade: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label><select value={empForm.tipo} onChange={e => setEmpForm({ ...empForm, tipo: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"><option>Residencial</option><option>Comercial</option><option>Misto</option></select></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label><select value={empForm.status} onChange={e => setEmpForm({ ...empForm, status: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"><option>Lançamento</option><option>Em construção</option><option>Pronto</option><option>Entregue</option></select></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Total Unidades</label><input type="number" value={empForm.total_unidades} onChange={e => setEmpForm({ ...empForm, total_unidades: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Previsão Entrega</label><input value={empForm.previsao_entrega} onChange={e => setEmpForm({ ...empForm, previsao_entrega: e.target.value })} placeholder="Ex: Dez/2026" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label><textarea value={empForm.descricao} onChange={e => setEmpForm({ ...empForm, descricao: e.target.value })} rows={2} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm resize-none focus:ring-2 focus:ring-ring" /></div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border">
                <button onClick={() => setShowEmpForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">Cancelar</button>
                <button onClick={saveEmpreendimento} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold"><Save className="w-4 h-4" />Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Unit Form Modal */}
        {showUnitForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-bold text-card-foreground">Nova Unidade</h2>
                <button onClick={() => setShowUnitForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Número *</label><input value={unitForm.numero} onChange={e => setUnitForm({ ...unitForm, numero: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Andar</label><input value={unitForm.andar} onChange={e => setUnitForm({ ...unitForm, andar: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Área (m²)</label><input type="number" value={unitForm.area} onChange={e => setUnitForm({ ...unitForm, area: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Quartos</label><input type="number" value={unitForm.quartos} onChange={e => setUnitForm({ ...unitForm, quartos: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Preço</label><input type="number" value={unitForm.preco} onChange={e => setUnitForm({ ...unitForm, preco: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label><select value={unitForm.status} onChange={e => setUnitForm({ ...unitForm, status: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"><option>Disponível</option><option>Reservado</option><option>Vendido</option><option>Decorado</option></select></div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border">
                <button onClick={() => setShowUnitForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">Cancelar</button>
                <button onClick={saveUnit} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold"><Save className="w-4 h-4" />Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Colors Modal */}
        {showColors && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm animate-scale-in">
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
                  <div key={c.key} className="flex items-center gap-3">
                    <input type="color" value={(colorsForm as any)[c.key]} onChange={e => setColorsForm({ ...colorsForm, [c.key]: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <span className="text-sm text-card-foreground">{c.label}</span>
                  </div>
                ))}
                {/* Preview */}
                <div className="rounded-lg h-16 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colorsForm.cor_primaria}, ${colorsForm.cor_secundaria})` }}>
                  <span style={{ color: colorsForm.cor_texto }} className="font-bold text-sm">Preview</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border">
                <button onClick={() => setShowColors(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">Cancelar</button>
                <button onClick={saveColors} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold"><Save className="w-4 h-4" />Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

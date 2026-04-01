import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SmartLayout } from '@/components/SmartLayout';
import { BackButton } from '@/components/BackButton';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  Building2, MapPin, BedDouble, Bath, Car, Ruler, User, Phone, DollarSign,
  Percent, Gift, Home, Sparkles, Save, Image, Plus, X, Loader2,
  Hash, FileText, Eye, Key, Calendar, Search
} from 'lucide-react';

const tiposImovel = ["Apartamento", "Casa", "Comercial", "Terreno", "Lote", "Condomínio"];
const statusOptions = ["Disponível", "Vendido", "Reservado", "Alugado", "Suspenso"];
const condicaoOptions = ["Mobiliado", "Semi-mobiliado", "Vazio", "Decorado"];
const ownerTypeOptions = ["Construtora", "Investidor", "Particular", "Adm Comercial", "Exclusividade"];
const padraoOptions = ["Econômico", "Médio Padrão", "Alto Padrão", "Luxo"];
const posicaoSolarOptions = ["Nascente", "Poente", "Norte", "Sul"];
const posicaoPredioOptions = ["Frente", "Fundos", "Lateral"];
const destaqueCategoriaOptions = [
  { value: "none", label: "Sem destaque" },
  { value: "apartamentos", label: "Apartamentos" },
  { value: "condominios", label: "Condomínios" },
  { value: "casas", label: "Casas" },
  { value: "lotes-cond", label: "Lotes Condomínio" },
  { value: "lotes-bairro", label: "Lotes Bairro" },
  { value: "decorados", label: "Decorados" },
  { value: "vista-mar", label: "Vista Mar" },
];
const paymentConditionOptions = [
  "À Vista", "Parcelamento 12x", "Parcelamento 24x", "Parcelamento 36x",
  "Parcelamento 48x", "Parcelamento 60x", "Parcelamento 120x",
  "Financiamento Bancário", "FGTS", "Dação", "Permuta", "Consórcio"
];
const infraOptions = [
  "Piscina", "Churrasqueira", "Salão de Festas", "Academia", "Playground",
  "Sauna", "Quadra Esportiva", "Brinquedoteca", "Espaço Gourmet", "Portaria 24h",
  "Lavanderia", "Pet Place", "Coworking", "Rooftop", "SPA", "Jardim",
  "Bicicletário", "Garagem Coberta", "Elevador", "Gerador"
];
const caracteristicaOptions = [
  "Beira Lago", "Beira Mar", "Documentação OK", "Escriturado", "ITBI Pago",
  "Aceita Financiamento", "Pronto para Morar", "Em Construção", "Reformado",
  "Nascente", "Andar Alto", "Sacada", "Varanda Gourmet", "Closet",
  "Suíte Master", "Ar Condicionado", "Piso Porcelanato", "Cozinha Planejada"
];

/** Inline one-click button picker */
function QuickPick({ label, icon, options, value, onChange }: {
  label: string;
  icon?: React.ReactNode;
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">{icon}{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              value === opt.value || String(value) === String(opt.value)
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted text-muted-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface FormData {
  titulo: string;
  tipo: string;
  status: string;
  endereco: string;
  bairro: string;
  cidade: string;
  empreendimento: string;
  unidade: string;
  box: string;
  quadra: string;
  lote: string;
  preco: string;
  precoParcelado: string;
  comissao: string;
  bonus: string;
  bonusValidade: string;
  area: string;
  areaPrivativa: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  elevadores: number;
  descricao: string;
  proprietario: string;
  proprietarioTelefone: string;
  proprietarioTipo: string;
  condicao: string;
  padrao: string;
  posicaoPredio: string;
  posicaoSolar: string;
  vista: string;
  localChaves: string;
  termoExclusividade: string;
  vistaMar: boolean;
  decorado: boolean;
  aceitaPermuta: boolean;
  destaqueHome: boolean;
  ativoSite: boolean;
  destaqueCategoria: string;
  condicoesPagemento: string[];
  infraestrutura: string[];
  outrasCaracteristicas: string[];
  latitude: string;
  longitude: string;
  cep: string;
  edificioId: string;
  condominioId: string;
  empreendimentoId: string;
}

export const initialForm: FormData = {
  titulo: '', tipo: '', status: 'Disponível', endereco: '', bairro: '', cidade: '',
  empreendimento: '', unidade: '', box: '', quadra: '', lote: '',
  preco: '', precoParcelado: '', comissao: '', bonus: '', bonusValidade: '',
  area: '', areaPrivativa: '', quartos: 0, banheiros: 0, vagas: 0, elevadores: 0,
  descricao: '', proprietario: '', proprietarioTelefone: '', proprietarioTipo: '',
  condicao: '', padrao: '', posicaoPredio: '', posicaoSolar: '', vista: '',
  localChaves: '', termoExclusividade: '',
  vistaMar: false, decorado: false, aceitaPermuta: false, destaqueHome: false, ativoSite: false,
  destaqueCategoria: 'none',
  condicoesPagemento: [], infraestrutura: [], outrasCaracteristicas: [],
  latitude: '', longitude: '', cep: '',
  edificioId: '', condominioId: '', empreendimentoId: '',
};

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-border">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
  );
}

export function ImovelForm({ editId }: { editId?: string }) {
  const { toast } = useToast();
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editId);
  const [form, setForm] = useState<FormData>(initialForm);
  const [newInfra, setNewInfra] = useState('');
  const [newCaract, setNewCaract] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [edificiosList, setEdificiosList] = useState<{ id: string; nome: string; endereco: string; cidade: string; infraestrutura: string[] }[]>([]);
  const [condominiosList, setCondominiosList] = useState<{ id: string; nome: string; endereco: string; cidade: string; amenidades: string[] }[]>([]);
  const [empreendimentosList, setEmpreendimentosList] = useState<{ id: string; nome: string; endereco: string; cidade: string; infraestrutura: string[] }[]>([]);

  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingStyle, setGeneratingStyle] = useState('');

  const generateDescription = async (style: string) => {
    if (!form.titulo) {
      toast({ title: "Preencha o título", description: "Informe pelo menos o título do imóvel para gerar a descrição.", variant: "destructive" });
      return;
    }
    setGeneratingDesc(true);
    setGeneratingStyle(style);
    try {
      const property = {
        title: form.titulo, type: form.tipo, status: form.status,
        price: Number(form.preco) || 0, address: form.endereco, city: form.cidade,
        neighborhood: form.bairro, area: Number(form.area) || 0,
        privateArea: Number(form.areaPrivativa) || 0, bedrooms: form.quartos,
        bathrooms: form.banheiros, parking: form.vagas, seaView: form.vistaMar,
        decorated: form.decorado, acceptsExchange: form.aceitaPermuta,
        empreendimento: form.empreendimento, posicaoPredio: form.posicaoPredio,
        posicaoSolar: form.posicaoSolar, vista: form.vista, condicao: form.condicao,
        infraestrutura: form.infraestrutura, elevadores: form.elevadores,
        paymentConditions: form.condicoesPagemento,
      };
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { property, style },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.description) {
        set('descricao', data.description);
        toast({ title: "Descrição gerada! ✨", description: "Revise e ajuste conforme necessário." });
      }
    } catch (e: any) {
      toast({ title: "Erro ao gerar descrição", description: e.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setGeneratingDesc(false);
      setGeneratingStyle('');
    }
  };

  const buscarCep = async () => {
    const cepClean = form.cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
      toast({ title: "CEP inválido", description: "Digite um CEP com 8 dígitos.", variant: "destructive" });
      return;
    }
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique o CEP digitado.", variant: "destructive" });
        setLoadingCep(false);
        return;
      }
      setForm(prev => ({
        ...prev,
        cidade: data.localidade || prev.cidade,
        bairro: data.bairro || prev.bairro,
        endereco: data.logradouro ? `${data.logradouro}${data.complemento ? ', ' + data.complemento : ''}` : prev.endereco,
      }));
      // Buscar coordenadas via Nominatim
      try {
        const query = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''}, ${data.uf || ''}, Brasil`;
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          setForm(prev => ({
            ...prev,
            latitude: geoData[0].lat,
            longitude: geoData[0].lon,
          }));
        }
      } catch {}
      toast({ title: "Endereço preenchido! ✅" });
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    } finally {
      setLoadingCep(false);
    }
  };

  const isEdit = !!editId;

  const set = (field: keyof FormData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  // Load edificios and condominios lists
  useEffect(() => {
    const loadLists = async () => {
      const [{ data: ed }, { data: co }, { data: emp }] = await Promise.all([
        supabase.from('edificios').select('id, nome, endereco, cidade, infraestrutura').order('nome'),
        supabase.from('condominios').select('id, nome, endereco, cidade, amenidades').order('nome'),
        supabase.from('empreendimentos' as any).select('id, nome, endereco, cidade, infraestrutura').order('nome'),
      ]);
      if (ed) setEdificiosList(ed as any);
      if (co) setCondominiosList(co as any);
      if (emp) setEmpreendimentosList(emp as any);
    };
    loadLists();
  }, []);

  // Load existing data for edit mode
  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      setLoadingData(true);
      const { data, error } = await supabase.from('imoveis').select('*').eq('id', editId).maybeSingle();
      if (error || !data) {
        toast({ title: "Erro", description: "Imóvel não encontrado.", variant: "destructive" });
        navigate('/imoveis');
        return;
      }
      setForm({
        titulo: data.titulo || '',
        tipo: data.tipo || '',
        status: data.status || 'Disponível',
        endereco: data.endereco || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        empreendimento: data.empreendimento || '',
        unidade: data.unidade || '',
        box: data.box || '',
        quadra: data.quadra || '',
        lote: data.lote || '',
        preco: data.preco ? String(data.preco) : '',
        precoParcelado: data.preco_parcelado ? String(data.preco_parcelado) : '',
        comissao: data.comissao ? String(data.comissao) : '',
        bonus: data.bonus ? String(data.bonus) : '',
        bonusValidade: data.bonus_validade || '',
        area: data.area ? String(data.area) : '',
        areaPrivativa: data.area_privativa ? String(data.area_privativa) : '',
        quartos: data.quartos || 0,
        banheiros: data.banheiros || 0,
        vagas: data.vagas || 0,
        elevadores: data.elevadores || 0,
        descricao: data.descricao || '',
        proprietario: data.proprietario || '',
        proprietarioTelefone: data.proprietario_telefone || '',
        proprietarioTipo: data.proprietario_tipo || '',
        condicao: data.condicao || '',
        padrao: data.padrao || '',
        posicaoPredio: data.posicao_predio || '',
        posicaoSolar: data.posicao_solar || '',
        vista: data.vista || '',
        localChaves: data.local_chaves || '',
        termoExclusividade: data.termo_exclusividade || '',
        vistaMar: data.vista_mar || false,
        decorado: data.decorado || false,
        aceitaPermuta: data.aceita_permuta || false,
        destaqueHome: data.destaque_home || false,
        ativoSite: data.ativo_site || false,
        destaqueCategoria: data.destaque_categoria || 'none',
        condicoesPagemento: data.condicoes_pagamento || [],
        infraestrutura: data.infraestrutura || [],
        outrasCaracteristicas: data.outras_caracteristicas || [],
        latitude: (data as any).latitude ? String((data as any).latitude) : '',
        longitude: (data as any).longitude ? String((data as any).longitude) : '',
        cep: '',
        edificioId: (data as any).edificio_id || '',
        condominioId: (data as any).condominio_id || '',
        empreendimentoId: (data as any).empreendimento_id || '',
      });
      setExistingImages(data.imagens || []);
      setLoadingData(false);
    };
    load();
  }, [editId]);

  const togglePayment = (cond: string) => {
    setForm(prev => ({
      ...prev,
      condicoesPagemento: prev.condicoesPagemento.includes(cond)
        ? prev.condicoesPagemento.filter(c => c !== cond)
        : [...prev.condicoesPagemento, cond]
    }));
  };

  const addInfra = () => {
    if (newInfra.trim()) {
      set('infraestrutura', [...form.infraestrutura, newInfra.trim()]);
      setNewInfra('');
    }
  };

  const addCaract = () => {
    if (newCaract.trim()) {
      set('outrasCaracteristicas', [...form.outrasCaracteristicas, newCaract.trim()]);
      setNewCaract('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    if (!form.titulo.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const allImages = [...existingImages, ...uploadedUrls];

      const payload = {
        titulo: form.titulo,
        tipo: form.tipo || 'Casa',
        status: form.status || 'Disponível',
        endereco: form.endereco,
        cidade: form.cidade,
        bairro: form.bairro || '',
        empreendimento: form.empreendimento || '',
        unidade: form.unidade || '',
        box: form.box || '',
        quadra: form.quadra || '',
        lote: form.lote || '',
        preco: parseFloat(form.preco) || 0,
        preco_parcelado: parseFloat(form.precoParcelado) || 0,
        comissao: parseFloat(form.comissao) || 0,
        bonus: parseFloat(form.bonus) || 0,
        bonus_validade: form.bonusValidade || '',
        area: parseFloat(form.area) || 0,
        area_privativa: parseFloat(form.areaPrivativa) || 0,
        quartos: form.quartos,
        banheiros: form.banheiros,
        vagas: form.vagas,
        elevadores: form.elevadores,
        descricao: form.descricao || null,
        proprietario: form.proprietario || '',
        proprietario_telefone: form.proprietarioTelefone || '',
        proprietario_tipo: form.proprietarioTipo || '',
        condicao: form.condicao || '',
        padrao: form.padrao || '',
        posicao_predio: form.posicaoPredio || '',
        posicao_solar: form.posicaoSolar || '',
        vista: form.vista || '',
        local_chaves: form.localChaves || '',
        termo_exclusividade: form.termoExclusividade || '',
        vista_mar: form.vistaMar,
        decorado: form.decorado,
        aceita_permuta: form.aceitaPermuta,
        destaque_categoria: form.destaqueCategoria === 'none' ? '' : form.destaqueCategoria,
        destaque_home: form.destaqueHome || form.destaqueCategoria !== 'none',
        ativo_site: form.ativoSite,
        infraestrutura: form.infraestrutura,
        outras_caracteristicas: form.outrasCaracteristicas,
        imagens: allImages.length > 0 ? allImages : null,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        edificio_id: form.edificioId || null,
        condominio_id: form.condominioId || null,
      } as any;

      if (isEdit) {
        const { error } = await supabase
          .from('imoveis')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
        toast({ title: "Sucesso! ✅", description: "Imóvel atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('imoveis')
          .insert([{ ...payload, user_id: user.id }])
          .select();
        if (error) throw error;
        toast({ title: "Sucesso! ✅", description: "Imóvel cadastrado com sucesso!" });
      }

      navigate('/imoveis');
    } catch (error: any) {
      toast({ title: isEdit ? "Erro ao atualizar" : "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const comissaoValor = (parseFloat(form.preco) || 0) * (parseFloat(form.comissao) || 0) / 100;

  if (loadingData) {
    return (
      <div className="max-w-5xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando dados do imóvel...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-black text-foreground mt-2">
            {isEdit ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do imóvel' : 'Preencha os dados completos do imóvel'}
          </p>
        </div>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
        </Button>
      </div>

      {/* ===== BLOCO 1: IDENTIFICAÇÃO ===== */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <SectionHeader icon={Building2} title="Identificação" />

        <div className="space-y-1.5">
          <Label className="text-xs">Título do Imóvel *</Label>
          <Input placeholder="Ex: Apartamento 3 quartos frente mar" value={form.titulo} onChange={e => set('titulo', e.target.value)} required className="h-10" />
        </div>

        <QuickPick
          label="Tipo do Imóvel *"
          icon={<Building2 className="w-3.5 h-3.5" />}
          options={tiposImovel.map(t => ({ label: t, value: t }))}
          value={form.tipo}
          onChange={(v) => set('tipo', v)}
        />

        {/* Edifício, Condomínio e Empreendimento vinculados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Edifício</Label>
            <SearchableSelect
              options={edificiosList.map(ed => ({ id: ed.id, label: ed.nome, sublabel: ed.cidade }))}
              value={form.edificioId}
              onChange={(id) => {
                set('edificioId', id);
                if (id) {
                  const ed = edificiosList.find(x => x.id === id);
                  if (ed) {
                    set('endereco', ed.endereco);
                    set('cidade', ed.cidade);
                    if (ed.infraestrutura?.length) set('infraestrutura', [...new Set([...form.infraestrutura, ...ed.infraestrutura])]);
                  }
                }
              }}
              placeholder="Nenhum"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Condomínio</Label>
            <SearchableSelect
              options={condominiosList.map(co => ({ id: co.id, label: co.nome, sublabel: co.cidade }))}
              value={form.condominioId}
              onChange={(id) => {
                set('condominioId', id);
                if (id) {
                  const co = condominiosList.find(x => x.id === id);
                  if (co) {
                    set('endereco', co.endereco);
                    set('cidade', co.cidade);
                    if (co.amenidades?.length) set('infraestrutura', [...new Set([...form.infraestrutura, ...co.amenidades])]);
                  }
                }
              }}
              placeholder="Nenhum"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Empreendimento</Label>
            <SearchableSelect
              options={empreendimentosList.map(emp => ({ id: emp.id, label: emp.nome, sublabel: emp.cidade }))}
              value={form.empreendimentoId}
              onChange={(id) => {
                set('empreendimentoId', id);
                if (id) {
                  const emp = empreendimentosList.find(x => x.id === id);
                  if (emp) {
                    set('endereco', emp.endereco);
                    set('cidade', emp.cidade);
                    if (emp.infraestrutura?.length) set('infraestrutura', [...new Set([...form.infraestrutura, ...emp.infraestrutura])]);
                  }
                }
              }}
              placeholder="Nenhum"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Empreendimento (texto livre)</Label>
            <Input placeholder="Nome do empreendimento" value={form.empreendimento} onChange={e => set('empreendimento', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Unidade / Quadra</Label>
            <div className="flex gap-2">
              <Input placeholder="Unidade" value={form.unidade} onChange={e => set('unidade', e.target.value)} className="h-10" />
              <Input placeholder="Quadra" value={form.quadra} onChange={e => set('quadra', e.target.value)} className="h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Box / Lote</Label>
            <div className="flex gap-2">
              <Input placeholder="Box" value={form.box} onChange={e => set('box', e.target.value)} className="h-10" />
              <Input placeholder="Lote" value={form.lote} onChange={e => set('lote', e.target.value)} className="h-10" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickPick
            label="Dormitórios"
            icon={<BedDouble className="w-3.5 h-3.5" />}
            options={[0,1,2,3,4,5].map(n => ({ label: n === 5 ? '5+' : String(n), value: n }))}
            value={form.quartos}
            onChange={(v) => set('quartos', v)}
          />
          <QuickPick
            label="Banheiros"
            icon={<Bath className="w-3.5 h-3.5" />}
            options={[0,1,2,3,4,5].map(n => ({ label: n === 5 ? '5+' : String(n), value: n }))}
            value={form.banheiros}
            onChange={(v) => set('banheiros', v)}
          />
          <QuickPick
            label="Vagas"
            icon={<Car className="w-3.5 h-3.5" />}
            options={[0,1,2,3,4].map(n => ({ label: n === 4 ? '4+' : String(n), value: n }))}
            value={form.vagas}
            onChange={(v) => set('vagas', v)}
          />
          <QuickPick
            label="Elevadores"
            options={[0,1,2,3].map(n => ({ label: n === 3 ? '3+' : String(n), value: n }))}
            value={form.elevadores}
            onChange={(v) => set('elevadores', v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Área Privativa (m²)</Label>
            <Input type="number" placeholder="0" value={form.areaPrivativa} onChange={e => set('areaPrivativa', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Área Total (m²)</Label>
            <Input type="number" placeholder="0" value={form.area} onChange={e => set('area', e.target.value)} className="h-10" />
          </div>
        </div>

        <QuickPick
          label="Status"
          options={statusOptions.map(s => ({ label: s, value: s }))}
          value={form.status}
          onChange={(v) => set('status', v)}
        />

        {/* Endereço */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-3 space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> CEP</Label>
            <div className="relative">
              <Input
                placeholder="00000-000"
                value={form.cep}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
                  const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
                  set('cep', formatted);
                }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscarCep(); } }}
                className="pr-9 h-10"
              />
              <button
                type="button"
                disabled={loadingCep}
                onClick={buscarCep}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="sm:col-span-9 space-y-1.5">
            <Label className="text-xs">Endereço Completo</Label>
            <Input placeholder="Rua, número, complemento" value={form.endereco} onChange={e => set('endereco', e.target.value)} className="h-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Cidade *</Label>
            <Input placeholder="Nome da cidade" value={form.cidade} onChange={e => set('cidade', e.target.value)} required className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bairro</Label>
            <Input placeholder="Nome do bairro" value={form.bairro} onChange={e => set('bairro', e.target.value)} className="h-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Latitude</Label>
            <Input type="number" step="any" placeholder="Ex: -29.3456" value={form.latitude} onChange={e => set('latitude', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Longitude</Label>
            <Input type="number" step="any" placeholder="Ex: -50.1234" value={form.longitude} onChange={e => set('longitude', e.target.value)} className="h-10" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          💡 Preencha o CEP e clique na lupa (ou Enter) para buscar endereço e coordenadas automaticamente.
        </p>
      </div>

      {/* ===== BLOCO 2: VALOR E CONDIÇÕES ===== */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <SectionHeader icon={DollarSign} title="Valor e Condições" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Preço (R$)</Label>
            <Input type="number" placeholder="0" value={form.preco} onChange={e => set('preco', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço Parcelado (R$)</Label>
            <Input type="number" placeholder="0" value={form.precoParcelado} onChange={e => set('precoParcelado', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Comissão (%)</Label>
            <Input type="number" placeholder="0" value={form.comissao} onChange={e => set('comissao', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Valor Comissão</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted text-sm font-semibold text-foreground">
              R$ {comissaoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Bônus (R$)</Label>
            <Input type="number" placeholder="0" value={form.bonus} onChange={e => set('bonus', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Validade do Bônus</Label>
            <Input type="date" value={form.bonusValidade} onChange={e => set('bonusValidade', e.target.value)} className="h-10" />
          </div>
        </div>

        <QuickPick
          label="Padrão"
          options={padraoOptions.map(p => ({ label: p, value: p }))}
          value={form.padrao}
          onChange={(v) => set('padrao', v)}
        />

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Condições de Pagamento</Label>
          <div className="flex flex-wrap gap-2">
            {paymentConditionOptions.map(cond => (
              <button
                type="button"
                key={cond}
                onClick={() => togglePayment(cond)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  form.condicoesPagemento.includes(cond)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary'
                )}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== BLOCO 3: PROPRIETÁRIO ===== */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <SectionHeader icon={User} title="Proprietário" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nome do Proprietário</Label>
            <Input placeholder="Nome completo" value={form.proprietario} onChange={e => set('proprietario', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Telefone</Label>
            <Input placeholder="(00) 00000-0000" value={form.proprietarioTelefone} onChange={e => set('proprietarioTelefone', e.target.value)} className="h-10" />
          </div>
        </div>

        <QuickPick
          label="Tipo do Proprietário"
          options={ownerTypeOptions.map(t => ({ label: t, value: t }))}
          value={form.proprietarioTipo}
          onChange={(v) => set('proprietarioTipo', v)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Key className="w-3.5 h-3.5" /> Local das Chaves</Label>
            <Input placeholder="Ex: Portaria, Imobiliária..." value={form.localChaves} onChange={e => set('localChaves', e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Termo de Exclusividade</Label>
            <Input type="date" value={form.termoExclusividade} onChange={e => set('termoExclusividade', e.target.value)} className="h-10" />
          </div>
        </div>
      </div>

      {/* ===== BLOCO 4: CARACTERÍSTICAS ===== */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <SectionHeader icon={Sparkles} title="Características" />

        <QuickPick
          label="Condição"
          options={condicaoOptions.map(c => ({ label: c, value: c }))}
          value={form.condicao}
          onChange={(v) => set('condicao', v)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <QuickPick
            label="Posição no Prédio"
            options={posicaoPredioOptions.map(p => ({ label: p, value: p }))}
            value={form.posicaoPredio}
            onChange={(v) => set('posicaoPredio', v)}
          />
          <QuickPick
            label="Posição Solar"
            options={posicaoSolarOptions.map(p => ({ label: p, value: p }))}
            value={form.posicaoSolar}
            onChange={(v) => set('posicaoSolar', v)}
          />
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Vista</Label>
            <Input placeholder="Ex: Mar, Cidade, Lago" value={form.vista} onChange={e => set('vista', e.target.value)} className="h-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3 py-3 px-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Switch checked={form.vistaMar} onCheckedChange={(v) => set('vistaMar', v)} />
            <Label className="text-xs">Vista Mar</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.decorado} onCheckedChange={(v) => set('decorado', v)} />
            <Label className="text-xs">Decorado</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.aceitaPermuta} onCheckedChange={(v) => set('aceitaPermuta', v)} />
            <Label className="text-xs">Permuta</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.ativoSite} onCheckedChange={(v) => set('ativoSite', v)} />
            <Label className="text-xs font-semibold">🌐 Site</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.destaqueHome}
              onCheckedChange={(v) => {
                set('destaqueHome', v);
                if (!v) set('destaqueCategoria', 'none');
              }}
            />
            <Label className="text-xs font-semibold">⭐ Destaque</Label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de Destaque</Label>
          <Select
            value={form.destaqueCategoria}
            onValueChange={(v) => {
              set('destaqueCategoria', v);
              if (v !== 'none') set('destaqueHome', true);
            }}
          >
            <SelectTrigger className="h-10 max-w-xs">
              <SelectValue placeholder="Selecione o destaque" />
            </SelectTrigger>
            <SelectContent>
              {destaqueCategoriaOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold mb-2 block">Infraestrutura</Label>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set([...infraOptions, ...form.infraestrutura])].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    infraestrutura: prev.infraestrutura.includes(item)
                      ? prev.infraestrutura.filter(i => i !== item)
                      : [...prev.infraestrutura, item]
                  }));
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  form.infraestrutura.includes(item)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                )}
              >
                {item}
              </button>
            ))}
          </div>
          {isSuperAdmin && (
            <div className="flex gap-2 mt-2">
              <Input placeholder="Adicionar nova infraestrutura..." value={newInfra} onChange={e => setNewInfra(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInfra(); } }} className="h-10 max-w-xs" />
              <Button type="button" variant="outline" size="sm" onClick={addInfra} className="h-10"><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs font-semibold mb-2 block">Outras Características</Label>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set([...caracteristicaOptions, ...form.outrasCaracteristicas])].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    outrasCaracteristicas: prev.outrasCaracteristicas.includes(item)
                      ? prev.outrasCaracteristicas.filter(i => i !== item)
                      : [...prev.outrasCaracteristicas, item]
                  }));
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  form.outrasCaracteristicas.includes(item)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                )}
              >
                {item}
              </button>
            ))}
          </div>
          {isSuperAdmin && (
            <div className="flex gap-2 mt-2">
              <Input placeholder="Adicionar nova característica..." value={newCaract} onChange={e => setNewCaract(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCaract(); } }} className="h-10 max-w-xs" />
              <Button type="button" variant="outline" size="sm" onClick={addCaract} className="h-10"><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          )}
        </div>
      </div>

      {/* ===== BLOCO 5: DESCRIÇÃO ===== */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <SectionHeader icon={FileText} title="Descrição" />

        <div className="flex flex-wrap gap-2">
          {[
            { key: 'informativa', label: '📋 Informativa', desc: 'Completa e técnica' },
            { key: 'gatilhos', label: '🎯 Gatilhos de Venda', desc: 'Persuasiva' },
            { key: 'agressiva', label: '🔥 Agressiva', desc: 'Impacto e conversão' },
            { key: 'geolocalizacao', label: '📍 Geolocalização', desc: 'Foco na região' },
          ].map((style) => (
            <Button
              key={style.key}
              type="button"
              variant="outline"
              size="sm"
              disabled={generatingDesc}
              onClick={() => generateDescription(style.key)}
              className="gap-1.5 text-xs"
            >
              {generatingDesc && generatingStyle === style.key ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {style.label}
            </Button>
          ))}
        </div>

        <Textarea
          placeholder="Descreva o imóvel com o máximo de detalhes: localização, diferenciais, infraestrutura do condomínio, vista, acabamentos, etc."
          value={form.descricao}
          onChange={e => set('descricao', e.target.value)}
          rows={8}
          className="resize-y"
        />
      </div>

      {/* ===== BLOCO 6: FOTOS ===== */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <SectionHeader icon={Image} title="Fotos do Imóvel" />

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {existingImages.map((src, i) => (
            <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {imagePreviews.map((src, i) => (
            <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-primary/30 group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1 left-1 text-[8px] bg-primary text-primary-foreground px-1 rounded">Nova</span>
            </div>
          ))}
          <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground mt-1">Adicionar</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Clique para adicionar fotos. Formatos: JPG, PNG, WebP.</p>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
        <Button type="button" variant="outline" onClick={() => navigate('/imoveis')} className="h-10">Cancelar</Button>
        <Button type="submit" disabled={loading} className="gap-2 px-8 h-10">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
        </Button>
      </div>
    </form>
  );
}

export default function CadastroImovel() {
  return (
    <SmartLayout>
      <ImovelForm />
    </SmartLayout>
  );
}

import { useState, useEffect, useRef } from 'react';
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
import { AppLayout } from '@/components/AppLayout';
import { BackButton } from '@/components/BackButton';
import { QuickPick } from '@/components/QuickPick';
import { QuickPickWithConfirm } from '@/components/QuickPickWithConfirm';
import { CepAutoFill, type AddressData } from '@/components/CepAutoFill';
import { DraggableBlocks } from '@/components/DraggableBlocks';
import { InfraToggle } from '@/components/InfraToggle';
import { useSystemOptions } from '@/hooks/useSystemOptions';
import {
  Building2, MapPin, BedDouble, Bath, Car, Ruler, User, Phone, DollarSign,
  Percent, Gift, Home, Sparkles, Save, Image, Plus, X, Loader2,
  Hash, FileText, Eye, Key, Calendar, Building, Fence, Landmark, Search, Brain, Wand2,
  Play, FolderDown, History, Clock
} from 'lucide-react';
import { format } from 'date-fns';

const tiposImovel = ["Apartamento", "Casa", "Comercial", "Terreno", "Lote", "Condomínio"];
const statusOptions = ["Disponível", "Vendido", "Reservado", "Alugado", "Suspenso"];
const condicaoOptions = ["Mobiliado", "Semi-mobiliado", "Vazio", "Decorado"];
const ownerTypeOptions = ["Construtora", "Investidor", "Particular", "Adm Comercial", "Exclusividade"];
const padraoOptions = ["Econômico", "Médio Padrão", "Alto Padrão", "Luxo"];
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

export interface FormData {
  titulo: string;
  tipo: string;
  status: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
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
  lavabo: number;
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
  termoExclusividadeUrl: string;
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
  edificio_id: string;
  condominio_id: string;
  empreendimento_id: string;
  linkVideo: string;
  linkMaterial: string;
  link360: string;
}

export const initialForm: FormData = {
  titulo: '', tipo: '', status: 'Disponível', cep: '', endereco: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '',
  empreendimento: '', unidade: '', box: '', quadra: '', lote: '',
  preco: '', precoParcelado: '', comissao: '', bonus: '', bonusValidade: '',
  area: '', areaPrivativa: '', quartos: 0, banheiros: 0, lavabo: 0, vagas: 0, elevadores: 0,
  descricao: '', proprietario: '', proprietarioTelefone: '', proprietarioTipo: '',
  condicao: '', padrao: '', posicaoPredio: '', posicaoSolar: '', vista: '',
  localChaves: '', termoExclusividade: '', termoExclusividadeUrl: '',
  vistaMar: false, decorado: false, aceitaPermuta: false, destaqueHome: false, ativoSite: false,
  destaqueCategoria: 'none',
  condicoesPagemento: [], infraestrutura: [], outrasCaracteristicas: [],
  latitude: '', longitude: '',
  edificio_id: '', condominio_id: '', empreendimento_id: '',
  linkVideo: '', linkMaterial: '', link360: '',
};

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-border">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
  );
}

interface EntityOption {
  id: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  latitude?: number;
  longitude?: number;
  infraestrutura?: string[];
  amenidades?: string[];
  cep?: string;
  numero?: string;
  complemento?: string;
  estado?: string;
}

function EntitySelector({ label, icon, table, value, onChange, onSelect, openId, setOpenId, id }: {
  label: string;
  icon: React.ReactNode;
  table: 'edificios' | 'condominios' | 'empreendimentos';
  value: string;
  onChange: (id: string) => void;
  onSelect: (entity: EntityOption) => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  id: string;
}) {
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const open = openId === id;

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from(table).select('*').order('nome');
      if (data) setOptions(data as any);
    };
    load();
  }, [table]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenId(null);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, setOpenId]);

  const filtered = options.filter(o => o.nome.toLowerCase().includes(search.toLowerCase()));
  const selectedName = options.find(o => o.id === value)?.nome || '';

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <Label className="text-xs flex items-center gap-1">{icon} {label}</Label>
      <div className="relative">
        <Input
          placeholder={`Buscar ${label.toLowerCase()}...`}
          value={open ? search : selectedName}
          onChange={(e) => { setSearch(e.target.value); setOpenId(id); }}
          onFocus={() => setOpenId(id)}
        />
        {value && (
          <button type="button" onClick={() => { onChange(''); setSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o.id);
                onSelect(o);
                setSearch('');
                setOpenId(null);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <span className="font-medium">{o.nome}</span>
              {o.cidade && <span className="text-muted-foreground ml-2 text-xs">• {o.cidade}</span>}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && search && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-3 text-sm text-muted-foreground">
          Nenhum encontrado
        </div>
      )}
    </div>
  );
}

function EntitySelectorsGroup({ form, set, handleEntitySelect }: {
  form: any;
  set: (k: any, v: any) => void;
  handleEntitySelect: (entity: EntityOption) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <EntitySelector
        id="edificio"
        openId={openId}
        setOpenId={setOpenId}
        label="Edifício"
        icon={<Building className="w-3.5 h-3.5" />}
        table="edificios"
        value={form.edificio_id}
        onChange={(id) => {
          set('edificio_id', id);
          if (id) { set('condominio_id', ''); set('empreendimento_id', ''); }
        }}
        onSelect={handleEntitySelect}
      />
      <EntitySelector
        id="condominio"
        openId={openId}
        setOpenId={setOpenId}
        label="Condomínio"
        icon={<Fence className="w-3.5 h-3.5" />}
        table="condominios"
        value={form.condominio_id}
        onChange={(id) => {
          set('condominio_id', id);
          if (id) { set('edificio_id', ''); set('empreendimento_id', ''); }
        }}
        onSelect={handleEntitySelect}
      />
      <EntitySelector
        id="loteamento"
        openId={openId}
        setOpenId={setOpenId}
        label="Loteamento"
        icon={<Landmark className="w-3.5 h-3.5" />}
        table="empreendimentos"
        value={form.empreendimento_id}
        onChange={(id) => {
          set('empreendimento_id', id);
          if (id) { set('edificio_id', ''); set('condominio_id', ''); }
        }}
        onSelect={handleEntitySelect}
      />
    </div>
  );
}

const descriptionStyles = [
  { id: "gatilhos", label: "🎯 Gatilhos de Venda", desc: "Persuasão e urgência" },
  { id: "agressiva", label: "🔥 Agressiva", desc: "Impacto e conversão" },
  { id: "informativa", label: "📋 Informativa", desc: "Detalhes técnicos" },
  { id: "geolocalizacao", label: "📍 Geolocalização", desc: "Foco na localização" },
];

function DescriptionAI({ form, onGenerated }: { form: FormData; onGenerated: (text: string) => void }) {
  const [generating, setGenerating] = useState(false);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = async (style: string) => {
    if (!form.titulo && !form.tipo && !form.cidade) {
      toast({ title: "Preencha dados básicos", description: "Título, tipo e cidade são necessários para gerar.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setActiveStyle(style);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: {
          property: {
            title: form.titulo,
            type: form.tipo,
            status: form.status,
            price: parseFloat(form.preco) || 0,
            address: form.endereco,
            city: form.cidade,
            area: parseFloat(form.area) || 0,
            privateArea: parseFloat(form.areaPrivativa) || 0,
            bedrooms: form.quartos,
            bathrooms: form.banheiros,
            parking: form.vagas,
            seaView: form.vistaMar,
            decorated: form.decorado,
            acceptsExchange: form.aceitaPermuta,
            empreendimento: form.empreendimento,
            posicaoPredio: form.posicaoPredio,
            posicaoSolar: form.posicaoSolar,
            vista: form.vista,
            condicao: form.condicao,
            infraestrutura: form.infraestrutura,
            elevadores: form.elevadores,
            paymentConditions: form.condicoesPagemento,
            neighborhood: form.bairro,
          },
          style,
        },
      });
      if (error || data?.error) {
        toast({ title: "Erro ao gerar", description: data?.error || error?.message, variant: "destructive" });
      } else if (data?.description) {
        onGenerated(data.description);
        toast({ title: "Descrição gerada ✅" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
    setGenerating(false);
    setActiveStyle(null);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">Gerar com IA</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {descriptionStyles.map(s => (
          <button
            key={s.id}
            type="button"
            disabled={generating}
            onClick={() => generate(s.id)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {generating && activeStyle === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const fieldLabels: Record<string, string> = {
  titulo: 'Título', tipo: 'Tipo', status: 'Status', cep: 'CEP', endereco: 'Endereço',
  numero: 'Número', complemento: 'Complemento', bairro: 'Bairro', cidade: 'Cidade', estado: 'Estado',
  empreendimento: 'Loteamento', unidade: 'Unidade', box: 'Box', quadra: 'Quadra', lote: 'Lote',
  preco: 'Preço', precoParcelado: 'Preço Parcelado', comissao: 'Comissão %', bonus: 'Bônus', bonusValidade: 'Validade Bônus',
  area: 'Área Total', areaPrivativa: 'Área Privativa', quartos: 'Quartos', banheiros: 'Banheiros',
  lavabo: 'Lavabo', vagas: 'Vagas', elevadores: 'Elevadores', descricao: 'Descrição',
  proprietario: 'Proprietário', proprietarioTelefone: 'Tel. Proprietário', proprietarioTipo: 'Tipo Proprietário',
  condicao: 'Condição', padrao: 'Padrão', posicaoPredio: 'Posição Prédio', posicaoSolar: 'Posição Solar',
  vista: 'Vista', localChaves: 'Local Chaves', termoExclusividade: 'Exclusividade',
  vistaMar: 'Vista Mar', decorado: 'Decorado', aceitaPermuta: 'Aceita Permuta',
  destaqueHome: 'Destaque Home', ativoSite: 'Ativo no Site', destaqueCategoria: 'Categoria Destaque',
  condicoesPagemento: 'Condições Pagamento', infraestrutura: 'Infraestrutura',
  outrasCaracteristicas: 'Outras Características', latitude: 'Latitude', longitude: 'Longitude',
  linkVideo: 'Link Vídeo', linkMaterial: 'Link Material', link360: 'Link 360°',
};

function computeChanges(original: FormData, current: FormData): { field: string; from: string; to: string }[] {
  const changes: { field: string; from: string; to: string }[] = [];
  for (const key of Object.keys(original) as (keyof FormData)[]) {
    const o = JSON.stringify(original[key]);
    const c = JSON.stringify(current[key]);
    if (o !== c) {
      const label = fieldLabels[key] || key;
      const formatVal = (v: any) => {
        if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
        if (Array.isArray(v)) return v.length ? v.join(', ') : '(vazio)';
        return String(v || '(vazio)');
      };
      changes.push({ field: label, from: formatVal(original[key]), to: formatVal(current[key]) });
    }
  }
  return changes;
}

export function ImovelForm({ editId }: { editId?: string }) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editId);
  const [form, setForm] = useState<FormData>(initialForm);
  const originalFormRef = useRef<FormData>(initialForm);
  const [newInfra, setNewInfra] = useState('');
  const [newCaract, setNewCaract] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const { values: infraOptions } = useSystemOptions("infraestrutura");
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const isEdit = !!editId;
  const set = (field: keyof FormData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

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
        cep: (data as any).cep || '',
        endereco: data.endereco || '',
        numero: (data as any).numero || '',
        complemento: (data as any).complemento || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        estado: (data as any).estado || '',
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
        lavabo: (data as any).lavabo || 0,
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
        latitude: data.latitude ? String(data.latitude) : '',
        longitude: data.longitude ? String(data.longitude) : '',
        edificio_id: data.edificio_id || '',
        condominio_id: data.condominio_id || '',
        empreendimento_id: data.empreendimento_id || '',
        linkVideo: (data as any).link_video || '',
        linkMaterial: (data as any).link_material || '',
        link360: (data as any).link_360 || '',
      });
      originalFormRef.current = {
        titulo: data.titulo || '', tipo: data.tipo || '', status: data.status || 'Disponível',
        cep: (data as any).cep || '', endereco: data.endereco || '', numero: (data as any).numero || '',
        complemento: (data as any).complemento || '', bairro: data.bairro || '', cidade: data.cidade || '',
        estado: (data as any).estado || '', empreendimento: data.empreendimento || '', unidade: data.unidade || '',
        box: data.box || '', quadra: data.quadra || '', lote: data.lote || '',
        preco: data.preco ? String(data.preco) : '', precoParcelado: data.preco_parcelado ? String(data.preco_parcelado) : '',
        comissao: data.comissao ? String(data.comissao) : '', bonus: data.bonus ? String(data.bonus) : '',
        bonusValidade: data.bonus_validade || '', area: data.area ? String(data.area) : '',
        areaPrivativa: data.area_privativa ? String(data.area_privativa) : '', quartos: data.quartos || 0,
        banheiros: data.banheiros || 0, lavabo: (data as any).lavabo || 0, vagas: data.vagas || 0,
        elevadores: data.elevadores || 0, descricao: data.descricao || '', proprietario: data.proprietario || '',
        proprietarioTelefone: data.proprietario_telefone || '', proprietarioTipo: data.proprietario_tipo || '',
        condicao: data.condicao || '', padrao: data.padrao || '', posicaoPredio: data.posicao_predio || '',
        posicaoSolar: data.posicao_solar || '', vista: data.vista || '', localChaves: data.local_chaves || '',
        termoExclusividade: data.termo_exclusividade || '', vistaMar: data.vista_mar || false,
        decorado: data.decorado || false, aceitaPermuta: data.aceita_permuta || false,
        destaqueHome: data.destaque_home || false, ativoSite: data.ativo_site || false,
        destaqueCategoria: data.destaque_categoria || 'none', condicoesPagemento: data.condicoes_pagamento || [],
        infraestrutura: data.infraestrutura || [], outrasCaracteristicas: data.outras_caracteristicas || [],
        latitude: data.latitude ? String(data.latitude) : '', longitude: data.longitude ? String(data.longitude) : '',
        edificio_id: data.edificio_id || '', condominio_id: data.condominio_id || '',
        empreendimento_id: data.empreendimento_id || '', linkVideo: (data as any).link_video || '',
        linkMaterial: (data as any).link_material || '', link360: (data as any).link_360 || '',
      };
      setExistingImages(data.imagens || []);
      setLoadingData(false);
    };
    load();
  }, [editId]);

  // Load logs for edit mode
  useEffect(() => {
    if (!editId) return;
    const loadLogs = async () => {
      setLogsLoading(true);
      const { data } = await supabase
        .from('imovel_logs')
        .select('*')
        .eq('imovel_id', editId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setLogs(data);
      setLogsLoading(false);
    };
    loadLogs();
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

  const handleEntitySelect = (entity: EntityOption) => {
    const updates: Partial<FormData> = {};
    if (entity.endereco) updates.endereco = entity.endereco;
    if (entity.cidade) updates.cidade = entity.cidade;
    if (entity.bairro) updates.bairro = entity.bairro;
    if ((entity as any).cep) updates.cep = (entity as any).cep;
    if ((entity as any).numero) updates.numero = (entity as any).numero;
    if ((entity as any).complemento) updates.complemento = (entity as any).complemento;
    if ((entity as any).estado) updates.estado = (entity as any).estado;
    if (entity.latitude) updates.latitude = String(entity.latitude);
    if (entity.longitude) updates.longitude = String(entity.longitude);
    // Merge infrastructure
    const entityInfra = entity.infraestrutura || entity.amenidades || [];
    if (entityInfra.length > 0) {
      updates.infraestrutura = [...new Set([...form.infraestrutura, ...entityInfra])];
    }
    setForm(prev => ({ ...prev, ...updates }));
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
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const allImages = [...existingImages, ...uploadedUrls];

      const payload = {
        titulo: form.titulo,
        tipo: form.tipo || 'Casa',
        status: form.status || 'Disponível',
        cep: form.cep || '',
        endereco: form.endereco,
        numero: form.numero || '',
        complemento: form.complemento || '',
        cidade: form.cidade,
        estado: form.estado || '',
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
        lavabo: form.lavabo,
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
        edificio_id: form.edificio_id || null,
        condominio_id: form.condominio_id || null,
        empreendimento_id: form.empreendimento_id || null,
        link_video: form.linkVideo || '',
        link_material: form.linkMaterial || '',
        link_360: form.link360 || '',
      } as any;

      if (isEdit) {
        const { error } = await supabase.from('imoveis').update(payload).eq('id', editId);
        if (error) throw error;

        // Insert change log
        const changes = computeChanges(originalFormRef.current, form);
        if (changes.length > 0 && user) {
          await supabase.from('imovel_logs').insert({
            imovel_id: editId,
            user_id: user.id,
            user_name: profile?.full_name || user.email || 'Desconhecido',
            action: 'edit',
            changes,
          });
        }

        toast({ title: "Sucesso! ✅", description: "Imóvel atualizado com sucesso!" });
      } else {
        const { data: inserted, error } = await supabase.from('imoveis').insert([{ ...payload, user_id: user.id }]).select().single();
        if (error) throw error;

        // Insert creation log
        if (inserted && user) {
          await supabase.from('imovel_logs').insert({
            imovel_id: inserted.id,
            user_id: user.id,
            user_name: profile?.full_name || user.email || 'Desconhecido',
            action: 'create',
            changes: [{ field: 'Cadastro', from: '', to: 'Imóvel criado' }],
          });
        }

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

  const addressData: AddressData = {
    cep: form.cep,
    endereco: form.endereco,
    numero: form.numero,
    complemento: form.complemento,
    bairro: form.bairro,
    cidade: form.cidade,
    estado: form.estado,
    latitude: form.latitude,
    longitude: form.longitude,
  };

  const handleAddressChange = (updates: Partial<AddressData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

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
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <BackButton />
          <h1 className="text-xl sm:text-2xl font-black text-foreground mt-2">
            {isEdit ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
          </h1>
        </div>
        <Button type="submit" disabled={loading} className="gap-2 w-full sm:w-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
        </Button>
      </div>

      <DraggableBlocks storageKey="cadastro-imovel-blocks-order">
      {/* ===== BLOCO 1: IDENTIFICAÇÃO ===== */}
      <div key="identificacao" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={Building2} title="Identificação" />

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-4 mb-4">
          <div className="space-y-1.5 sm:col-span-3">
            <Label className="text-xs">Título do Imóvel *</Label>
            <Input placeholder="Ex: Apartamento 3 quartos frente mar" value={form.titulo} onChange={e => set('titulo', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Unidade</Label>
            <Input placeholder="Unidade" value={form.unidade} onChange={e => set('unidade', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Box</Label>
            <div className="flex flex-wrap items-center gap-1">
              {form.box.split(',').filter(b => b.trim()).map((b, i) => (
                <span key={i} className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-md">
                  {b.trim()}
                  <button type="button" className="hover:text-destructive" onClick={() => {
                    const boxes = form.box.split(',').filter(x => x.trim());
                    boxes.splice(i, 1);
                    set('box', boxes.join(', '));
                  }}><X className="w-3 h-3" /></button>
                </span>
              ))}
              <div className="flex items-center gap-0.5">
                <Input
                  placeholder="Nº"
                  className="w-16 h-8 text-xs"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (!val) return;
                      const current = form.box.split(',').filter(x => x.trim());
                      current.push(val);
                      set('box', current.join(', '));
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  const val = input?.value?.trim();
                  if (!val) return;
                  const current = form.box.split(',').filter(x => x.trim());
                  current.push(val);
                  set('box', current.join(', '));
                  input.value = '';
                }}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Quadra / Lote</Label>
            <div className="flex gap-1">
              <Input placeholder="Qd" value={form.quadra} onChange={e => set('quadra', e.target.value)} />
              <Input placeholder="Lt" value={form.lote} onChange={e => set('lote', e.target.value)} />
            </div>
          </div>
        </div>

        <QuickPick label="Tipo do Imóvel" options={tiposImovel} value={form.tipo} onChange={(v) => set('tipo', v)} icon={<Home className="w-3.5 h-3.5" />} className="mb-4" />
        <QuickPickWithConfirm
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(v) => set('status', v)}
          className="mb-4"
        />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4">
          <QuickPick label="Dormitórios" options={[0, 1, 2, 3, 4, "5+"]} value={form.quartos} onChange={(v) => set('quartos', v === "5+" ? 5 : Number(v))} icon={<BedDouble className="w-3.5 h-3.5" />} />
          <QuickPick label="Banheiros" options={[0, 1, 2, 3, 4, "5+"]} value={form.banheiros} onChange={(v) => set('banheiros', v === "5+" ? 5 : Number(v))} icon={<Bath className="w-3.5 h-3.5" />} />
          <QuickPick label="Lavabo" options={[0, 1, "2+"]} value={form.lavabo} onChange={(v) => set('lavabo', v === "2+" ? 2 : Number(v))} icon={<Bath className="w-3.5 h-3.5" />} />
          <QuickPick label="Vagas" options={[0, 1, 2, 3, "4+"]} value={form.vagas} onChange={(v) => set('vagas', v === "4+" ? 4 : Number(v))} icon={<Car className="w-3.5 h-3.5" />} />
          <QuickPick label="Elevadores" options={[0, 1, 2, "3+"]} value={form.elevadores} onChange={(v) => set('elevadores', v === "3+" ? 3 : Number(v))} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Área Privativa (m²)</Label>
            <Input type="number" placeholder="0" value={form.areaPrivativa} onChange={e => set('areaPrivativa', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Área Total (m²)</Label>
            <Input type="number" placeholder="0" value={form.area} onChange={e => set('area', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ===== BLOCO: VINCULAÇÃO DE ENTIDADE ===== */}
      <div key="vinculacao" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={Landmark} title="Vincular a Edifício / Condomínio / Loteamento" />
        <p className="text-xs text-muted-foreground mb-4">Selecione apenas um. O endereço e infraestrutura serão preenchidos automaticamente.</p>
        <EntitySelectorsGroup form={form} set={set} handleEntitySelect={handleEntitySelect} />

      </div>

      {/* ===== BLOCO: ENDEREÇO COM CEP ===== */}
      <div key="endereco" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={MapPin} title="Endereço" />
        <CepAutoFill data={addressData} onChange={handleAddressChange} />
      </div>

      {/* ===== BLOCO 2: VALOR E CONDIÇÕES ===== */}
      <div key="valor" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={DollarSign} title="Valor e Condições" />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Preço (R$)</Label>
            <Input type="number" placeholder="0" value={form.preco} onChange={e => set('preco', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço Parcelado (R$)</Label>
            <Input type="number" placeholder="0" value={form.precoParcelado} onChange={e => set('precoParcelado', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Comissão (%)</Label>
            <Input type="number" placeholder="0" value={form.comissao} onChange={e => set('comissao', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Valor Comissão</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted text-sm font-semibold text-foreground">
              R$ {comissaoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Bônus (R$)</Label>
            <Input type="number" placeholder="0" value={form.bonus} onChange={e => set('bonus', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Validade do Bônus</Label>
            <Input type="date" value={form.bonusValidade} onChange={e => set('bonusValidade', e.target.value)} />
          </div>
          <QuickPick label="Padrão" options={padraoOptions} value={form.padrao} onChange={(v) => set('padrao', String(v))} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Condições de Pagamento</Label>
          <div className="flex flex-wrap gap-2">
            {paymentConditionOptions.map(cond => (
              <button
                type="button"
                key={cond}
                onClick={() => togglePayment(cond)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.condicoesPagemento.includes(cond)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== BLOCO 3: PROPRIETÁRIO ===== */}
      <div key="proprietario" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={User} title="Proprietário" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nome</Label>
            <Input placeholder="Nome completo" value={form.proprietario} onChange={e => set('proprietario', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Telefone</Label>
            <Input placeholder="(00) 00000-0000" value={form.proprietarioTelefone} onChange={e => set('proprietarioTelefone', e.target.value)} />
          </div>
          <QuickPick label="Tipo do Proprietário" options={ownerTypeOptions} value={form.proprietarioTipo} onChange={(v) => set('proprietarioTipo', String(v))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Key className="w-3.5 h-3.5" /> Local das Chaves</Label>
            <Input placeholder="Ex: Portaria, Imobiliária..." value={form.localChaves} onChange={e => set('localChaves', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Termo de Exclusividade</Label>
            <Input type="date" value={form.termoExclusividade} onChange={e => set('termoExclusividade', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ===== BLOCO 4: CARACTERÍSTICAS ===== */}
      <div key="caracteristicas" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={Sparkles} title="Características" />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <QuickPick label="Condição" options={condicaoOptions} value={form.condicao} onChange={(v) => set('condicao', String(v))} />
          <div className="space-y-1.5">
            <Label className="text-xs">Posição no Prédio</Label>
            <Input placeholder="Ex: Frente, Fundos" value={form.posicaoPredio} onChange={e => set('posicaoPredio', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Posição Solar</Label>
            <Input placeholder="Ex: Nascente, Poente" value={form.posicaoSolar} onChange={e => set('posicaoSolar', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Vista</Label>
            <Input placeholder="Ex: Mar, Cidade" value={form.vista} onChange={e => set('vista', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6 mb-4 py-3 px-3 sm:px-4 bg-muted/50 rounded-lg">
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
              onCheckedChange={(v) => { set('destaqueHome', v); if (!v) set('destaqueCategoria', 'none'); }}
            />
            <Label className="text-xs font-semibold">⭐ Destaque</Label>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <QuickPick
              label="Tipo de Destaque"
              options={destaqueCategoriaOptions.map(o => o.label)}
              value={destaqueCategoriaOptions.find(o => o.value === form.destaqueCategoria)?.label || 'Sem destaque'}
              onChange={(v) => {
                const opt = destaqueCategoriaOptions.find(o => o.label === String(v));
                set('destaqueCategoria', opt?.value || 'none');
                if (opt && opt.value !== 'none') set('destaqueHome', true);
              }}
            />
          </div>
        </div>

        <InfraToggle
          label="Infraestrutura"
          options={infraOptions}
          selected={form.infraestrutura}
          onChange={(sel) => set('infraestrutura', sel)}
          allowCustom
        />

        <div>
          <Label className="text-xs font-semibold mb-2 block">Outras Características</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.outrasCaracteristicas.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                {item}
                <button type="button" onClick={() => set('outrasCaracteristicas', form.outrasCaracteristicas.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Ex: Beira Lago, Documentação OK..." value={newCaract} onChange={e => setNewCaract(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCaract(); } }} className="flex-1 sm:max-w-xs" />
            <Button type="button" variant="outline" size="sm" onClick={addCaract}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* ===== BLOCO 5: DESCRIÇÃO COM IA ===== */}
      <div key="descricao" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={FileText} title="Descrição" />
        <DescriptionAI form={form} onGenerated={(text) => set('descricao', text)} />
        <Textarea placeholder="Descreva o imóvel com o máximo de detalhes..." value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={6} className="resize-y" />
      </div>

      {/* ===== BLOCO 5B: LINKS DE MÍDIA ===== */}
      <div key="midia" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={Play} title="Vídeo e Material" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Play className="w-3.5 h-3.5" /> Link do Vídeo</Label>
            <Input placeholder="https://youtube.com/..." value={form.linkVideo} onChange={e => set('linkVideo', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><FolderDown className="w-3.5 h-3.5" /> Link Material Completo</Label>
            <Input placeholder="https://drive.google.com/..." value={form.linkMaterial} onChange={e => set('linkMaterial', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Tour 360° (embed ou link)</Label>
            <Input placeholder="https://kuula.co/... ou código embed" value={form.link360} onChange={e => set('link360', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ===== BLOCO 6: FOTOS ===== */}
      <div key="fotos" className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <SectionHeader icon={Image} title="Fotos do Imóvel" />
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4">
          {existingImages.map((src, i) => (
            <div key={`existing-${i}`} className="relative aspect-square sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-border group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {imagePreviews.map((src, i) => (
            <div key={`new-${i}`} className="relative aspect-square sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-primary/30 group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              <span className="absolute bottom-1 left-1 text-[8px] bg-primary text-primary-foreground px-1 rounded">Nova</span>
            </div>
          ))}
          <label className="aspect-square sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground mt-1">Adicionar</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
          </label>
        </div>
      </div>
      </DraggableBlocks>

      {isEdit && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
          <SectionHeader icon={History} title="Histórico de Alterações" />
          {logsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando histórico...
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhuma alteração registrada.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="border border-border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${log.action === 'create' ? 'bg-emerald-500' : 'bg-primary'}`} />
                      <span className="text-xs font-semibold text-foreground">
                        {log.action === 'create' ? 'Cadastro' : 'Edição'}
                      </span>
                      <span className="text-xs text-muted-foreground">por</span>
                      <span className="text-xs font-medium text-foreground">{log.user_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(Array.isArray(log.changes) ? log.changes : []).map((c: any, i: number) => (
                      <div key={i} className="text-xs flex flex-wrap gap-1">
                        <span className="font-medium text-foreground">{c.field}:</span>
                        {c.from && c.from !== '(vazio)' && (
                          <span className="text-destructive line-through">{c.from.length > 60 ? c.from.slice(0, 60) + '...' : c.from}</span>
                        )}
                        <span className="text-muted-foreground">→</span>
                        <span className="text-emerald-500">{c.to.length > 60 ? c.to.slice(0, 60) + '...' : c.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
        <Button type="button" variant="outline" onClick={() => navigate('/imoveis')} className="w-full sm:w-auto">Cancelar</Button>
        <Button type="submit" disabled={loading} className="gap-2 px-8 w-full sm:w-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}

export default function CadastroImovel() {
  return (
    <AppLayout>
      <ImovelForm />
    </AppLayout>
  );
}

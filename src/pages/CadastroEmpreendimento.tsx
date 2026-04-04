import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { BackButton } from '@/components/BackButton';
import { QuickPick } from '@/components/QuickPick';
import { CepAutoFill, type AddressData } from '@/components/CepAutoFill';
import { InfraToggle } from '@/components/InfraToggle';
import { useSystemOptions } from '@/hooks/useSystemOptions';
import { Landmark, MapPin, Layers, Save, Image, Loader2, Building2, FileText, Calendar, Video, Eye, Plus, X } from 'lucide-react';

const statusOptions = ["Lançamento", "Em construção", "Pronto", "Em vendas"];
const tipoOptions = ["Residencial", "Comercial", "Misto", "Loteamento"];

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-border">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
  );
}

const initialForm = {
  nome: '', construtora: '', tipo: 'Residencial', status: 'Lançamento',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  total_unidades: 0, previsao_entrega: '',
  descricao: '', infraestrutura: [] as string[],
  imagem_url: '', latitude: '', longitude: '',
  imagens: [] as string[], link_360: '', link_video: '',
};

export default function CadastroEmpreendimento() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { values: infraOptions } = useSystemOptions("infraestrutura");
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (editId) {
      supabase.from("empreendimentos").select("*").eq("id", editId).single().then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome || '', construtora: data.construtora || '', tipo: data.tipo || 'Residencial',
            status: data.status || 'Lançamento', cep: (data as any).cep || '', endereco: data.endereco || '',
            numero: (data as any).numero || '', complemento: (data as any).complemento || '',
            bairro: (data as any).bairro || '', cidade: data.cidade || '', estado: (data as any).estado || '',
            total_unidades: data.total_unidades || 0, previsao_entrega: data.previsao_entrega || '',
            descricao: data.descricao || '', infraestrutura: data.infraestrutura || [],
            imagem_url: data.imagem_url || '', latitude: data.latitude ? String(data.latitude) : '',
            longitude: data.longitude ? String(data.longitude) : '',
            imagens: (data as any).imagens || [], link_360: (data as any).link_360 || '', link_video: (data as any).link_video || '',
          });
        }
        setLoading(false);
      });
    }
  }, [editId]);

  const handleSubmit = async () => {
    if (!form.nome || !user) return;
    setSaving(true);
    const payload: any = {
      nome: form.nome, construtora: form.construtora, tipo: form.tipo, status: form.status,
      cep: form.cep, endereco: form.endereco, numero: form.numero, complemento: form.complemento,
      bairro: form.bairro, cidade: form.cidade, estado: form.estado,
      total_unidades: form.total_unidades, previsao_entrega: form.previsao_entrega,
      descricao: form.descricao, infraestrutura: form.infraestrutura,
      imagem_url: form.imagem_url,
      latitude: parseFloat(form.latitude) || 0, longitude: parseFloat(form.longitude) || 0,
      imagens: form.imagens, link_360: form.link_360, link_video: form.link_video,
    };
    if (editId) {
      await supabase.from("empreendimentos").update(payload).eq("id", editId);
      toast({ title: "Empreendimento atualizado ✅" });
    } else {
      await supabase.from("empreendimentos").insert([{ ...payload, user_id: user.id }]);
      toast({ title: "Empreendimento cadastrado ✅" });
    }
    setSaving(false);
    navigate("/empreendimentos");
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm(f => ({ ...f, imagens: [...f.imagens, newImageUrl.trim()] }));
      setNewImageUrl('');
    }
  };

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, imagens: f.imagens.filter((_, i) => i !== idx) }));
  };

  const addressData: AddressData = {
    cep: form.cep, endereco: form.endereco, numero: form.numero, complemento: form.complemento,
    bairro: form.bairro, cidade: form.cidade, estado: form.estado, latitude: form.latitude, longitude: form.longitude,
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <BackButton />
        <h1 className="text-2xl font-bold text-foreground">{editId ? "Editar Empreendimento" : "Novo Empreendimento"}</h1>

        <section>
          <SectionHeader icon={Landmark} title="Dados Básicos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Nome do Empreendimento *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do empreendimento" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Construtora</Label>
              <Input value={form.construtora} onChange={(e) => setForm({ ...form, construtora: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <QuickPick label="Tipo" options={tipoOptions} value={form.tipo} onChange={(v) => setForm({ ...form, tipo: String(v) })} />
            <QuickPick label="Status" options={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: String(v) })} />
          </div>
        </section>

        <section>
          <SectionHeader icon={MapPin} title="Endereço" />
          <CepAutoFill data={addressData} onChange={(updates) => setForm(f => ({ ...f, ...updates }))} />
        </section>

        <section>
          <SectionHeader icon={Layers} title="Características" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Total de Unidades</Label>
              <Input type="number" value={form.total_unidades} onChange={(e) => setForm({ ...form, total_unidades: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Previsão de Entrega</Label>
              <Input value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} placeholder="Ex: Dez/2026" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={FileText} title="Descrição" />
          <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} placeholder="Descrição do empreendimento..." />
        </section>

        <section>
          <SectionHeader icon={Building2} title="Infraestrutura" />
          <InfraToggle label="Selecione a infraestrutura" options={infraOptions.length > 0 ? infraOptions : ["Piscina", "Academia", "Salão de Festas", "Playground", "Quadra", "Churrasqueira", "Segurança 24h", "Portaria", "Elevador", "Estacionamento"]} selected={form.infraestrutura} onChange={(sel) => setForm(f => ({ ...f, infraestrutura: sel }))} allowCustom />
        </section>

        <section>
          <SectionHeader icon={Image} title="Imagem de Capa" />
          <div className="space-y-1.5">
            <Label className="text-xs">URL da Imagem Principal</Label>
            <Input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." />
          </div>
          {form.imagem_url && <img src={form.imagem_url} alt="Preview" className="mt-3 rounded-lg max-h-48 object-cover" />}
        </section>

        <section>
          <SectionHeader icon={Image} title="Galeria de Fotos" />
          <div className="flex gap-2 mb-3">
            <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="Cole a URL da foto e clique +" className="flex-1" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())} />
            <button type="button" onClick={addImage} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
          {form.imagens.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {form.imagens.map((url, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden h-24">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.imagens.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma foto na galeria</p>}
        </section>

        <section>
          <SectionHeader icon={Video} title="Vídeo e Tour 360°" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Link do Vídeo</Label>
              <Input value={form.link_video} onChange={(e) => setForm({ ...form, link_video: e.target.value })} placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Link Tour 360°</Label>
              <Input value={form.link_360} onChange={(e) => setForm({ ...form, link_360: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        </section>


        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button onClick={() => navigate("/empreendimentos")} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editId ? "Salvar Alterações" : "Cadastrar Empreendimento"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

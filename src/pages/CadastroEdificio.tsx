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
import { Building, MapPin, Layers, Save, Image, Loader2, Building2, FileText, Video, FolderDown, Camera } from 'lucide-react';
import { MediaGalleryUpload } from '@/components/MediaGalleryUpload';

const statusOptions = ["Lançamento", "Em construção", "Pronto"];

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-border">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
  );
}

const initialForm = {
  nome: '', construtora: '', ano_construcao: '', status: 'Lançamento',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  andares: 0, total_unidades: 0, unidades_por_andar: 0, descricao: '', infraestrutura: [] as string[],
  imagem_url: '', latitude: '', longitude: '',
  fotos_infra: [] as string[], fotos_empreendimento: [] as string[],
  videos: [] as string[], material_digital: [] as string[],
};

export default function CadastroEdificio() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { values: infraOptions } = useSystemOptions("infraestrutura");
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      supabase.from("edificios").select("*").eq("id", editId).single().then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome || '', construtora: data.construtora || '', ano_construcao: data.ano_construcao || '',
            status: data.status || 'Lançamento', cep: data.cep || '', endereco: data.endereco || '',
            numero: data.numero || '', complemento: data.complemento || '', bairro: data.bairro || '',
            cidade: data.cidade || '', estado: data.estado || '', andares: data.andares || 0,
            total_unidades: data.total_unidades || 0, descricao: '', infraestrutura: data.infraestrutura || [],
            imagem_url: data.imagem_url || '', latitude: data.latitude ? String(data.latitude) : '',
            longitude: data.longitude ? String(data.longitude) : '',
            fotos_infra: (data as any).fotos_infra || [],
            fotos_empreendimento: (data as any).fotos_empreendimento || [],
            videos: (data as any).videos || [],
            material_digital: (data as any).material_digital || [],
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
      nome: form.nome, construtora: form.construtora, ano_construcao: form.ano_construcao,
      status: form.status, cep: form.cep, endereco: form.endereco, numero: form.numero,
      complemento: form.complemento, bairro: form.bairro, cidade: form.cidade, estado: form.estado,
      andares: form.andares, total_unidades: form.total_unidades, infraestrutura: form.infraestrutura,
      imagem_url: form.imagem_url,
      latitude: parseFloat(form.latitude) || 0, longitude: parseFloat(form.longitude) || 0,
      fotos_infra: form.fotos_infra, fotos_empreendimento: form.fotos_empreendimento,
      videos: form.videos, material_digital: form.material_digital,
    };
    if (editId) {
      await supabase.from("edificios").update(payload).eq("id", editId);
      toast({ title: "Edifício atualizado ✅" });
    } else {
      await supabase.from("edificios").insert([{ ...payload, user_id: user.id }]);
      toast({ title: "Edifício cadastrado ✅" });
    }
    setSaving(false);
    navigate("/edificios");
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
        <h1 className="text-2xl font-bold text-foreground">{editId ? "Editar Edifício" : "Novo Edifício"}</h1>

        <section>
          <SectionHeader icon={Building} title="Dados Básicos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Nome do Edifício *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do edifício" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Construtora</Label>
              <Input value={form.construtora} onChange={(e) => setForm({ ...form, construtora: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ano de Construção</Label>
              <Input value={form.ano_construcao} onChange={(e) => setForm({ ...form, ano_construcao: e.target.value })} placeholder="Ex: 2024" />
            </div>
          </div>
          <div className="mt-4">
            <QuickPick label="Status" options={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: String(v) })} />
          </div>
        </section>

        <section>
          <SectionHeader icon={MapPin} title="Endereço" />
          <CepAutoFill data={addressData} onChange={(updates) => setForm(f => ({ ...f, ...updates }))} />
        </section>

        <section>
          <SectionHeader icon={Layers} title="Características" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Andares</Label>
              <Input type="number" value={form.andares || ''} onChange={(e) => setForm({ ...form, andares: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total de Unidades</Label>
              <Input type="number" value={form.total_unidades || ''} onChange={(e) => setForm({ ...form, total_unidades: +e.target.value })} />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={FileText} title="Descrição" />
          <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} placeholder="Descrição do edifício..." />
        </section>

        <section>
          <SectionHeader icon={Building2} title="Infraestrutura" />
          <InfraToggle label="Selecione a infraestrutura" options={infraOptions.length > 0 ? infraOptions : ["Piscina", "Academia", "Salão de Festas", "Playground", "Quadra", "Churrasqueira", "Segurança 24h", "Portaria", "Elevador", "Estacionamento"]} selected={form.infraestrutura} onChange={(sel) => setForm(f => ({ ...f, infraestrutura: sel }))} allowCustom />
        </section>

        <section>
          <SectionHeader icon={Image} title="Imagem de Capa" />
          <MediaGalleryUpload
            label="Envie a imagem de capa"
            values={form.imagem_url ? [form.imagem_url] : []}
            onChange={(v) => setForm(f => ({ ...f, imagem_url: v[v.length - 1] || '' }))}
            folder="edificios/capa"
            kind="image"
            multiple={false}
          />
        </section>

        <section>
          <SectionHeader icon={Camera} title="Fotos do Empreendimento" />
          <MediaGalleryUpload
            label="Fachada, áreas externas, vista aérea, etc."
            values={form.fotos_empreendimento}
            onChange={(v) => setForm(f => ({ ...f, fotos_empreendimento: v }))}
            folder="edificios/fotos-empreendimento"
            kind="image"
          />
        </section>

        <section>
          <SectionHeader icon={Building2} title="Fotos da Infraestrutura" />
          <MediaGalleryUpload
            label="Piscina, academia, salão, playground, etc."
            values={form.fotos_infra}
            onChange={(v) => setForm(f => ({ ...f, fotos_infra: v }))}
            folder="edificios/fotos-infra"
            kind="image"
          />
        </section>

        <section>
          <SectionHeader icon={Video} title="Vídeos" />
          <MediaGalleryUpload
            label="Tour, drone, vídeo institucional (arquivo ou link YouTube/Vimeo)"
            values={form.videos}
            onChange={(v) => setForm(f => ({ ...f, videos: v }))}
            folder="edificios/videos"
            kind="video"
          />
        </section>

        <section>
          <SectionHeader icon={FolderDown} title="Material Digital" />
          <MediaGalleryUpload
            label="Folder, plantas, memorial, tabelas (PDF, imagens, docs)"
            values={form.material_digital}
            onChange={(v) => setForm(f => ({ ...f, material_digital: v }))}
            folder="edificios/material-digital"
            kind="file"
          />
        </section>


        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button onClick={() => navigate("/edificios")} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editId ? "Salvar Alterações" : "Cadastrar Edifício"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

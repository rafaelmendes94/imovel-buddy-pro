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
import { Fence, MapPin, Layers, Save, Image, Loader2, Building2, FileText, DollarSign, FileUp, Upload, Camera, Video, FolderDown } from 'lucide-react';
import { MediaGalleryUpload } from '@/components/MediaGalleryUpload';

const typeOptions = ["Vertical", "Horizontal", "Misto"];

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-border">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
  );
}

const initialForm = {
  nome: '', construtora: '', ano_construcao: '', tipo: 'Vertical',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  total_unidades: 0, unidades_disponiveis: 0, taxa_condominio: 0,
  descricao: '', amenidades: [] as string[],
  imagem_url: '', latitude: '', longitude: '',
  implantacao_url: '',
  mapa_pdf_url: '',
  fotos_infra: [] as string[], fotos_empreendimento: [] as string[],
  videos: [] as string[], material_digital: [] as string[],
};

export default function CadastroCondominio() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { values: infraOptions } = useSystemOptions("infraestrutura");
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editId) {
      supabase.from("condominios").select("*").eq("id", editId).single().then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome || '', construtora: (data as any).construtora || '', ano_construcao: (data as any).ano_construcao || '',
            tipo: data.tipo || 'Vertical', cep: (data as any).cep || '', endereco: data.endereco || '',
            numero: (data as any).numero || '', complemento: (data as any).complemento || '', bairro: (data as any).bairro || '',
            cidade: data.cidade || '', estado: (data as any).estado || '',
            total_unidades: data.total_unidades || 0, unidades_disponiveis: data.unidades_disponiveis || 0,
            taxa_condominio: data.taxa_condominio || 0,
            descricao: (data as any).descricao || '', amenidades: data.amenidades || [],
            imagem_url: data.imagem_url || '', latitude: data.latitude ? String(data.latitude) : '',
            longitude: data.longitude ? String(data.longitude) : '',
            implantacao_url: (data as any).implantacao_url || '',
            mapa_pdf_url: (data as any).mapa_pdf_url || '',
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

  const handleUploadImplantacao = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `implantacoes/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
      setForm(f => ({ ...f, implantacao_url: urlData.publicUrl }));
      toast({ title: "Arquivo enviado ✅" });
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.nome || !user) return;
    setSaving(true);
    const payload: any = {
      nome: form.nome, construtora: form.construtora, ano_construcao: form.ano_construcao,
      tipo: form.tipo, cep: form.cep, endereco: form.endereco, numero: form.numero,
      complemento: form.complemento, bairro: form.bairro, cidade: form.cidade, estado: form.estado,
      total_unidades: form.total_unidades, unidades_disponiveis: form.unidades_disponiveis,
      taxa_condominio: form.taxa_condominio, descricao: form.descricao, amenidades: form.amenidades,
      imagem_url: form.imagem_url,
      latitude: parseFloat(form.latitude) || 0, longitude: parseFloat(form.longitude) || 0,
      implantacao_url: form.implantacao_url,
      mapa_pdf_url: form.mapa_pdf_url,
      fotos_infra: form.fotos_infra, fotos_empreendimento: form.fotos_empreendimento,
      videos: form.videos, material_digital: form.material_digital,
    };
    if (editId) {
      await supabase.from("condominios").update(payload).eq("id", editId);
      toast({ title: "Condomínio atualizado ✅" });
    } else {
      await supabase.from("condominios").insert([{ ...payload, user_id: user.id }]);
      toast({ title: "Condomínio cadastrado ✅" });
    }
    setSaving(false);
    navigate("/condominios");
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
        <h1 className="text-2xl font-bold text-foreground">{editId ? "Editar Condomínio" : "Novo Condomínio"}</h1>

        <section>
          <SectionHeader icon={Fence} title="Dados Básicos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Nome do Condomínio *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do condomínio" />
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
            <QuickPick label="Tipo" options={typeOptions} value={form.tipo} onChange={(v) => setForm({ ...form, tipo: String(v) })} />
          </div>
        </section>

        <section>
          <SectionHeader icon={MapPin} title="Endereço" />
          <CepAutoFill data={addressData} onChange={(updates) => setForm(f => ({ ...f, ...updates }))} />
        </section>

        <section>
          <SectionHeader icon={Layers} title="Características" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Total de Unidades</Label>
              <Input type="number" value={form.total_unidades} onChange={(e) => setForm({ ...form, total_unidades: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unidades Disponíveis</Label>
              <Input type="number" value={form.unidades_disponiveis} onChange={(e) => setForm({ ...form, unidades_disponiveis: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Taxa Condominial (R$)</Label>
              <Input type="number" value={form.taxa_condominio} onChange={(e) => setForm({ ...form, taxa_condominio: +e.target.value })} />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={FileText} title="Descrição" />
          <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} placeholder="Descrição do condomínio..." />
        </section>

        <section>
          <SectionHeader icon={Building2} title="Amenidades / Infraestrutura" />
          <InfraToggle label="Selecione as amenidades" options={infraOptions.length > 0 ? infraOptions : ["Piscina", "Academia", "Salão de Festas", "Playground", "Quadra", "Churrasqueira", "Segurança 24h", "Portaria", "Área Verde", "Sauna", "Spa"]} selected={form.amenidades} onChange={(sel) => setForm(f => ({ ...f, amenidades: sel }))} allowCustom />
        </section>

        <section>
          <SectionHeader icon={FileUp} title="Implantação / Mapa de Lotes" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Enviar PDF / Imagem"}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUploadImplantacao} disabled={uploading} />
              </label>
              {form.implantacao_url && (
                <a href={form.implantacao_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                  <FileUp className="w-3.5 h-3.5" /> Ver arquivo atual
                </a>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ou cole a URL diretamente</Label>
              <Input value={form.implantacao_url} onChange={(e) => setForm({ ...form, implantacao_url: e.target.value })} placeholder="https://..." />
            </div>
            {form.implantacao_url && form.implantacao_url.match(/\.(jpg|jpeg|png|webp)$/i) && (
              <img src={form.implantacao_url} alt="Implantação" className="mt-2 rounded-lg max-h-48 object-contain border border-border" />
            )}
          </div>
        </section>

        <section>
          <SectionHeader icon={FileUp} title="Mapa do Condomínio (PDF)" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Enviar PDF do Mapa"}
                <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  setUploading(true);
                  const path = `mapas/${user.id}/${Date.now()}.pdf`;
                  const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
                  if (error) {
                    toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
                  } else {
                    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
                    setForm(f => ({ ...f, mapa_pdf_url: urlData.publicUrl }));
                    toast({ title: "Mapa enviado ✅" });
                  }
                  setUploading(false);
                }} disabled={uploading} />
              </label>
              {form.mapa_pdf_url && (
                <a href={form.mapa_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                  <FileUp className="w-3.5 h-3.5" /> Ver mapa atual
                </a>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ou cole a URL do PDF</Label>
              <Input value={form.mapa_pdf_url} onChange={(e) => setForm({ ...form, mapa_pdf_url: e.target.value })} placeholder="https://...arquivo.pdf" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={Image} title="Imagem de Capa" />
          <div className="space-y-1.5">
            <Label className="text-xs">URL da Imagem (capa)</Label>
            <Input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." />
          </div>
          {form.imagem_url && <img src={form.imagem_url} alt="Preview" className="mt-3 rounded-lg max-h-48 object-cover" />}
        </section>

        <section>
          <SectionHeader icon={Camera} title="Fotos do Empreendimento" />
          <MediaGalleryUpload
            label="Fachada, áreas externas, vista aérea, etc."
            values={form.fotos_empreendimento}
            onChange={(v) => setForm(f => ({ ...f, fotos_empreendimento: v }))}
            folder="condominios/fotos-empreendimento"
            kind="image"
          />
        </section>

        <section>
          <SectionHeader icon={Building2} title="Fotos da Infraestrutura" />
          <MediaGalleryUpload
            label="Piscina, academia, salão, playground, áreas comuns, etc."
            values={form.fotos_infra}
            onChange={(v) => setForm(f => ({ ...f, fotos_infra: v }))}
            folder="condominios/fotos-infra"
            kind="image"
          />
        </section>

        <section>
          <SectionHeader icon={Video} title="Vídeos" />
          <MediaGalleryUpload
            label="Tour, drone, vídeo institucional (arquivo ou link YouTube/Vimeo)"
            values={form.videos}
            onChange={(v) => setForm(f => ({ ...f, videos: v }))}
            folder="condominios/videos"
            kind="video"
          />
        </section>

        <section>
          <SectionHeader icon={FolderDown} title="Material Digital" />
          <MediaGalleryUpload
            label="Folder, plantas, memorial, tabelas (PDF, imagens, docs)"
            values={form.material_digital}
            onChange={(v) => setForm(f => ({ ...f, material_digital: v }))}
            folder="condominios/material-digital"
            kind="file"
          />
        </section>


        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button onClick={() => navigate("/condominios")} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editId ? "Salvar Alterações" : "Cadastrar Condomínio"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

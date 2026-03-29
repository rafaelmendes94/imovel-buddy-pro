import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/AppLayout';
import { BackButton } from '@/components/BackButton';
import { Building2 } from 'lucide-react';

const initialForm = {
  titulo: '',
  endereco: '',
  cidade: '',
  tipo: '',
  preco: '',
  quartos: '',
  banheiros: '',
  area: '',
  descricao: '',
};

export default function CadastroImovel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.endereco.trim() || !formData.cidade.trim() || !formData.tipo) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('imoveis')
        .insert({
          user_id: user.id,
          titulo: formData.titulo.trim(),
          endereco: formData.endereco.trim(),
          cidade: formData.cidade.trim(),
          tipo: formData.tipo,
          preco: Number(formData.preco) || 0,
          quartos: Number(formData.quartos) || 0,
          banheiros: Number(formData.banheiros) || 0,
          area: Number(formData.area) || 0,
          descricao: formData.descricao.trim(),
        });

      if (error) throw error;

      toast({ title: "Sucesso! ✅", description: "Imóvel cadastrado com sucesso!" });
      setFormData(initialForm);
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cadastrar Imóvel</h1>
            <p className="text-sm text-muted-foreground">Adicione um novo imóvel ao sistema</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Título do Imóvel *</label>
            <Input
              placeholder="Ex: Apartamento 3 quartos vista mar"
              value={formData.titulo}
              onChange={e => handleChange('titulo', e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Endereço *</label>
            <Input
              placeholder="Rua, número, bairro"
              value={formData.endereco}
              onChange={e => handleChange('endereco', e.target.value)}
              maxLength={300}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cidade *</label>
            <Input
              placeholder="Ex: Capão da Canoa"
              value={formData.cidade}
              onChange={e => handleChange('cidade', e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo *</label>
            <Select value={formData.tipo} onValueChange={v => handleChange('tipo', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Apartamento">Apartamento</SelectItem>
                <SelectItem value="Terreno">Terreno</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Cobertura">Cobertura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preço (R$)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formData.preco}
                onChange={e => handleChange('preco', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Área (m²)</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.area}
                onChange={e => handleChange('area', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quartos</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.quartos}
                onChange={e => handleChange('quartos', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Banheiros</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.banheiros}
                onChange={e => handleChange('banheiros', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Textarea
              placeholder="Detalhes sobre o imóvel..."
              value={formData.descricao}
              onChange={e => handleChange('descricao', e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Imóvel'}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}

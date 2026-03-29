import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';

interface Imovel {
  titulo: string;
  endereco: string;
  cidade: string;
  tipo: string;
  preco: number;
  quartos: number;
  banheiros: number;
  area: number;
  descricao: string;
}

function CadastroImovelForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Imovel>({
    titulo: '',
    endereco: '',
    cidade: '',
    tipo: '',
    preco: 0,
    quartos: 0,
    banheiros: 0,
    area: 0,
    descricao: '',
  });

  const handleChange = (field: keyof Imovel, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase
        .from('imoveis')
        .insert([{ ...formData, user_id: user.id }])
        .select();

      if (error) throw error;

      toast({
        title: "Sucesso! ✅",
        description: "Imóvel cadastrado com sucesso!",
      });

      setFormData({
        titulo: '',
        endereco: '',
        cidade: '',
        tipo: '',
        preco: 0,
        quartos: 0,
        banheiros: 0,
        area: 0,
        descricao: '',
      });
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 p-6">
      <h2 className="text-2xl font-bold text-foreground">Cadastrar Imóvel</h2>

      <div className="space-y-2">
        <Label>Título do Imóvel</Label>
        <Input
          placeholder="Ex: Apartamento 3 quartos no Centro"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input
          placeholder="Rua, número, bairro"
          value={formData.endereco}
          onChange={(e) => handleChange('endereco', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Cidade</Label>
        <Input
          placeholder="Nome da cidade"
          value={formData.cidade}
          onChange={(e) => handleChange('cidade', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
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
          <Label>Preço (R$)</Label>
          <Input
            type="number"
            value={formData.preco}
            onChange={(e) => handleChange('preco', Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Área (m²)</Label>
          <Input
            type="number"
            value={formData.area}
            onChange={(e) => handleChange('area', Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quartos</Label>
          <Input
            type="number"
            value={formData.quartos}
            onChange={(e) => handleChange('quartos', Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Banheiros</Label>
          <Input
            type="number"
            value={formData.banheiros}
            onChange={(e) => handleChange('banheiros', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          placeholder="Descreva o imóvel..."
          value={formData.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Imóvel'}
      </Button>
    </form>
  );
}

export default function CadastroImovel() {
  return (
    <AppLayout>
      <CadastroImovelForm />
    </AppLayout>
  );
}

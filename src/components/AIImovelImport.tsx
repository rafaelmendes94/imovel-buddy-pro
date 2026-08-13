import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';

const NUMBER_FIELDS = ['preco', 'precoParcelado', 'comissao', 'bonus', 'area', 'areaPrivativa'];
const INT_FIELDS = ['quartos', 'suites', 'banheiros', 'lavabo', 'vagas', 'elevadores'];
const ARRAY_FIELDS = ['condicoesPagemento', 'infraestrutura', 'outrasCaracteristicas'];
const BOOL_FIELDS = ['vistaMar', 'decorado', 'aceitaPermuta'];

interface AIImovelImportProps {
  onApply: (updates: Record<string, any>) => void;
  currentArrays?: Record<string, string[]>;
}

export function AIImovelImport({ onApply, currentArrays = {} }: AIImovelImportProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (text.trim().length < 10) {
      toast({ title: 'Texto muito curto', description: 'Cole as informações do imóvel para a IA analisar.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-imovel-ia', { body: { text } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const fields = (data?.fields || {}) as Record<string, any>;
      const updates: Record<string, any> = {};
      let count = 0;

      for (const [key, raw] of Object.entries(fields)) {
        if (raw === null || raw === undefined || raw === '') continue;

        if (NUMBER_FIELDS.includes(key)) {
          const n = Number(raw);
          if (!isFinite(n) || n <= 0) continue;
          updates[key] = String(n);
        } else if (INT_FIELDS.includes(key)) {
          const n = Math.round(Number(raw));
          if (!isFinite(n) || n < 0) continue;
          updates[key] = Math.min(n, 10);
        } else if (BOOL_FIELDS.includes(key)) {
          if (typeof raw !== 'boolean') continue;
          updates[key] = raw;
        } else if (ARRAY_FIELDS.includes(key)) {
          if (!Array.isArray(raw) || raw.length === 0) continue;
          const merged = [...new Set([...(currentArrays[key] || []), ...raw.map(String)])];
          updates[key] = merged;
        } else if (typeof raw === 'string') {
          updates[key] = raw.trim();
        } else continue;

        count++;
      }

      if (count === 0) {
        toast({ title: 'Nada identificado', description: 'A IA não encontrou informações reconhecíveis no texto.' });
        return;
      }

      onApply(updates);
      toast({ title: 'Campos preenchidos pela IA 🪄', description: `${count} campo(s) identificados. Revise antes de salvar.` });
    } catch (e: any) {
      console.error('parse-imovel-ia error', e);
      toast({ title: 'Erro ao analisar', description: e?.message || 'Tente novamente em instantes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-base font-bold text-foreground">Cadastrar com IA</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cole o texto do imóvel (anúncio, mensagem do proprietário, ficha, etc.)</Label>
            <Textarea
              rows={6}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'Ex: Apartamento 3 dormitórios sendo 1 suíte, 2 vagas, 110m² privativos, Ed. Solar do Mar, Av. Paraguassu 1200, Centro, Capão da Canoa/RS. R$ 890.000, aceita financiamento e permuta. Frente mar, mobiliado, piscina e academia no condomínio. Proprietário João 51 99999-0000.'}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button type="button" onClick={handleAnalyze} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {loading ? 'Analisando...' : 'Analisar e preencher campos'}
            </Button>
            <p className="text-xs text-muted-foreground">
              A IA preenche apenas os campos que identificar. Revise tudo antes de salvar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

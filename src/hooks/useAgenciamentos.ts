import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Agenciamento {
  id: string;
  user_id: string;
  imovel: string;
  tipo: string;
  padrao: string;
  apto_quadra_lote: string;
  box: string;
  dormitorios: string;
  metragem: number;
  ano_construcao_iptu: string;
  posicao: string;
  mobiliado: string;
  destaque: string;
  bairro: string;
  rua: string;
  valor: number;
  fin_bancario: string;
  entrada: string;
  prazo_direto: string;
  condicao_pagamento: string;
  observacoes: string;
  cond_iptu: string;
  chaves_obra: string;
  proprietario: string;
  telefone: string;
  cidade: string;
  data_inclusao: string | null;
  data_atualizacao: string | null;
  status: string; // ativo | novo_semana | atualizado_semana | vendido
  created_at: string;
  updated_at: string;
}

export function useAgenciamentos() {
  const [list, setList] = useState<Agenciamento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("agenciamentos")
      .select("*")
      .order("data_inclusao", { ascending: false })
      .limit(10000);
    setList((data || []) as Agenciamento[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = list.length;
    const vgv = list.reduce((s, a) => s + (Number(a.valor) || 0), 0);
    const vendidos = list.filter(a => a.status === "vendido").length;
    const novos = list.filter(a => a.status === "novo_semana").length;
    const atualizados = list.filter(a => a.status === "atualizado_semana").length;
    const ativos = list.filter(a => a.status !== "vendido").length;
    const ticketMedio = ativos > 0 ? vgv / ativos : 0;
    return { total, vgv, vendidos, novos, atualizados, ativos, ticketMedio };
  }, [list]);

  return { list, loading, stats, refetch: load };
}

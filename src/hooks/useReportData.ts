import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RealSaleRecord {
  id: string;
  propertyTitle: string;
  city: string;
  neighborhood: string;
  owner: string;
  type: string;
  segment: string;
  broker: string;
  price: number;
  date: string;
  empreendimento: string;
  edificio: string;
  condominio: string;
  bedrooms: number;
  seaView: boolean;
  isManual?: boolean;
  commission?: number;
  client?: string;
}

export function useReportData() {
  const [sales, setSales] = useState<RealSaleRecord[]>([]);
  const [manualSales, setManualSales] = useState<RealSaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [imRes, mvRes] = await Promise.all([
      supabase
        .from("imoveis")
        .select("id, titulo, cidade, bairro, tipo, padrao, preco, corretor_nome, proprietario, empreendimento, quartos, vista_mar, updated_at, status, edificio_id, condominio_id, edificios:edificio_id(nome), condominios:condominio_id(nome)")
        .ilike("status", "%vendid%")
        .order("updated_at", { ascending: false })
        .limit(5000),
      // Agenciamentos com status = vendido entram como vendas no relatório principal
      (supabase as any)
        .from("agenciamentos")
        .select("*")
        .eq("status", "vendido")
        .order("data_atualizacao", { ascending: false })
        .limit(5000),
    ]);

    const real: RealSaleRecord[] = (imRes.data || []).map((row: any) => ({
      id: row.id,
      propertyTitle: row.titulo || "Sem título",
      city: row.cidade || "Sem cidade",
      neighborhood: row.bairro || "Sem bairro",
      owner: row.proprietario || "Sem proprietário",
      type: row.tipo || "Outros",
      segment: row.padrao || "Médio Padrão",
      broker: row.corretor_nome || "Sem corretor",
      price: Number(row.preco) || 0,
      date: row.updated_at || new Date().toISOString(),
      empreendimento: row.empreendimento || "",
      edificio: row.edificios?.nome || "",
      condominio: row.condominios?.nome || "",
      bedrooms: row.quartos || 0,
      seaView: row.vista_mar || false,
      isManual: false,
    }));

    const manual: RealSaleRecord[] = (mvRes.data || []).map((row: any) => ({
      id: row.id,
      propertyTitle: row.empreendimento || row.edificio_condominio || "Venda manual",
      city: row.cidade || "Sem cidade",
      neighborhood: row.bairro || "Sem bairro",
      owner: "—",
      type: row.tipo || "Outros",
      segment: "Médio Padrão",
      broker: row.corretor || "Sem corretor",
      price: Number(row.valor) || 0,
      date: row.data_venda ? new Date(row.data_venda).toISOString() : new Date().toISOString(),
      empreendimento: row.empreendimento || "",
      edificio: row.edificio_condominio || "",
      condominio: row.edificio_condominio || "",
      bedrooms: 0,
      seaView: false,
      isManual: true,
      commission: Number(row.comissao) || 0,
      client: row.cliente || "",
    }));

    setSales(real);
    setManualSales(manual);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const allSales = useMemo(() => [...sales, ...manualSales], [sales, manualSales]);

  const monthlyData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return months.map((month, i) => {
      const monthSales = allSales.filter((s) => new Date(s.date).getMonth() === i);
      return {
        month,
        vendas: monthSales.length,
        receita: monthSales.reduce((sum, s) => sum + s.price, 0),
      };
    });
  }, [allSales]);

  const allCities = useMemo(() => [...new Set(allSales.map((s) => s.city).filter(Boolean))].sort(), [allSales]);
  const allTypes = useMemo(() => [...new Set(allSales.map((s) => s.type).filter(Boolean))].sort(), [allSales]);
  const allSegments = useMemo(() => [...new Set(allSales.map((s) => s.segment).filter(Boolean))].sort(), [allSales]);
  const allYears = useMemo(() => {
    const years = new Set<number>(allSales.map((s) => new Date(s.date).getFullYear()).filter((y) => !isNaN(y)));
    years.add(new Date().getFullYear()); // sempre incluir ano atual
    return [...years].sort((a, b) => b - a);
  }, [allSales]);

  return {
    sales: allSales,
    realSales: sales,
    manualSales,
    monthlyData,
    allCities,
    allTypes,
    allSegments,
    allYears,
    loading,
    refetch: fetchAll,
  };
}

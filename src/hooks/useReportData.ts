import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saleDedupeKey, onSalesChanged } from "@/lib/salesRegistry";

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
  platform?: string;
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
        .select(`
          id, user_id, titulo, cidade, bairro, tipo, padrao, preco, comissao,
          corretor_id, corretor_nome, proprietario, empreendimento, quartos, vista_mar,
          created_at, updated_at, status, edificio_id, condominio_id, empreendimento_id,
          plataforma_venda, data_venda,
          edificios:edificio_id(nome),
          condominios:condominio_id(nome),
          empreendimentos:empreendimento_id(nome)
        `)
        .ilike("status", "%vendid%")
        .order("data_venda", { ascending: false, nullsFirst: false })
        .limit(5000),
      // Agenciamentos com status = vendido entram como vendas no relatório principal
      (supabase as any)
        .from("agenciamentos")
        .select("*")
        .eq("status", "vendido")
        .order("data_atualizacao", { ascending: false })
        .limit(5000),
    ]);

    if (imRes.error) {
      console.error("Erro ao carregar vendas de imóveis", imRes.error);
    }
    if (mvRes.error) {
      console.error("Erro ao carregar agenciamentos vendidos", mvRes.error);
    }

    const imRows = (imRes.data || []) as any[];
    const profileIds = [
      ...new Set(
        imRows
          .flatMap((row) => [row.corretor_id, row.user_id])
          .filter(Boolean),
      ),
    ];
    const { data: profiles } = profileIds.length
      ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", profileIds)
      : { data: [] as any[] };
    const profileByUser = new Map(((profiles as any[]) || []).map((profile) => [profile.user_id, profile]));

    const safeDate = (...values: Array<string | null | undefined>) => {
      const found = values.find((value) => value && !Number.isNaN(new Date(value).getTime()));
      return found ? new Date(found).toISOString() : new Date().toISOString();
    };

    const real: RealSaleRecord[] = (imRes.data || []).map((row: any) => ({
      id: row.id,
      propertyTitle: row.titulo || "Sem título",
      city: row.cidade || "Sem cidade",
      neighborhood: row.bairro || "Sem bairro",
      owner: row.proprietario || "Sem proprietário",
      type: row.tipo || "Outros",
      segment: row.padrao || "Médio Padrão",
      broker:
        row.corretor_nome ||
        profileByUser.get(row.corretor_id)?.full_name ||
        profileByUser.get(row.user_id)?.full_name ||
        profileByUser.get(row.corretor_id)?.email ||
        profileByUser.get(row.user_id)?.email ||
        "Sem corretor",
      price: Number(row.preco) || 0,
      date: safeDate(row.data_venda, row.updated_at, row.created_at),
      empreendimento: row.empreendimento || row.empreendimentos?.nome || "",
      edificio: row.edificios?.nome || "",
      condominio: row.condominios?.nome || "",
      bedrooms: row.quartos || 0,
      seaView: row.vista_mar || false,
      isManual: false,
      commission: row.comissao ? (Number(row.preco) || 0) * (Number(row.comissao) || 0) / 100 : 0,
      platform: row.plataforma_venda || "",
    }));

    // Evita contar a mesma venda duas vezes (imóvel vendido + agenciamento vendido equivalente)
    const realKeys = new Set(real.map((r) => saleDedupeKey(r.propertyTitle, r.price)));

    const manual: RealSaleRecord[] = (mvRes.data || [])
      .filter((row: any) => !realKeys.has(saleDedupeKey(row.imovel || "", Number(row.valor) || 0)))
      .map((row: any) => ({
      id: row.id,
      propertyTitle: row.imovel || "Agenciamento",
      city: row.cidade || "Sem cidade",
      neighborhood: row.bairro || "Sem bairro",
      owner: row.proprietario || "—",
      type: row.tipo || "Outros",
      segment: row.padrao || "Médio Padrão",
      broker: "—",
      price: Number(row.valor) || 0,
      date: safeDate(row.data_atualizacao, row.data_inclusao, row.updated_at, row.created_at),
      empreendimento: row.imovel || "",
      edificio: row.imovel || "",
      condominio: "",
      bedrooms: parseInt(String(row.dormitorios || "0"), 10) || 0,
      seaView: false,
      isManual: true,
      commission: 0,
      client: "",
    }));

    setSales(real);
    setManualSales(manual);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    return onSalesChanged(() => fetchAll());
  }, [fetchAll]);

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

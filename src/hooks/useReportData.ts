import { useState, useEffect, useMemo } from "react";
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
}

export function useReportData() {
  const [sales, setSales] = useState<RealSaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      // Busca ampla: qualquer variação de "vendido"
      const { data } = await supabase
        .from("imoveis")
        .select("id, titulo, cidade, bairro, tipo, padrao, preco, corretor_nome, proprietario, empreendimento, quartos, vista_mar, updated_at, status, edificio_id, condominio_id, edificios:edificio_id(nome), condominios:condominio_id(nome)")
        .ilike("status", "%vendid%")
        .order("updated_at", { ascending: false })
        .limit(5000);

      if (data) {
        const mapped: RealSaleRecord[] = data.map((row: any) => ({
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
        }));
        setSales(mapped);
      }
      setLoading(false);
    };
    fetchSales();
  }, []);

  // Derive monthly chart data from real sales
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return months.map((month, i) => {
      const monthSales = sales.filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === i;
      });
      return {
        month,
        vendas: monthSales.length,
        receita: monthSales.reduce((sum, s) => sum + s.price, 0),
      };
    });
  }, [sales]);

  const allCities = useMemo(() => [...new Set(sales.map((s) => s.city).filter(Boolean))].sort(), [sales]);
  const allTypes = useMemo(() => [...new Set(sales.map((s) => s.type).filter(Boolean))].sort(), [sales]);
  const allSegments = useMemo(() => [...new Set(sales.map((s) => s.segment).filter(Boolean))].sort(), [sales]);
  const allYears = useMemo(() => [...new Set(sales.map((s) => new Date(s.date).getFullYear()))].sort((a, b) => b - a), [sales]);

  return { sales, monthlyData, allCities, allTypes, allSegments, allYears, loading };
}

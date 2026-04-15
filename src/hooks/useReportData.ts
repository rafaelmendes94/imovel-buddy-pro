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
  bedrooms: number;
  seaView: boolean;
}

export function useReportData() {
  const [sales, setSales] = useState<RealSaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, titulo, cidade, bairro, tipo, padrao, preco, corretor_nome, proprietario, empreendimento, quartos, vista_mar, updated_at")
        .eq("status", "Vendido")
        .order("updated_at", { ascending: false });

      if (data) {
        const mapped: RealSaleRecord[] = data.map((row) => ({
          id: row.id,
          propertyTitle: row.titulo || "",
          city: row.cidade || "",
          neighborhood: row.bairro || "",
          owner: row.proprietario || "",
          type: row.tipo || "Apartamento",
          segment: row.padrao || "Médio Padrão",
          broker: row.corretor_nome || "Sem corretor",
          price: Number(row.preco) || 0,
          date: row.updated_at || "",
          empreendimento: row.empreendimento || "",
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

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Heart, MousePointerClick, MessageCircle, Trophy } from "lucide-react";

const db = supabase as any;

interface Engagement {
  visualizacoes: number;
  favoritos: number;
  aberturas: number;
  contatos_whatsapp: number;
}

interface TopImovel {
  imovel_id: string;
  titulo: string;
  contatos: number;
  favoritos: number;
  visualizacoes: number;
}

interface TopCorretor {
  corretor_id: string;
  nome: string;
  contatos: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="elevated-card rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
}

export function EngagementPanel() {
  const { user, isSuperAdmin, isAdminStaff } = useAuth();
  const [stats, setStats] = useState<Engagement | null>(null);
  const [topImoveis, setTopImoveis] = useState<TopImovel[]>([]);
  const [topCorretores, setTopCorretores] = useState<TopCorretor[]>([]);
  const isAdmin = isSuperAdmin || isAdminStaff;

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await db.rpc("get_my_property_engagement");
      const row = Array.isArray(data) ? data[0] : data;
      if (alive && row) {
        setStats({
          visualizacoes: Number(row.visualizacoes || 0),
          favoritos: Number(row.favoritos || 0),
          aberturas: Number(row.aberturas || 0),
          contatos_whatsapp: Number(row.contatos_whatsapp || 0),
        });
      }
      if (isAdmin) {
        const [imoveisRes, corretoresRes] = await Promise.all([
          db.rpc("get_top_whatsapp_imoveis", { _limit: 5 }),
          db.rpc("get_top_whatsapp_corretores", { _limit: 5 }),
        ]);
        if (!alive) return;
        setTopImoveis((imoveisRes.data || []).map((r: any) => ({
          imovel_id: r.imovel_id,
          titulo: r.titulo,
          contatos: Number(r.contatos || 0),
          favoritos: Number(r.favoritos || 0),
          visualizacoes: Number(r.visualizacoes || 0),
        })));
        setTopCorretores((corretoresRes.data || []).map((r: any) => ({
          corretor_id: r.corretor_id,
          nome: r.nome,
          contatos: Number(r.contatos || 0),
        })));
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, isAdmin]);

  if (!stats) return null;

  const taxaFavWpp = stats.favoritos > 0 ? (stats.contatos_whatsapp / stats.favoritos) * 100 : 0;
  const taxaViewWpp = stats.visualizacoes > 0 ? (stats.contatos_whatsapp / stats.visualizacoes) * 100 : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-foreground">Engajamento dos meus imóveis</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Visualizações" value={stats.visualizacoes} icon={Eye} tone="bg-primary/10 text-primary" />
        <StatCard label="Favoritos" value={stats.favoritos} icon={Heart} tone="bg-rose-500/10 text-rose-500" />
        <StatCard label="Aberturas" value={stats.aberturas} icon={MousePointerClick} tone="bg-amber-500/10 text-amber-500" />
        <StatCard label="Contatos WhatsApp" value={stats.contatos_whatsapp} icon={MessageCircle} tone="bg-emerald-500/10 text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="elevated-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Favorito → WhatsApp</p>
          <p className="text-lg font-bold text-foreground">{taxaFavWpp.toFixed(1)}%</p>
        </div>
        <div className="elevated-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Visualização → WhatsApp</p>
          <p className="text-lg font-bold text-foreground">{taxaViewWpp.toFixed(1)}%</p>
        </div>
      </div>

      {isAdmin && (topImoveis.length > 0 || topCorretores.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="elevated-card rounded-xl p-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" /> Imóveis que mais geram contatos
            </h3>
            <ul className="space-y-2">
              {topImoveis.map((i, idx) => (
                <li key={i.imovel_id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {i.titulo}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {i.contatos} contatos · {i.visualizacoes} views
                  </span>
                </li>
              ))}
              {topImoveis.length === 0 && <li className="text-xs text-muted-foreground">Sem dados ainda.</li>}
            </ul>
          </div>
          <div className="elevated-card rounded-xl p-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-emerald-500" /> Corretores que mais recebem contatos
            </h3>
            <ul className="space-y-2">
              {topCorretores.map((c, idx) => (
                <li key={c.corretor_id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {c.nome}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{c.contatos} contatos</span>
                </li>
              ))}
              {topCorretores.length === 0 && <li className="text-xs text-muted-foreground">Sem dados ainda.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

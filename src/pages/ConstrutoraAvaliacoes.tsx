import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { SmartLayout } from "@/components/SmartLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star, ThumbsUp, Send, Handshake, Clock, Car, DollarSign, Trophy,
  Headphones, TrendingUp, TrendingDown, Award, Shield, ArrowLeft,
  Sparkles, Filter, MessageSquare, BarChart3, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Cell,
} from "recharts";

const CATEGORIES = [
  { key: "reputacao", label: "Reputação de Bom Negócio", icon: Handshake, emoji: "🤝" },
  { key: "cumprimento_prazos", label: "Cumprimento de Prazos", icon: Clock, emoji: "⏰" },
  { key: "facilidade_aquisicao", label: "Facilidade de Aquisição", icon: Car, emoji: "🚗" },
  { key: "condicoes_propostas", label: "Condições de Propostas", icon: DollarSign, emoji: "💰" },
  { key: "qualidade_construcao", label: "Qualidade da Construção", icon: Trophy, emoji: "🏆" },
  { key: "suporte_corretor", label: "Suporte ao Corretor", icon: Headphones, emoji: "💬" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

const STAR_LABELS = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente!"];

interface Avaliacao {
  id: string;
  construtora_id: string;
  user_id: string;
  reputacao: number;
  cumprimento_prazos: number;
  facilidade_aquisicao: number;
  condicoes_propostas: number;
  qualidade_construcao: number;
  suporte_corretor: number;
  comentario: string;
  util_count: number;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface Construtora {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  cor_texto: string;
  avaliacao: number;
  total_avaliacoes: number;
}

// ─── Star Rating Component ───
function StarRating({
  value, onChange, size = 24, readonly = false,
}: {
  value: number; onChange?: (v: number) => void; size?: number; readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Tooltip key={s}>
          <TooltipTrigger asChild>
            <motion.button
              type="button"
              disabled={readonly}
              whileHover={readonly ? {} : { scale: 1.2 }}
              whileTap={readonly ? {} : { scale: 0.9 }}
              className={cn("transition-colors", readonly ? "cursor-default" : "cursor-pointer")}
              onMouseEnter={() => !readonly && setHover(s)}
              onMouseLeave={() => !readonly && setHover(0)}
              onClick={() => onChange?.(s)}
            >
              <Star
                size={size}
                className={cn(
                  "transition-all duration-200",
                  (hover || value) >= s
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                    : "text-muted-foreground/30"
                )}
              />
            </motion.button>
          </TooltipTrigger>
          {!readonly && <TooltipContent>{STAR_LABELS[s]}</TooltipContent>}
        </Tooltip>
      ))}
      {!readonly && hover > 0 && (
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-2 text-xs font-medium text-amber-500"
        >
          {STAR_LABELS[hover]}
        </motion.span>
      )}
    </div>
  );
}

// ─── Score Arc Component ───
function ScoreArc({ score, size = 120 }: { score: number; size?: number }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "hsl(var(--success, 142 76% 36%))" : score >= 3 ? "hsl(var(--warning, 38 92% 50%))" : "hsl(var(--destructive))";
  const r = (size - 16) / 2;
  const circ = Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 1.5 }}>
      <svg width={size} height={size / 1.5} viewBox={`0 0 ${size} ${size / 1.5}`}>
        <path
          d={`M 8 ${size / 1.5 - 4} A ${r} ${r} 0 0 1 ${size - 8} ${size / 1.5 - 4}`}
          fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round"
        />
        <motion.path
          d={`M 8 ${size / 1.5 - 4} A ${r} ${r} 0 0 1 ${size - 8} ${size / 1.5 - 4}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <motion.span
        className="absolute bottom-0 text-2xl font-bold"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        {score.toFixed(1)}
      </motion.span>
    </div>
  );
}

// ─── Confetti Burst ───
function ConfettiBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            backgroundColor: ["#F97316", "#2563EB", "#22C55E", "#EAB308", "#EC4899"][i % 5],
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─── Time Ago ───
function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "agora mesmo";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)}h`;
  if (s < 2592000) return `há ${Math.floor(s / 86400)}d`;
  return `há ${Math.floor(s / 2592000)} meses`;
}

// ─── Main Page ───
export default function ConstrutoraAvaliacoes() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [construtora, setConstrutora] = useState<Construtora | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ratings, setRatings] = useState<Record<CategoryKey, number>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, 0])) as Record<CategoryKey, number>
  );
  const [comentario, setComentario] = useState("");
  const [filter, setFilter] = useState<"recentes" | "uteis">("recentes");
  const [myUtils, setMyUtils] = useState<Set<string>>(new Set());
  const [canRate, setCanRate] = useState(true);

  // ─── Load data ───
  useEffect(() => {
    if (!id) return;
    loadData();
    // Realtime subscription
    const channel = supabase
      .channel("avaliacoes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "construtora_avaliacoes", filter: `construtora_id=eq.${id}` }, () => {
        loadAvaliacoes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadConstrutora(), loadAvaliacoes(), loadMyUtils(), checkCanRate()]);
    setLoading(false);
  }

  async function loadConstrutora() {
    const { data } = await supabase.from("construtoras").select("id, nome, slug, logo_url, cor_primaria, cor_secundaria, cor_texto, avaliacao, total_avaliacoes").eq("id", id!).single();
    if (data) setConstrutora(data);
  }

  async function loadAvaliacoes() {
    const { data } = await supabase
      .from("construtora_avaliacoes")
      .select("*")
      .eq("construtora_id", id!)
      .order("created_at", { ascending: false });
    if (!data) return;

    // Load profiles for each avaliacao
    const userIds = [...new Set(data.map((a) => a.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    setAvaliacoes(
      data.map((a) => ({
        ...a,
        profile: profileMap.get(a.user_id) || { full_name: "Corretor", avatar_url: null },
      }))
    );
  }

  async function loadMyUtils() {
    if (!user) return;
    const { data } = await supabase.from("avaliacao_utils").select("avaliacao_id").eq("user_id", user.id);
    if (data) setMyUtils(new Set(data.map((u) => u.avaliacao_id)));
  }

  async function checkCanRate() {
    if (!user || !id) return;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const { data } = await supabase
      .from("construtora_avaliacoes")
      .select("id")
      .eq("construtora_id", id)
      .eq("user_id", user.id)
      .gte("created_at", oneMonthAgo.toISOString())
      .limit(1);
    setCanRate(!data || data.length === 0);
  }

  // ─── Submit rating ───
  async function handleSubmit() {
    if (!user || !id || !canRate) return;
    const allRated = CATEGORIES.every((c) => ratings[c.key] > 0);
    if (!allRated) {
      toast.error("Avalie todas as categorias antes de enviar.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("construtora_avaliacoes").insert({
        construtora_id: id,
        user_id: user.id,
        ...ratings,
        comentario: comentario.trim(),
      });
      if (error) throw error;

      // Update construtora average
      const avg = CATEGORIES.reduce((sum, c) => sum + ratings[c.key], 0) / CATEGORIES.length;
      const newTotal = (construtora?.total_avaliacoes || 0) + 1;
      const newAvg = ((construtora?.avaliacao || 0) * (newTotal - 1) + avg) / newTotal;
      await supabase.from("construtoras").update({ avaliacao: parseFloat(newAvg.toFixed(2)), total_avaliacoes: newTotal }).eq("id", id);

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
      toast.success("Avaliação enviada com sucesso! 🎉");
      setRatings(Object.fromEntries(CATEGORIES.map((c) => [c.key, 0])) as Record<CategoryKey, number>);
      setComentario("");
      setCanRate(false);
      loadAvaliacoes();
      loadConstrutora();
    } catch {
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Toggle útil ───
  async function toggleUtil(avaliacaoId: string) {
    if (!user) return;
    const isUtil = myUtils.has(avaliacaoId);
    if (isUtil) {
      await supabase.from("avaliacao_utils").delete().eq("avaliacao_id", avaliacaoId).eq("user_id", user.id);
      await supabase.from("construtora_avaliacoes").update({ util_count: Math.max(0, (avaliacoes.find((a) => a.id === avaliacaoId)?.util_count || 1) - 1) }).eq("id", avaliacaoId);
      setMyUtils((prev) => { const n = new Set(prev); n.delete(avaliacaoId); return n; });
    } else {
      await supabase.from("avaliacao_utils").insert({ avaliacao_id: avaliacaoId, user_id: user.id });
      await supabase.from("construtora_avaliacoes").update({ util_count: (avaliacoes.find((a) => a.id === avaliacaoId)?.util_count || 0) + 1 }).eq("id", avaliacaoId);
      setMyUtils((prev) => new Set(prev).add(avaliacaoId));
    }
    loadAvaliacoes();
  }

  // ─── Stats ───
  const stats = useMemo(() => {
    if (!avaliacoes.length) return null;
    const catAvgs = CATEGORIES.map((c) => {
      const avg = avaliacoes.reduce((s, a) => s + (a[c.key] as number), 0) / avaliacoes.length;
      return { ...c, avg: parseFloat(avg.toFixed(1)) };
    });
    const best = catAvgs.reduce((a, b) => (a.avg >= b.avg ? a : b));
    const worst = catAvgs.reduce((a, b) => (a.avg <= b.avg ? a : b));
    const distrib = [1, 2, 3, 4, 5].map((star) => {
      const count = avaliacoes.filter((a) => {
        const avg = CATEGORIES.reduce((s, c) => s + (a[c.key] as number), 0) / CATEGORIES.length;
        return Math.round(avg) === star;
      }).length;
      return { star: `${star}★`, count, pct: Math.round((count / avaliacoes.length) * 100) };
    });
    return { catAvgs, best, worst, distrib };
  }, [avaliacoes]);

  // ─── Ranking (top evaluators) ───
  const topEvaluators = useMemo(() => {
    const counts = new Map<string, { name: string; avatar: string | null; count: number }>();
    avaliacoes.forEach((a) => {
      const key = a.user_id;
      const prev = counts.get(key);
      if (prev) prev.count++;
      else counts.set(key, { name: a.profile?.full_name || "Corretor", avatar: a.profile?.avatar_url || null, count: 1 });
    });
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  }, [avaliacoes]);

  const sortedAvaliacoes = useMemo(() => {
    const copy = [...avaliacoes];
    if (filter === "uteis") copy.sort((a, b) => b.util_count - a.util_count);
    return copy;
  }, [avaliacoes, filter]);

  if (loading) {
    return (
      <SmartLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </SmartLayout>
    );
  }

  if (!construtora) {
    return <SmartLayout><div className="p-6"><p>Construtora não encontrada.</p></div></SmartLayout>;
  }

  const overallAvg = construtora.avaliacao || 0;

  return (
    <SmartLayout>
      <ConfettiBurst show={showConfetti} />
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <BackButton />
          <div className="flex items-center gap-4 flex-1">
            {construtora.logo_url ? (
              <img src={construtora.logo_url} alt={construtora.nome} className="h-14 w-14 rounded-xl object-cover border-2 border-primary/20" />
            ) : (
              <div className="h-14 w-14 rounded-xl flex items-center justify-center text-xl font-bold text-primary-foreground" style={{ backgroundColor: construtora.cor_primaria }}>
                {construtora.nome[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{construtora.nome}</h1>
              <p className="text-sm text-muted-foreground">Sistema de Avaliação por Corretores</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ScoreArc score={overallAvg} />
            <div className="text-center">
              <motion.p
                className="text-3xl font-bold text-foreground"
                key={construtora.total_avaliacoes}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
              >
                {construtora.total_avaliacoes || 0}
              </motion.p>
              <p className="text-xs text-muted-foreground">avaliações</p>
            </div>
            {overallAvg >= 4 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                  <Shield className="h-3 w-3" /> Verificada
                </Badge>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Voting */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  {canRate ? "Avaliar Construtora" : "Você já avaliou este mês"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {CATEGORIES.map((cat, i) => {
                  const catAvg = stats?.catAvgs.find((c) => c.key === cat.key)?.avg || 0;
                  return (
                    <motion.div
                      key={cat.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors bg-card"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-sm font-medium text-foreground">{cat.label}</span>
                      </div>
                      <StarRating
                        value={ratings[cat.key]}
                        onChange={canRate ? (v) => setRatings((p) => ({ ...p, [cat.key]: v })) : undefined}
                        readonly={!canRate}
                        size={22}
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={(catAvg / 5) * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{catAvg.toFixed(1)}</span>
                      </div>
                    </motion.div>
                  );
                })}

                {canRate && (
                  <>
                    <div className="relative">
                      <Textarea
                        placeholder="Deixe um comentário (opcional)..."
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value.slice(0, 280))}
                        className="resize-none"
                        rows={3}
                      />
                      <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                        {comentario.length}/280
                      </span>
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={handleSubmit}
                      disabled={submitting || !CATEGORIES.every((c) => ratings[c.key] > 0)}
                    >
                      {submitting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Enviar Avaliação
                    </Button>
                  </>
                )}

                {!canRate && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Você poderá avaliar novamente no próximo mês.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Gamification */}
            {topEvaluators.length > 0 && (
              <Card className="mt-4 border-border/50 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" /> Top Avaliadores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topEvaluators.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={ev.avatar || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{ev.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1 truncate">{ev.name}</span>
                      <Badge variant="secondary" className="text-xs">{ev.count} aval.</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Column 2: Statistics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            {stats ? (
              <>
                {/* Radar Chart */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Performance por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={stats.catAvgs.map((c) => ({ subject: c.emoji + " " + c.label.split(" ").slice(0, 2).join(" "), value: c.avg, fullMark: 5 }))}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                        <Radar name="Nota" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Distribution */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Distribuição de Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={stats.distrib} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="star" type="category" tick={{ fontSize: 11 }} width={35} />
                        <RechartsTooltip formatter={(v: number) => [`${v}%`, "Percentual"]} />
                        <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                          {stats.distrib.map((_, i) => (
                            <Cell key={i} fill={["hsl(var(--destructive))", "hsl(var(--warning, 38 92% 50%))", "hsl(var(--warning, 38 92% 50%))", "hsl(var(--primary))", "hsl(var(--success, 142 76% 36%))"][i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Best & Worst */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Ponto Forte</p>
                      <p className="text-sm font-semibold text-foreground">{stats.best.emoji} {stats.best.label.split(" ").slice(0, 2).join(" ")}</p>
                      <p className="text-lg font-bold text-emerald-600">{stats.best.avg}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4 text-center">
                      <TrendingDown className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Pode Melhorar</p>
                      <p className="text-sm font-semibold text-foreground">{stats.worst.emoji} {stats.worst.label.split(" ").slice(0, 2).join(" ")}</p>
                      <p className="text-lg font-bold text-amber-600">{stats.worst.avg}</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma avaliação ainda.</p>
                  <p className="text-xs mt-1">Seja o primeiro a avaliar!</p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Column 3: Feed */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Avaliações ({avaliacoes.length})
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm" variant={filter === "recentes" ? "default" : "ghost"}
                      className="h-7 text-xs" onClick={() => setFilter("recentes")}
                    >
                      Recentes
                    </Button>
                    <Button
                      size="sm" variant={filter === "uteis" ? "default" : "ghost"}
                      className="h-7 text-xs" onClick={() => setFilter("uteis")}
                    >
                      Mais úteis
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {sortedAvaliacoes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma avaliação ainda.</p>
                  )}
                  {sortedAvaliacoes.map((av, i) => {
                    const avgStars = CATEGORIES.reduce((s, c) => s + (av[c.key] as number), 0) / CATEGORIES.length;
                    return (
                      <motion.div
                        key={av.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-3 rounded-xl border border-border/50 hover:border-primary/20 transition-colors bg-card"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={av.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(av.profile?.full_name || "C").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{av.profile?.full_name || "Corretor"}</p>
                              <span className="text-xs text-muted-foreground">{timeAgo(av.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <StarRating value={Math.round(avgStars)} readonly size={14} />
                              <span className="text-xs text-muted-foreground ml-1">{avgStars.toFixed(1)}</span>
                            </div>
                            {/* Category breakdown */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {CATEGORIES.map((c) => (
                                <Tooltip key={c.key}>
                                  <TooltipTrigger>
                                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                                      {c.emoji} {av[c.key] as number}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>{c.label}: {av[c.key] as number}/5</TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                            {av.comentario && (
                              <p className="text-sm text-foreground/80 mt-2">{av.comentario}</p>
                            )}
                            <Button
                              size="sm" variant="ghost"
                              className={cn("h-7 text-xs mt-1 gap-1", myUtils.has(av.id) && "text-primary")}
                              onClick={() => toggleUtil(av.id)}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              Útil {av.util_count > 0 && `(${av.util_count})`}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </SmartLayout>
  );
}

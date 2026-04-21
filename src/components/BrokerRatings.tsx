import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, MessageSquare, Send } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BrokerRating {
  id: string;
  broker_id: string;
  rater_id: string;
  pontualidade: number;
  agilidade: number;
  transparencia: number;
  credibilidade: number;
  negociacao: number;
  comentario: string | null;
  created_at: string;
}

const CRITERIA = [
  { key: "pontualidade", label: "Pontualidade" },
  { key: "agilidade", label: "Agilidade" },
  { key: "transparencia", label: "Transparência" },
  { key: "credibilidade", label: "Credibilidade" },
  { key: "negociacao", label: "Negociação" },
] as const;

type CriteriaKey = (typeof CRITERIA)[number]["key"];

export function BrokerRatings({ brokerId, brokerName }: { brokerId: string | null; brokerName: string }) {
  const { user, role } = useAuth();
  const [ratings, setRatings] = useState<BrokerRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<Record<CriteriaKey, number>>({
    pontualidade: 0, agilidade: 0, transparencia: 0, credibilidade: 0, negociacao: 0,
  });
  const [comentario, setComentario] = useState("");

  const isBroker = role === "broker";
  const canRate = !!user && isBroker && !!brokerId && user.id !== brokerId;
  const myRating = ratings.find((r) => r.rater_id === user?.id);

  useEffect(() => {
    if (!brokerId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("broker_ratings")
        .select("*")
        .eq("broker_id", brokerId);
      setRatings((data as BrokerRating[]) || []);
      setLoading(false);
    })();
  }, [brokerId]);

  useEffect(() => {
    if (myRating) {
      setScores({
        pontualidade: myRating.pontualidade,
        agilidade: myRating.agilidade,
        transparencia: myRating.transparencia,
        credibilidade: myRating.credibilidade,
        negociacao: myRating.negociacao,
      });
      setComentario(myRating.comentario || "");
    }
  }, [myRating]);

  const averages = useMemo(() => {
    if (!ratings.length) return CRITERIA.map((c) => ({ criterio: c.label, valor: 0 }));
    return CRITERIA.map((c) => ({
      criterio: c.label,
      valor: Number((ratings.reduce((s, r) => s + (r[c.key] || 0), 0) / ratings.length).toFixed(2)),
    }));
  }, [ratings]);

  const overall = useMemo(() => {
    if (!averages.length) return 0;
    return Number((averages.reduce((s, a) => s + a.valor, 0) / averages.length).toFixed(2));
  }, [averages]);

  const handleSubmit = async () => {
    if (!user || !brokerId) return;
    if (Object.values(scores).some((v) => v === 0)) {
      toast.error("Avalie todos os 5 critérios");
      return;
    }
    setSubmitting(true);
    const payload = {
      broker_id: brokerId,
      rater_id: user.id,
      ...scores,
      comentario,
    };
    const { error } = await (supabase as any)
      .from("broker_ratings")
      .upsert(payload, { onConflict: "broker_id,rater_id" });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao salvar avaliação");
      return;
    }
    toast.success("Avaliação registrada!");
    const { data } = await (supabase as any).from("broker_ratings").select("*").eq("broker_id", brokerId);
    setRatings((data as BrokerRating[]) || []);
  };

  if (loading) return null;

  return (
    <section className="container py-12">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Avaliação dos colegas</p>
        <h2 className="text-3xl font-black text-foreground">Reputação profissional</h2>
        <p className="text-muted-foreground">{ratings.length} avaliação{ratings.length === 1 ? "" : "ões"} · Nota geral <span className="font-bold text-foreground">{overall.toFixed(1)}/5</span></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        {/* Radar */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Desempenho por critério</h3>
            <div className="flex items-center gap-1 text-2xl font-black text-accent">
              <Star className="h-6 w-6 fill-accent" /> {overall.toFixed(1)}
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer>
              <RadarChart data={averages} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="criterio" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Radar name="Média" dataKey="valor" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.4} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {averages.map((a) => (
              <div key={a.criterio} className="rounded-xl bg-muted px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{a.criterio}</p>
                <p className="text-lg font-black text-foreground">{a.valor.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-1 text-lg font-bold text-foreground">{myRating ? "Atualizar minha avaliação" : "Avalie este corretor"}</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {canRate
              ? `Como colega, dê sua nota para ${brokerName}.`
              : !user
                ? "Faça login como corretor para avaliar."
                : !isBroker
                  ? "Apenas corretores podem avaliar."
                  : "Você não pode avaliar a si mesmo."}
          </p>

          <fieldset disabled={!canRate || submitting} className="space-y-3 disabled:opacity-60">
            {CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">{c.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScores((s) => ({ ...s, [c.key]: n }))}
                      className={cn(
                        "transition-transform hover:scale-110",
                        scores[c.key] >= n ? "text-accent" : "text-muted-foreground/40",
                      )}
                      aria-label={`${n} estrelas`}
                    >
                      <Star className={cn("h-5 w-5", scores[c.key] >= n && "fill-accent")} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-2">
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> Comentário (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                maxLength={400}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="Conte uma experiência profissional..."
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canRate || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {submitting ? "Salvando..." : myRating ? "Atualizar avaliação" : "Enviar avaliação"}
            </button>
          </fieldset>
        </div>
      </div>

      {ratings.filter((r) => r.comentario && r.comentario.trim()).length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ratings.filter((r) => r.comentario && r.comentario.trim()).slice(0, 6).map((r) => {
            const media = ((r.pontualidade + r.agilidade + r.transparencia + r.credibilidade + r.negociacao) / 5).toFixed(1);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="mb-2 flex items-center gap-1 text-accent">
                  <Star className="h-4 w-4 fill-accent" />
                  <span className="text-sm font-bold">{media}</span>
                </div>
                <p className="text-sm text-muted-foreground italic">"{r.comentario}"</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

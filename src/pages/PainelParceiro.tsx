import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Handshake, ExternalLink, LogOut, Star, MessageSquare, Crown, Loader2, Save,
} from "lucide-react";

const CATEGORIES = [
  "Construtoras", "Imobiliárias", "Engenharia", "Financeiro",
  "Seguros", "Arquitetura", "Energia", "Reformas", "Jurídico", "Serviços", "Outros",
];

interface Partner {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  cover_url: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  category: string;
  since_year: string;
  rating: number;
  total_ratings: number;
  status: string;
  featured: boolean;
}

interface Rating {
  id: string;
  rater_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function PainelParceiro() {
  const { user, signOut, subscription } = useAuth();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: rs }] = await Promise.all([
      supabase.from("partners").select("*").eq("user_id", user.id).maybeSingle(),
      (async () => {
        const { data: own } = await supabase.from("partners").select("id").eq("user_id", user.id).maybeSingle();
        if (!own) return { data: [] };
        return supabase
          .from("partner_ratings")
          .select("*")
          .eq("partner_id", (own as any).id)
          .order("created_at", { ascending: false });
      })(),
    ]);
    setPartner((p as any) || null);
    setRatings((rs as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!partner) return;
    setSaving(true);
    const { id, rating, total_ratings, featured, status, ...payload } = partner;
    const { error } = await supabase.from("partners").update(payload).eq("id", id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Dados salvos");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-muted-foreground">Seu perfil de parceiro ainda não foi criado.</p>
            <p className="text-xs text-muted-foreground">Entre em contato com o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : "—";

  const planName = subscription?.plan?.name || "Sem plano";
  const isFeaturedPlan = subscription?.plan?.modules?.includes("destaque");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Handshake className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Painel do Parceiro</h1>
              <p className="text-xs text-muted-foreground">{partner.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/parceiro/${partner.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Ver página pública
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/login"); }} className="gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avaliação média</p>
            <p className="text-2xl font-bold flex items-center gap-1.5"><Star className="w-5 h-5 text-amber-500 fill-amber-500" />{avgRating}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Comentários</p>
            <p className="text-2xl font-bold flex items-center gap-1.5"><MessageSquare className="w-5 h-5 text-primary" />{ratings.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Plano</p>
            <p className="text-sm font-bold">{planName}</p>
            <p className="text-xs text-muted-foreground">{subscription?.status || "—"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Destaque na home</p>
            <Badge className={isFeaturedPlan && partner.featured ? "bg-accent" : "bg-muted text-muted-foreground"}>
              {isFeaturedPlan && partner.featured ? <><Crown className="w-3 h-3 mr-1" />Ativo</> : "Inativo"}
            </Badge>
            {!isFeaturedPlan && (
              <Link to="/escolher-plano" className="text-xs text-primary underline block mt-1">Upgrade</Link>
            )}
          </CardContent></Card>
        </div>

        {/* Edição */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do parceiro</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nome *</Label>
              <Input value={partner.name} onChange={e => setPartner({ ...partner, name: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={partner.category} onValueChange={v => setPartner({ ...partner, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Desde (ano)</Label>
              <Input value={partner.since_year || ""} onChange={e => setPartner({ ...partner, since_year: e.target.value })} placeholder="2010" />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea rows={3} value={partner.description || ""} onChange={e => setPartner({ ...partner, description: e.target.value })} />
            </div>
            <div><Label>Logo (URL)</Label><Input value={partner.logo_url || ""} onChange={e => setPartner({ ...partner, logo_url: e.target.value })} /></div>
            <div><Label>Capa (URL)</Label><Input value={partner.cover_url || ""} onChange={e => setPartner({ ...partner, cover_url: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={partner.city || ""} onChange={e => setPartner({ ...partner, city: e.target.value })} /></div>
            <div><Label>Endereço</Label><Input value={partner.address || ""} onChange={e => setPartner({ ...partner, address: e.target.value })} /></div>
            <div><Label>Telefone / WhatsApp</Label><Input value={partner.phone || ""} onChange={e => setPartner({ ...partner, phone: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input value={partner.email || ""} onChange={e => setPartner({ ...partner, email: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Website</Label><Input value={partner.website || ""} onChange={e => setPartner({ ...partner, website: e.target.value })} placeholder="meusite.com" /></div>
          </CardContent>
          <div className="px-6 pb-6">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar alterações
            </Button>
          </div>
        </Card>

        {/* Avaliações */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" />Últimas avaliações</CardTitle></CardHeader>
          <CardContent>
            {ratings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma avaliação ainda.</p>
            ) : (
              <div className="space-y-3">
                {ratings.map(r => (
                  <div key={r.id} className="border border-border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{r.rater_name || "Anônimo"}</p>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />)}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

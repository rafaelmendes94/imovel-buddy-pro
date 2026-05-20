import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Plus, Mail, Phone, Award, Search, ExternalLink, Building2, Palette, UserPlus, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface BrokerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creci: string | null;
  status: string;
  subscriber_id: string;
  imoveis_count: number;
  vgv: number;
  rating: number;
  ratings_count: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const toSlug = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface ProfileRow {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  account_type: string;
  agency_id: string | null;
  created_at: string;
  plan_name?: string;
  sub_status?: string;
}

export default function Brokers() {
  const { user, profile, subscription, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const isAgency = profile?.account_type === "imobiliaria";

  const [search, setSearch] = useState("");
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [appearanceFor, setAppearanceFor] = useState<{ slug: string; name: string } | null>(null);

  const [agencyBrokers, setAgencyBrokers] = useState<any[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const maxAgencyBrokers = subscription?.plan?.max_brokers ?? 0;

  // Super admin: all accounts + plan registration
  const [allUsers, setAllUsers] = useState<ProfileRow[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", account_type: "corretor", plan_id: "" });

  const fetchAgencyBrokers = async () => {
    if (!user || !isAgency) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone, avatar_url")
      .eq("agency_id", user.id);
    setAgencyBrokers(data || []);
  };

  const fetchAllUsers = async () => {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone, account_type, agency_id, created_at")
      .order("created_at", { ascending: false });
    if (!profs) return;
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, status, plan_id, plans(name)");
    const subMap = new Map<string, any>();
    (subs || []).forEach((s: any) => { subMap.set(s.user_id, s); });
    setAllUsers(profs.map((p: any) => ({
      ...p,
      plan_name: subMap.get(p.user_id)?.plans?.name,
      sub_status: subMap.get(p.user_id)?.status,
    })));
  };

  useEffect(() => {
    const fetchBrokers = async () => {
      const { data: brokersData } = await supabase
        .from("subscriber_brokers")
        .select("*")
        .order("name");

      if (!brokersData) { setLoading(false); return; }

      const [{ data: imoveis }, { data: profs }, { data: ratings }] = await Promise.all([
        supabase.from("imoveis").select("corretor_nome, preco, status"),
        (supabase as any).from("public_broker_profiles").select("user_id, full_name"),
        (supabase as any).from("broker_ratings").select("broker_id, pontualidade, agilidade, conhecimento_mercado, atendimento, negociacao"),
      ]);

      const brokerStats: Record<string, { count: number; vgv: number }> = {};
      (imoveis || []).forEach(i => {
        const name = i.corretor_nome || "";
        if (!brokerStats[name]) brokerStats[name] = { count: 0, vgv: 0 };
        brokerStats[name].count++;
        if (i.status === "Vendido") brokerStats[name].vgv += Number(i.preco || 0);
      });

      // Map slug(full_name) -> user_id
      const slugToUserId: Record<string, string> = {};
      ((profs as any[]) || []).forEach((p) => {
        if (p.full_name) slugToUserId[toSlug(p.full_name)] = p.user_id;
      });

      // Aggregate ratings by broker_id
      const ratingAgg: Record<string, { sum: number; n: number }> = {};
      ((ratings as any[]) || []).forEach((r) => {
        const avg = (r.pontualidade + r.agilidade + r.conhecimento_mercado + r.atendimento + r.negociacao) / 5;
        if (!ratingAgg[r.broker_id]) ratingAgg[r.broker_id] = { sum: 0, n: 0 };
        ratingAgg[r.broker_id].sum += avg;
        ratingAgg[r.broker_id].n += 1;
      });

      setBrokers(brokersData.map((b: any) => {
        const uid = slugToUserId[toSlug(b.name)];
        const agg = uid ? ratingAgg[uid] : undefined;
        return {
          ...b,
          imoveis_count: brokerStats[b.name]?.count || 0,
          vgv: brokerStats[b.name]?.vgv || 0,
          rating: agg && agg.n > 0 ? agg.sum / agg.n : 0,
          ratings_count: agg?.n || 0,
        };
      }));
      setLoading(false);
    };
    fetchBrokers();
    fetchAgencyBrokers();
    if (isSuperAdmin) {
      fetchAllUsers();
      supabase.from("plans").select("id, name, price, plan_type").eq("is_active", true).order("price")
        .then(({ data }) => setPlans(data || []));
    }
  }, [user?.id, isAgency, isSuperAdmin]);

  const handleCreateBroker = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast({ title: "Preencha nome, email e senha", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-create-broker", { body: form });
    setCreating(false);
    if (error || (data as any)?.error) {
      toast({ title: "Erro ao cadastrar", description: error?.message || (data as any)?.error, variant: "destructive" });
      return;
    }
    if ((data as any)?.warning) {
      toast({ title: "Conta criada com aviso", description: (data as any).warning });
    } else {
      toast({ title: "Corretor cadastrado e plano vinculado!" });
    }
    setCreateOpen(false);
    setForm({ full_name: "", email: "", password: "", phone: "", account_type: "corretor", plan_id: "" });
    fetchAllUsers();
  };

  const handleInvite = async () => {
    if (!user || !inviteEmail) return;
    setInviting(true);
    const { error } = await supabase.rpc("link_broker_to_agency", {
      _broker_email: inviteEmail.trim(),
      _agency_user_id: user.id,
    });
    setInviting(false);
    if (error) {
      toast({ title: "Não foi possível vincular", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Corretor vinculado!" });
    setInviteEmail("");
    setInviteOpen(false);
    fetchAgencyBrokers();
  };

  const handleRemoveAgencyBroker = async (broker_user_id: string) => {
    if (!confirm("Remover este corretor do quadro da imobiliária?")) return;
    const { error } = await supabase
      .from("profiles")
      .update({ agency_id: null })
      .eq("user_id", broker_user_id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Corretor removido do quadro" });
    fetchAgencyBrokers();
  };

  const filtered = brokers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />

        {isAgency && (
          <div className="elevated-card rounded-xl p-5 space-y-4 border-2 border-accent/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">
                  Meus corretores ({agencyBrokers.length} de {maxAgencyBrokers})
                </h2>
              </div>
              <Button size="sm" onClick={() => setInviteOpen(true)} disabled={agencyBrokers.length >= maxAgencyBrokers}>
                <UserPlus className="w-4 h-4 mr-1" /> Convidar corretor
              </Button>
            </div>
            {agencyBrokers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum corretor vinculado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {agencyBrokers.map(b => (
                  <div key={b.user_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{b.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveAgencyBroker(b.user_id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remover do quadro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Corretores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {brokers.length} corretores cadastrados
            </p>
          </div>
          <button
            onClick={() => isSuperAdmin && setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start"
          >
            <Plus className="w-4 h-4" />
            Novo Corretor
          </button>
        </div>

        {isSuperAdmin && (
          <div className="elevated-card rounded-xl p-5 space-y-4 border-2 border-primary/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  Todas as contas ({allUsers.length})
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 px-2">Nome</th>
                    <th className="py-2 px-2">Email</th>
                    <th className="py-2 px-2">Telefone</th>
                    <th className="py-2 px-2">Tipo</th>
                    <th className="py-2 px-2">Plano</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers
                    .filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
                    .map(u => (
                      <tr key={u.user_id} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-2 px-2 font-medium text-foreground">{u.full_name || "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground">{u.email || "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground">{u.phone || "—"}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-[10px]">{u.account_type}</Badge>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{u.plan_name || "—"}</td>
                        <td className="py-2 px-2">
                          {u.sub_status ? (
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded",
                              u.sub_status === "active" ? "bg-success/10 text-success" :
                              u.sub_status === "trial" ? "bg-accent/10 text-accent" :
                              "bg-destructive/10 text-destructive"
                            )}>{u.sub_status}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar corretor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {filtered.map((broker) => (
              <div key={broker.id} className="elevated-card rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-sm font-bold text-primary">
                    {broker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground text-sm truncate">
                      {broker.name}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded",
                        broker.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {broker.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  {broker.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{broker.email}</span>
                    </div>
                  )}
                  {broker.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{broker.phone}</span>
                    </div>
                  )}
                  {broker.creci && (
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" />
                      <span>CRECI: {broker.creci}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Imóveis</p>
                    <p className="text-lg font-bold text-card-foreground">{broker.imoveis_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGV Vendido</p>
                    <p className="text-sm font-bold text-accent">{formatCurrency(broker.vgv)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAppearanceFor({ slug: toSlug(broker.name), name: broker.name })}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Aparência
                  </button>
                  <Link
                    to={`/corretor/${toSlug(broker.name)}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Página
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {appearanceFor && (
        <SiteConfigDialog
          open={!!appearanceFor}
          onOpenChange={(open) => !open && setAppearanceFor(null)}
          configType="broker_page"
          ownerId={appearanceFor.slug}
          showProfilePhoto
          title={`Aparência da página de ${appearanceFor.name}`}
        />
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Vincular corretor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe o e-mail do corretor (ele já precisa ter uma conta).
            </p>
            <Input
              type="email"
              placeholder="email@corretor.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="w-full">
              {inviting ? "Vinculando..." : "Vincular"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cadastrar novo corretor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome completo" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input type="password" placeholder="Senha (mín. 6 caracteres)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <Input placeholder="Telefone (opcional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <select
              value={form.account_type}
              onChange={e => setForm({ ...form, account_type: e.target.value })}
              className="w-full px-3 py-2 bg-card border border-input rounded-md text-sm"
            >
              <option value="corretor">Corretor</option>
              <option value="imobiliaria">Imobiliária</option>
            </select>
            <select
              value={form.plan_id}
              onChange={e => setForm({ ...form, plan_id: e.target.value })}
              className="w-full px-3 py-2 bg-card border border-input rounded-md text-sm"
            >
              <option value="">Sem plano</option>
              {plans
                .filter(p => !form.account_type || p.plan_type === form.account_type || p.plan_type === "ambos")
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}</option>
                ))}
            </select>
            <Button onClick={handleCreateBroker} disabled={creating} className="w-full">
              {creating ? "Cadastrando..." : "Cadastrar e vincular plano"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

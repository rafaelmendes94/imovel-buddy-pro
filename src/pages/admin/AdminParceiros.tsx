import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MediaGalleryUpload } from "@/components/MediaGalleryUpload";
import { AdminPartnerMaterialsQueue } from "@/components/partner/AdminPartnerMaterialsQueue";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Handshake, Pencil, Plus, Search, Trash2, XCircle } from "lucide-react";

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
  projects: number;
  status: string;
  sort_order: number;
  featured: boolean;
  user_id?: string | null;
}

interface PartnerAccountMeta {
  approvalStatus: string;
  rejectionReason: string | null;
  subscriptionStatus: string | null;
  planName: string | null;
}

const CATEGORIES = [
  "Construtoras", "Imobiliárias", "Engenharia", "Financeiro",
  "Seguros", "Arquitetura", "Energia", "Reformas", "Jurídico", "Serviços", "Outros"
];

const emptyPartner: Omit<Partner, "id"> = {
  name: "", slug: "", logo_url: "", cover_url: "", description: "",
  address: "", city: "", phone: "", email: "", website: "",
  category: "Outros", since_year: "", rating: 0, total_ratings: 0,
  projects: 0, status: "active", sort_order: 0, featured: false,
};

export default function AdminParceiros() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyPartner);
  const [accountByPartner, setAccountByPartner] = useState<Record<string, PartnerAccountMeta>>({});
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error(`Erro ao carregar parceiros: ${error.message}`);
      setLoading(false);
      return;
    }
    const rows = ((data as any[]) || []) as Partner[];
    setPartners(rows);

    const linkedRows = rows.filter((partner) => partner.user_id);
    if (linkedRows.length > 0) {
      const userIds = linkedRows.map((partner) => partner.user_id as string);
      const [{ data: profiles }, { data: subscriptions }, { data: plans }] = await Promise.all([
        supabase.from("profiles").select("user_id, approval_status, rejection_reason").in("user_id", userIds),
        supabase.from("subscriptions").select("user_id, status, plan_id, created_at").in("user_id", userIds).order("created_at", { ascending: false }),
        supabase.from("plans").select("id, name"),
      ]);
      const profileByUser = new Map(((profiles as any[]) || []).map((profile) => [profile.user_id, profile]));
      const latestSubscriptionByUser = new Map<string, any>();
      ((subscriptions as any[]) || []).forEach((subscription) => {
        if (!latestSubscriptionByUser.has(subscription.user_id)) latestSubscriptionByUser.set(subscription.user_id, subscription);
      });
      const planById = new Map(((plans as any[]) || []).map((plan) => [plan.id, plan.name]));
      setAccountByPartner(Object.fromEntries(linkedRows.map((partner) => {
        const profile = profileByUser.get(partner.user_id as string);
        const subscription = latestSubscriptionByUser.get(partner.user_id as string);
        return [partner.id, {
          approvalStatus: profile?.approval_status || "pending",
          rejectionReason: profile?.rejection_reason || null,
          subscriptionStatus: subscription?.status || null,
          planName: subscription?.plan_id ? planById.get(subscription.plan_id) || null : null,
        }];
      })));
    } else {
      setAccountByPartner({});
    }
    setLoading(false);
  };

  useEffect(() => { fetchPartners(); }, []);

  const toSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleOpen = (partner?: Partner) => {
    if (partner) {
      setEditing(partner);
      setForm({ ...partner });
    } else {
      setEditing(null);
      setForm({ ...emptyPartner, sort_order: partners.length + 1 });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const slug = form.slug || toSlug(form.name);
    const payload = { ...form, slug };

    if (editing) {
      const { error } = await supabase.from("partners").update(payload as any).eq("id", editing.id);
      if (error) { toast.error(`Erro ao atualizar: ${error.message}`); return; }
      toast.success("Parceiro atualizado");
    } else {
      const { error } = await supabase.from("partners").insert(payload as any);
      if (error) { toast.error(`Erro ao criar: ${error.message}`); return; }
      toast.success("Parceiro criado");
    }
    setDialogOpen(false);
    fetchPartners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este parceiro?")) return;
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) {
      toast.error(`Erro ao excluir: ${error.message}`);
      return;
    }
    toast.success("Parceiro excluído");
    fetchPartners();
  };

  const setPartnerApproval = async (partner: Partner, approved: boolean) => {
    if (!partner.user_id) return;
    const account = accountByPartner[partner.id];
    if (approved && !["active", "trial"].includes(account?.subscriptionStatus || "")) {
      toast.error("Aguarde a confirmação do pagamento antes de aprovar este parceiro.");
      return;
    }

    setApprovalLoading(partner.id);
    const { error } = await (supabase.rpc as any)("set_partner_approval", {
      _partner_id: partner.id,
      _approved: approved,
      _reason: approved ? null : "Cadastro de parceiro não aprovado pela administração.",
    });
    setApprovalLoading(null);
    if (error) {
      toast.error(error.message || "Não foi possível atualizar a aprovação.");
      return;
    }
    toast.success(approved ? "Parceiro aprovado e publicado." : "Parceiro reprovado e retirado da publicação.");
    await fetchPartners();
  };

  const filtered = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Handshake className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Parceiros</h1>
            <Badge variant="secondary">{partners.length}</Badge>
          </div>
          <Button onClick={() => handleOpen()} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Parceiro
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar parceiro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <AdminPartnerMaterialsQueue />

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Plano / pagamento</TableHead>
                  <TableHead>Aprovação</TableHead>
                  <TableHead>Publicação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Nenhum parceiro encontrado</TableCell></TableRow>
                ) : filtered.map(p => {
                  const account = accountByPartner[p.id];
                  const paid = ["active", "trial"].includes(account?.subscriptionStatus || "");
                  return <TableRow key={p.id}>
                    <TableCell>
                      {p.logo_url ? (
                        <img src={p.logo_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Handshake className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {p.name}
                        {p.featured && <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-[10px]">Destaque</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.city || "—"}</TableCell>
                    <TableCell>
                      {account ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold">{account.planName || "Sem plano"}</p>
                          <Badge variant={paid ? "default" : "secondary"} className="text-[10px]">
                            {paid ? "Pagamento confirmado" : account.subscriptionStatus || "Sem pagamento"}
                          </Badge>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">Cadastro administrativo</span>}
                    </TableCell>
                    <TableCell>
                      {account ? (
                        <Badge
                          variant={account.approvalStatus === "approved" ? "default" : account.approvalStatus === "rejected" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {account.approvalStatus === "approved" ? "Aprovado" : account.approvalStatus === "rejected" ? "Reprovado" : "Aguardando"}
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status === "active" ? "Publicado" : "Oculto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {account && account.approvalStatus !== "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!paid || approvalLoading === p.id}
                            onClick={() => setPartnerApproval(p, true)}
                            title={paid ? "Aprovar e publicar" : "Aguardando pagamento"}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {account && account.approvalStatus !== "rejected" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={approvalLoading === p.id}
                            onClick={() => setPartnerApproval(p, false)}
                            title="Reprovar e ocultar"
                            className="text-amber-600 hover:text-amber-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/parceiro/${p.slug}`, "_blank")}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="md:col-span-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
                <div>
                  <Label className="text-sm font-semibold">Destaque na home</Label>
                  <p className="text-xs text-muted-foreground">Quando ativo, aparece no carrossel da home pública (ordem aleatória).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!form.featured}
                    onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="md:col-span-2">
                <Label>Logo</Label>
                <MediaGalleryUpload
                  label="Enviar logo ou colar URL"
                  values={form.logo_url ? [form.logo_url] : []}
                  onChange={(values) => setForm(f => ({ ...f, logo_url: values[values.length - 1] || "" }))}
                  folder="partners/logos"
                  kind="image"
                  multiple={false}
                  allowUrl
                />
              </div>
              <div className="md:col-span-2">
                <Label>Capa</Label>
                <MediaGalleryUpload
                  label="Enviar capa ou colar URL"
                  values={form.cover_url ? [form.cover_url] : []}
                  onChange={(values) => setForm(f => ({ ...f, cover_url: values[values.length - 1] || "" }))}
                  folder="partners/covers"
                  kind="image"
                  multiple={false}
                  allowUrl
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label>Endereço</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div>
                <Label>Desde (ano)</Label>
                <Input value={form.since_year} onChange={e => setForm(f => ({ ...f, since_year: e.target.value }))} placeholder="2010" />
              </div>
              <div>
                <Label>Projetos</Label>
                <Input type="number" value={form.projects} onChange={e => setForm(f => ({ ...f, projects: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

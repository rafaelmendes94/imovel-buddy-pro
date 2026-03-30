import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/data/mockData";
import {
  Search, Trash2, ShoppingBag, Loader2, Eye, CheckCircle2,
  Package, X, ChevronLeft, ChevronRight, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrickItem {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string;
  preco: number;
  categoria: string;
  estado: string;
  cidade: string;
  telefone: string;
  imagens: string[];
  vendido: boolean;
  created_at: string;
  profile?: { full_name: string; email: string | null };
}

const categorias = ["Eletrônicos", "Móveis", "Veículos", "Roupas", "Esportes", "Ferramentas", "Livros", "Decoração", "Eletrodomésticos", "Outros"];

export default function AdminBrick() {
  const { toast } = useToast();
  const [items, setItems] = useState<BrickItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "sold">("all");
  const [viewItem, setViewItem] = useState<BrickItem | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brick_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles for each unique user_id
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setItems(data.map(item => ({
        ...item,
        descricao: item.descricao || "",
        cidade: item.cidade || "",
        telefone: item.telefone || "",
        imagens: item.imagens || [],
        profile: profileMap.get(item.user_id) as any,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("brick_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item excluído com sucesso" });
      setItems(prev => prev.filter(i => i.id !== id));
      if (viewItem?.id === id) setViewItem(null);
    }
  };

  const handleToggleSold = async (item: BrickItem) => {
    const { error } = await supabase
      .from("brick_items")
      .update({ vendido: !item.vendido })
      .eq("id", item.id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, vendido: !i.vendido } : i));
      toast({ title: item.vendido ? "Marcado como disponível" : "Marcado como vendido" });
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (item.profile?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || item.categoria === filterCat;
    const matchStatus = filterStatus === "all" || (filterStatus === "sold" ? item.vendido : !item.vendido);
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Brick do Corretor</h1>
              <p className="text-sm text-muted-foreground">Gerencie todos os anúncios dos corretores</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {items.length} anúncios no total
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou corretor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Todas categorias</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Todos</option>
              <option value="available">Disponíveis</option>
              <option value="sold">Vendidos</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: items.length, color: "text-primary" },
            { label: "Disponíveis", value: items.filter(i => !i.vendido).length, color: "text-emerald-500" },
            { label: "Vendidos", value: items.filter(i => i.vendido).length, color: "text-amber-500" },
            { label: "Corretores", value: new Set(items.map(i => i.user_id)).size, color: "text-blue-500" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Corretor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preço</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.imagens.length > 0 ? (
                            <img src={item.imagens[0]} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{item.titulo}</p>
                            <p className="text-xs text-muted-foreground">{item.cidade || "Sem cidade"} · {item.estado}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-foreground">{item.profile?.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{item.categoria}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatCurrency(item.preco)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={item.vendido ? "outline" : "default"} className={cn("text-xs", item.vendido && "opacity-60")}>
                          {item.vendido ? "Vendido" : "Disponível"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setViewItem(item); setImgIdx(0); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggleSold(item)}>
                            <CheckCircle2 className={cn("w-4 h-4", item.vendido ? "text-amber-500" : "text-emerald-500")} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={open => !open && setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {viewItem?.titulo}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              {viewItem.imagens.length > 0 && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  <img src={viewItem.imagens[imgIdx]} className="w-full h-full object-cover" />
                  {viewItem.imagens.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => (i - 1 + viewItem.imagens.length) % viewItem.imagens.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setImgIdx(i => (i + 1) % viewItem.imagens.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {imgIdx + 1}/{viewItem.imagens.length}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Corretor:</span> <strong>{viewItem.profile?.full_name || "—"}</strong></div>
                <div><span className="text-muted-foreground">Preço:</span> <strong>{formatCurrency(viewItem.preco)}</strong></div>
                <div><span className="text-muted-foreground">Categoria:</span> <strong>{viewItem.categoria}</strong></div>
                <div><span className="text-muted-foreground">Estado:</span> <strong>{viewItem.estado}</strong></div>
                <div><span className="text-muted-foreground">Cidade:</span> <strong>{viewItem.cidade || "—"}</strong></div>
                <div><span className="text-muted-foreground">Telefone:</span> <strong>{viewItem.telefone || "—"}</strong></div>
              </div>
              {viewItem.descricao && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm text-foreground">{viewItem.descricao}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant={viewItem.vendido ? "outline" : "default"} className="flex-1" onClick={() => { handleToggleSold(viewItem); setViewItem({ ...viewItem, vendido: !viewItem.vendido }); }}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {viewItem.vendido ? "Marcar Disponível" : "Marcar Vendido"}
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(viewItem.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

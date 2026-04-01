import { useState, useEffect } from "react";
import { SmartLayout } from "@/components/SmartLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/data/mockData";
import {
  Plus, Search, Trash2, Edit3, Image, Loader2, ShoppingBag, Tag,
  Package, X, CheckCircle2, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

const categorias = ["Eletrônicos", "Móveis", "Veículos", "Roupas", "Esportes", "Ferramentas", "Livros", "Decoração", "Eletrodomésticos", "Outros"];
const estados = ["Novo", "Semi-novo", "Usado", "Para peças"];

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
}

export default function Brick() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<BrickItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrickItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("Outros");
  const [estado, setEstado] = useState("Usado");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("brick_items" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as any as BrickItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const resetForm = () => {
    setTitulo(""); setDescricao(""); setPreco(""); setCategoria("Outros");
    setEstado("Usado"); setCidade(""); setTelefone("");
    setImageFiles([]); setExistingImages([]); setEditingItem(null);
  };

  const openEdit = (item: BrickItem) => {
    setEditingItem(item);
    setTitulo(item.titulo);
    setDescricao(item.descricao || "");
    setPreco(String(item.preco));
    setCategoria(item.categoria);
    setEstado(item.estado);
    setCidade(item.cidade || "");
    setTelefone(item.telefone || "");
    setExistingImages(item.imagens || []);
    setImageFiles([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !titulo.trim()) {
      toast({ title: "Preencha o título", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const path = `brick/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const allImages = [...existingImages, ...uploadedUrls];
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        preco: parseFloat(preco) || 0,
        categoria,
        estado,
        cidade: cidade.trim(),
        telefone: telefone.trim(),
        imagens: allImages,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        const { error } = await supabase.from("brick_items" as any).update(payload).eq("id", editingItem.id);
        if (error) throw error;
        toast({ title: "Atualizado! ✅" });
      } else {
        const { error } = await supabase.from("brick_items" as any).insert(payload);
        if (error) throw error;
        toast({ title: "Anúncio criado! 🎉" });
      }

      resetForm();
      setDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const toggleVendido = async (item: BrickItem) => {
    await supabase.from("brick_items" as any).update({ vendido: !item.vendido }).eq("id", item.id);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("brick_items" as any).delete().eq("id", id);
    fetchItems();
    toast({ title: "Removido" });
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.titulo.toLowerCase().includes(search.toLowerCase()) || item.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || item.categoria === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <SmartLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-amber-500" /> Brick – Seu Brique
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Anuncie itens usados e venda para outros corretores</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2">
                <Plus className="w-4 h-4" /> Novo Anúncio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  {editingItem ? "Editar Anúncio" : "Novo Anúncio"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Título *</Label>
                  <Input placeholder="Ex: Notebook Dell i7" value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Descrição</Label>
                  <Textarea placeholder="Descreva o item..." value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Preço (R$)</Label>
                    <Input type="number" placeholder="0" value={preco} onChange={e => setPreco(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Cidade</Label>
                    <Input placeholder="Sua cidade" value={cidade} onChange={e => setCidade(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Telefone / WhatsApp</Label>
                  <Input placeholder="(51) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />
                </div>
                {/* Images */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center gap-1"><Image className="w-3.5 h-3.5" /> Fotos</Label>
                  {existingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((url, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          <img src={url} className="w-full h-full object-cover" />
                          <button onClick={() => removeExistingImage(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => setImageFiles(Array.from(e.target.files || []))}
                    className="text-xs"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingItem ? "Salvar Alterações" : "Publicar Anúncio"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar nos seus anúncios..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCat} onValueChange={v => setFilterCat(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30" />
            <p className="text-lg font-bold text-muted-foreground">Nenhum anúncio ainda</p>
            <p className="text-sm text-muted-foreground">Clique em "Novo Anúncio" para começar a vender!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(item => (
              <div key={item.id} className={cn(
                "bg-card rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all group",
                item.vendido && "opacity-60"
              )}>
                {/* Image */}
                <div className="relative h-40 bg-muted">
                  {item.imagens?.length > 0 ? (
                    <img src={item.imagens[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  {item.vendido && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge className="bg-emerald-500 text-white text-sm font-bold px-3 py-1">VENDIDO ✓</Badge>
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold">
                    {item.categoria}
                  </Badge>
                  <Badge className="absolute top-2 right-2 bg-card/90 text-foreground text-[10px] font-semibold border">
                    {item.estado}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.titulo}</h3>
                  {item.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{item.descricao}</p>}
                  <p className="text-lg font-extrabold text-amber-600">{formatCurrency(item.preco)}</p>
                  {item.cidade && <p className="text-[11px] text-muted-foreground">📍 {item.cidade}</p>}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                    <Button size="sm" variant="ghost" className="flex-1 text-xs h-8" onClick={() => openEdit(item)}>
                      <Edit3 className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1 text-xs h-8" onClick={() => toggleVendido(item)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {item.vendido ? "Reabrir" : "Vendido"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-8 text-destructive hover:text-destructive" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SmartLayout>
  );
}

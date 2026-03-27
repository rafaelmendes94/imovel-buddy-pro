import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2, Users, Plus, Trash2, Edit, Phone, Mail, Award, ChevronDown, ChevronUp, UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Corretor {
  id: string;
  name: string;
  email: string;
  phone: string;
  creci: string;
  status: "Ativo" | "Inativo";
}

interface Imobiliaria {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  creci: string;
  corretores: Corretor[];
}

const initialImobiliarias: Imobiliaria[] = [
  {
    id: "1",
    name: "Alpha Imóveis",
    cnpj: "12.345.678/0001-90",
    phone: "(51) 3456-7890",
    email: "contato@alphaimoveis.com",
    address: "Av. Beira Mar, 500 - Capão da Canoa",
    creci: "J-12345",
    corretores: [
      { id: "c1", name: "Carlos Silva", email: "carlos@alpha.com", phone: "(51) 99876-5432", creci: "123456-RS", status: "Ativo" },
      { id: "c2", name: "Ana Rodrigues", email: "ana@alpha.com", phone: "(51) 99765-4321", creci: "234567-RS", status: "Ativo" },
    ],
  },
  {
    id: "2",
    name: "Beta Imobiliária",
    cnpj: "98.765.432/0001-10",
    phone: "(51) 3567-8901",
    email: "contato@betaimob.com",
    address: "Rua Central, 200 - Xangri-lá",
    creci: "J-67890",
    corretores: [
      { id: "c3", name: "Marcos Oliveira", email: "marcos@beta.com", phone: "(51) 99654-3210", creci: "345678-RS", status: "Ativo" },
    ],
  },
];

export function CadastroPanel({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>(initialImobiliarias);
  const [expandedImob, setExpandedImob] = useState<string | null>(null);
  const [editingImob, setEditingImob] = useState<Imobiliaria | null>(null);
  const [editingCorretor, setEditingCorretor] = useState<{ imobId: string; corretor: Corretor | null } | null>(null);

  // Imobiliária form
  const [imobForm, setImobForm] = useState({ name: "", cnpj: "", phone: "", email: "", address: "", creci: "" });
  // Corretor form
  const [corretorForm, setCorretorForm] = useState({ name: "", email: "", phone: "", creci: "", status: "Ativo" as Corretor["status"] });

  const [activeTab, setActiveTab] = useState("lista");

  const resetImobForm = () => setImobForm({ name: "", cnpj: "", phone: "", email: "", address: "", creci: "" });
  const resetCorretorForm = () => setCorretorForm({ name: "", email: "", phone: "", creci: "", status: "Ativo" });

  // Imobiliária CRUD
  const handleSaveImob = () => {
    if (!imobForm.name.trim()) return toast.error("Nome da imobiliária é obrigatório");
    if (editingImob) {
      setImobiliarias(prev => prev.map(i => i.id === editingImob.id ? { ...i, ...imobForm } : i));
      toast.success("Imobiliária atualizada!");
      setEditingImob(null);
    } else {
      const newImob: Imobiliaria = { id: Date.now().toString(), ...imobForm, corretores: [] };
      setImobiliarias(prev => [...prev, newImob]);
      toast.success("Imobiliária cadastrada!");
    }
    resetImobForm();
    setActiveTab("lista");
  };

  const handleEditImob = (imob: Imobiliaria) => {
    setEditingImob(imob);
    setImobForm({ name: imob.name, cnpj: imob.cnpj, phone: imob.phone, email: imob.email, address: imob.address, creci: imob.creci });
    setActiveTab("imobiliaria");
  };

  const handleDeleteImob = (id: string) => {
    setImobiliarias(prev => prev.filter(i => i.id !== id));
    toast.success("Imobiliária removida!");
  };

  // Corretor CRUD
  const handleSaveCorretor = () => {
    if (!editingCorretor) return;
    if (!corretorForm.name.trim()) return toast.error("Nome do corretor é obrigatório");

    const imobId = editingCorretor.imobId;
    if (editingCorretor.corretor) {
      // Edit
      setImobiliarias(prev => prev.map(i => i.id === imobId ? {
        ...i,
        corretores: i.corretores.map(c => c.id === editingCorretor.corretor!.id ? { ...c, ...corretorForm } : c)
      } : i));
      toast.success("Corretor atualizado!");
    } else {
      // Add
      const newCorretor: Corretor = { id: Date.now().toString(), ...corretorForm };
      setImobiliarias(prev => prev.map(i => i.id === imobId ? { ...i, corretores: [...i.corretores, newCorretor] } : i));
      toast.success("Corretor cadastrado!");
    }
    setEditingCorretor(null);
    resetCorretorForm();
    setActiveTab("lista");
  };

  const handleEditCorretor = (imobId: string, corretor: Corretor) => {
    setEditingCorretor({ imobId, corretor });
    setCorretorForm({ name: corretor.name, email: corretor.email, phone: corretor.phone, creci: corretor.creci, status: corretor.status });
    setActiveTab("corretor");
  };

  const handleAddCorretor = (imobId: string) => {
    setEditingCorretor({ imobId, corretor: null });
    resetCorretorForm();
    setActiveTab("corretor");
  };

  const handleDeleteCorretor = (imobId: string, corretorId: string) => {
    setImobiliarias(prev => prev.map(i => i.id === imobId ? { ...i, corretores: i.corretores.filter(c => c.id !== corretorId) } : i));
    toast.success("Corretor removido!");
  };

  const totalCorretores = imobiliarias.reduce((s, i) => s + i.corretores.length, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}>
          <UserPlus className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Cadastros</span>}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-accent" />
            Cadastro de Imobiliárias e Corretores
          </SheetTitle>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              {imobiliarias.length} imobiliárias
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {totalCorretores} corretores
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="lista" className="flex-1 text-xs">Lista</TabsTrigger>
              <TabsTrigger value="imobiliaria" className="flex-1 text-xs">
                {editingImob ? "Editar Imob." : "Nova Imob."}
              </TabsTrigger>
              <TabsTrigger value="corretor" className="flex-1 text-xs" disabled={!editingCorretor && imobiliarias.length === 0}>
                {editingCorretor?.corretor ? "Editar Corretor" : "Novo Corretor"}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* === LISTA === */}
          <TabsContent value="lista" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-3">
                <Button size="sm" className="w-full gap-1.5" onClick={() => { resetImobForm(); setEditingImob(null); setActiveTab("imobiliaria"); }}>
                  <Plus className="w-4 h-4" /> Nova Imobiliária
                </Button>

                {imobiliarias.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma imobiliária cadastrada</p>
                )}

                {imobiliarias.map(imob => {
                  const isExpanded = expandedImob === imob.id;
                  return (
                    <div key={imob.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Imobiliária header */}
                      <div className="p-3 bg-muted/30 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground truncate">{imob.name}</h4>
                            <Badge variant="outline" className="text-[10px]">{imob.corretores.length} corretores</Badge>
                          </div>
                          {imob.creci && <p className="text-[11px] text-muted-foreground">CRECI: {imob.creci}</p>}
                          {imob.phone && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{imob.phone}</p>}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditImob(imob)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteImob(imob.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedImob(isExpanded ? null : imob.id)}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Corretores list */}
                      {isExpanded && (
                        <div className="border-t border-border">
                          {imob.corretores.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">Nenhum corretor cadastrado</p>
                          )}
                          {imob.corretores.map(c => (
                            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent flex-shrink-0">
                                {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  {c.creci && <span>CRECI: {c.creci}</span>}
                                  <Badge variant="outline" className={cn("text-[9px] h-4", c.status === "Ativo" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground")}>
                                    {c.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditCorretor(imob.id, c)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteCorretor(imob.id, c.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="p-2">
                            <Button variant="outline" size="sm" className="w-full gap-1 text-xs h-8" onClick={() => handleAddCorretor(imob.id)}>
                              <Plus className="w-3 h-3" /> Adicionar Corretor
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* === NOVA/EDITAR IMOBILIÁRIA === */}
          <TabsContent value="imobiliaria" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div><Label>Nome da Imobiliária *</Label><Input value={imobForm.name} onChange={e => setImobForm(p => ({ ...p, name: e.target.value }))} placeholder="Alpha Imóveis" /></div>
                <div><Label>CNPJ</Label><Input value={imobForm.cnpj} onChange={e => setImobForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="12.345.678/0001-90" /></div>
                <div><Label>CRECI Jurídico</Label><Input value={imobForm.creci} onChange={e => setImobForm(p => ({ ...p, creci: e.target.value }))} placeholder="J-12345" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Telefone</Label><Input value={imobForm.phone} onChange={e => setImobForm(p => ({ ...p, phone: e.target.value }))} placeholder="(51) 3456-7890" /></div>
                  <div><Label>E-mail</Label><Input value={imobForm.email} onChange={e => setImobForm(p => ({ ...p, email: e.target.value }))} placeholder="contato@imob.com" /></div>
                </div>
                <div><Label>Endereço</Label><Input value={imobForm.address} onChange={e => setImobForm(p => ({ ...p, address: e.target.value }))} placeholder="Av. Beira Mar, 500" /></div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveImob} className="flex-1">{editingImob ? "Salvar Alterações" : "Cadastrar Imobiliária"}</Button>
                  <Button variant="outline" onClick={() => { resetImobForm(); setEditingImob(null); setActiveTab("lista"); }}>Cancelar</Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* === NOVO/EDITAR CORRETOR === */}
          <TabsContent value="corretor" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {editingCorretor && (
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent" />
                    Imobiliária: <span className="font-semibold text-foreground">{imobiliarias.find(i => i.id === editingCorretor.imobId)?.name}</span>
                  </div>
                )}
                {!editingCorretor && (
                  <div className="space-y-2">
                    <Label>Selecionar Imobiliária *</Label>
                    <Select onValueChange={v => setEditingCorretor({ imobId: v, corretor: null })}>
                      <SelectTrigger><SelectValue placeholder="Escolha uma imobiliária" /></SelectTrigger>
                      <SelectContent>
                        {imobiliarias.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Nome do Corretor *</Label><Input value={corretorForm.name} onChange={e => setCorretorForm(p => ({ ...p, name: e.target.value }))} placeholder="João da Silva" /></div>
                <div><Label>E-mail</Label><Input value={corretorForm.email} onChange={e => setCorretorForm(p => ({ ...p, email: e.target.value }))} placeholder="joao@email.com" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Telefone</Label><Input value={corretorForm.phone} onChange={e => setCorretorForm(p => ({ ...p, phone: e.target.value }))} placeholder="(51) 99999-0000" /></div>
                  <div><Label>CRECI</Label><Input value={corretorForm.creci} onChange={e => setCorretorForm(p => ({ ...p, creci: e.target.value }))} placeholder="123456-RS" /></div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={corretorForm.status} onValueChange={v => setCorretorForm(p => ({ ...p, status: v as Corretor["status"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveCorretor} className="flex-1" disabled={!editingCorretor}>
                    {editingCorretor?.corretor ? "Salvar Alterações" : "Cadastrar Corretor"}
                  </Button>
                  <Button variant="outline" onClick={() => { setEditingCorretor(null); resetCorretorForm(); setActiveTab("lista"); }}>Cancelar</Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

import { useState } from "react";
import { SmartLayout } from "@/components/SmartLayout";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Users, Plus, Trash2, Edit, Phone, Mail, Award, ChevronDown, ChevronUp, UserPlus, Search
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

export default function Imobiliarias() {
  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>(initialImobiliarias);
  const [expandedImob, setExpandedImob] = useState<string | null>(null);
  const [editingImob, setEditingImob] = useState<Imobiliaria | null>(null);
  const [editingCorretor, setEditingCorretor] = useState<{ imobId: string; corretor: Corretor | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [imobForm, setImobForm] = useState({ name: "", cnpj: "", phone: "", email: "", address: "", creci: "" });
  const [corretorForm, setCorretorForm] = useState({ name: "", email: "", phone: "", creci: "", status: "Ativo" as Corretor["status"] });

  const [activeTab, setActiveTab] = useState("lista");

  const resetImobForm = () => setImobForm({ name: "", cnpj: "", phone: "", email: "", address: "", creci: "" });
  const resetCorretorForm = () => setCorretorForm({ name: "", email: "", phone: "", creci: "", status: "Ativo" });

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

  const handleSaveCorretor = () => {
    if (!editingCorretor) return;
    if (!corretorForm.name.trim()) return toast.error("Nome do corretor é obrigatório");
    const imobId = editingCorretor.imobId;
    if (editingCorretor.corretor) {
      setImobiliarias(prev => prev.map(i => i.id === imobId ? {
        ...i, corretores: i.corretores.map(c => c.id === editingCorretor.corretor!.id ? { ...c, ...corretorForm } : c)
      } : i));
      toast.success("Corretor atualizado!");
    } else {
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

  const filteredImobiliarias = imobiliarias.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.cnpj.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.corretores.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SmartLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-7 h-7 text-accent" /> Imobiliárias
            </h1>
            <p className="text-muted-foreground text-sm">Gestão de imobiliárias e corretores</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" /> {imobiliarias.length} imobiliárias
              <Users className="w-4 h-4 ml-2" /> {totalCorretores} corretores
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="lista">Lista</TabsTrigger>
              <TabsTrigger value="imobiliaria">{editingImob ? "Editar Imob." : "Nova Imob."}</TabsTrigger>
              <TabsTrigger value="corretor" disabled={!editingCorretor && imobiliarias.length === 0}>
                {editingCorretor?.corretor ? "Editar Corretor" : "Novo Corretor"}
              </TabsTrigger>
            </TabsList>
            {activeTab === "lista" && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-9 w-[220px]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => { resetImobForm(); setEditingImob(null); setActiveTab("imobiliaria"); }}>
                  <Plus className="w-4 h-4" /> Nova Imobiliária
                </Button>
              </div>
            )}
          </div>

          {/* === LISTA === */}
          <TabsContent value="lista" className="space-y-3">
            {filteredImobiliarias.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhuma imobiliária encontrada</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredImobiliarias.map(imob => {
                const isExpanded = expandedImob === imob.id;
                return (
                  <Card key={imob.id} className="overflow-hidden">
                    <div className="p-4 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground truncate">{imob.name}</h4>
                          <Badge variant="outline" className="text-[10px]">{imob.corretores.length} corretores</Badge>
                        </div>
                        {imob.creci && <p className="text-xs text-muted-foreground">CRECI: {imob.creci}</p>}
                        {imob.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{imob.phone}</p>}
                        {imob.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{imob.email}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditImob(imob)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteImob(imob.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedImob(isExpanded ? null : imob.id)}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border">
                        {imob.corretores.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">Nenhum corretor cadastrado</p>
                        )}
                        {imob.corretores.map(c => (
                          <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                              {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {c.creci && <span>CRECI: {c.creci}</span>}
                                <Badge variant="outline" className={cn("text-[9px] h-4", c.status === "Ativo" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground")}>
                                  {c.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCorretor(imob.id, c)}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCorretor(imob.id, c.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="p-3">
                          <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => handleAddCorretor(imob.id)}>
                            <Plus className="w-3.5 h-3.5" /> Adicionar Corretor
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* === NOVA/EDITAR IMOBILIÁRIA === */}
          <TabsContent value="imobiliaria">
            <Card>
              <CardContent className="p-6 space-y-4 max-w-2xl">
                <div><Label>Nome da Imobiliária *</Label><Input value={imobForm.name} onChange={e => setImobForm(p => ({ ...p, name: e.target.value }))} placeholder="Alpha Imóveis" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>CNPJ</Label><Input value={imobForm.cnpj} onChange={e => setImobForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="12.345.678/0001-90" /></div>
                  <div><Label>CRECI Jurídico</Label><Input value={imobForm.creci} onChange={e => setImobForm(p => ({ ...p, creci: e.target.value }))} placeholder="J-12345" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Telefone</Label><Input value={imobForm.phone} onChange={e => setImobForm(p => ({ ...p, phone: e.target.value }))} placeholder="(51) 3456-7890" /></div>
                  <div><Label>E-mail</Label><Input value={imobForm.email} onChange={e => setImobForm(p => ({ ...p, email: e.target.value }))} placeholder="contato@imob.com" /></div>
                </div>
                <div><Label>Endereço</Label><Input value={imobForm.address} onChange={e => setImobForm(p => ({ ...p, address: e.target.value }))} placeholder="Av. Beira Mar, 500" /></div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveImob} className="flex-1">{editingImob ? "Salvar Alterações" : "Cadastrar Imobiliária"}</Button>
                  <Button variant="outline" onClick={() => { resetImobForm(); setEditingImob(null); setActiveTab("lista"); }}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === NOVO/EDITAR CORRETOR === */}
          <TabsContent value="corretor">
            <Card>
              <CardContent className="p-6 space-y-4 max-w-2xl">
                {editingCorretor && (
                  <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
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
                <div className="grid grid-cols-2 gap-4">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SmartLayout>
  );
}

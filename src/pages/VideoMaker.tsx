import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Video, DollarSign, Calendar as CalendarIcon, Plus, Trash2, Edit, GripVertical,
  CheckCircle2, Clock, Film, Send, Package, Search, ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Types
interface VideoJob {
  id: string;
  property: string;
  client: string;
  address: string;
  value: number;
  status: "gravar" | "gravado" | "editando" | "entregue" | "enviado";
  dueDate: string;
  notes: string;
  createdAt: string;
}

interface FinanceEntry {
  id: string;
  property: string;
  client: string;
  value: number;
  status: "pendente" | "pago" | "atrasado";
  dueDate: string;
  paidAt?: string;
}

interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "gravacao" | "entrega" | "reuniao" | "outro";
  notes: string;
  jobId?: string;
}

// Kanban columns config
const kanbanColumns: { key: VideoJob["status"]; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "gravar", label: "Para Gravar", icon: <Clock className="w-4 h-4" />, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { key: "gravado", label: "Gravado", icon: <Film className="w-4 h-4" />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { key: "editando", label: "Editando", icon: <Video className="w-4 h-4" />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { key: "entregue", label: "Entregue", icon: <Package className="w-4 h-4" />, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { key: "enviado", label: "Enviado", icon: <Send className="w-4 h-4" />, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
];

const eventTypeColors: Record<AgendaEvent["type"], string> = {
  gravacao: "bg-amber-500",
  entrega: "bg-emerald-500",
  reuniao: "bg-blue-500",
  outro: "bg-muted-foreground",
};

// Initial mock data
const initialJobs: VideoJob[] = [
  { id: "1", property: "Cobertura Duplex - Ed. Marina", client: "Construtora Alpha", address: "Av. Beira Mar, 1200", value: 1500, status: "gravar", dueDate: "2026-04-02", notes: "Drone + interna", createdAt: "2026-03-25" },
  { id: "2", property: "Apto 3Q - Cond. Jardins", client: "Imobiliária Beta", address: "Rua das Flores, 300", value: 800, status: "gravado", dueDate: "2026-03-30", notes: "Já gravado, aguardando edição", createdAt: "2026-03-20" },
  { id: "3", property: "Sala Comercial - Tower One", client: "JB Imóveis", address: "Av. Central, 500", value: 600, status: "editando", dueDate: "2026-03-28", notes: "Edição com tour virtual", createdAt: "2026-03-18" },
  { id: "4", property: "Casa 4Q - Cond. Alphaville", client: "RE/MAX", address: "Alameda dos Ipês, 45", value: 2000, status: "entregue", dueDate: "2026-03-26", notes: "Entregue via Google Drive", createdAt: "2026-03-10" },
  { id: "5", property: "Loft Studio - Ed. Art Déco", client: "Exclusiva Imóveis", address: "Rua Augusta, 890", value: 500, status: "enviado", dueDate: "2026-03-22", notes: "", createdAt: "2026-03-05" },
];

const initialFinance: FinanceEntry[] = [
  { id: "1", property: "Cobertura Duplex - Ed. Marina", client: "Construtora Alpha", value: 1500, status: "pendente", dueDate: "2026-04-05" },
  { id: "2", property: "Apto 3Q - Cond. Jardins", client: "Imobiliária Beta", value: 800, status: "pendente", dueDate: "2026-04-01" },
  { id: "3", property: "Sala Comercial - Tower One", client: "JB Imóveis", value: 600, status: "pago", dueDate: "2026-03-28", paidAt: "2026-03-27" },
  { id: "4", property: "Casa 4Q - Cond. Alphaville", client: "RE/MAX", value: 2000, status: "pago", dueDate: "2026-03-20", paidAt: "2026-03-19" },
  { id: "5", property: "Loft Studio - Ed. Art Déco", client: "Exclusiva Imóveis", value: 500, status: "atrasado", dueDate: "2026-03-15" },
];

const initialEvents: AgendaEvent[] = [
  { id: "1", title: "Gravar Cobertura Ed. Marina", date: "2026-04-02", time: "09:00", type: "gravacao", notes: "Levar drone e gimbal", jobId: "1" },
  { id: "2", title: "Entrega vídeo Tower One", date: "2026-03-28", time: "14:00", type: "entrega", notes: "Enviar link do drive", jobId: "3" },
  { id: "3", title: "Reunião com Construtora Alpha", date: "2026-03-29", time: "10:00", type: "reuniao", notes: "Discutir pacote de 5 imóveis" },
];

export default function VideoMaker() {
  const [jobs, setJobs] = useState<VideoJob[]>(initialJobs);
  const [finance, setFinance] = useState<FinanceEntry[]>(initialFinance);
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchFinance, setSearchFinance] = useState("");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<VideoJob | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  // New job form
  const [newJob, setNewJob] = useState({ property: "", client: "", address: "", value: "", dueDate: "", notes: "", status: "gravar" as VideoJob["status"] });
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", type: "gravacao" as AgendaEvent["type"], notes: "" });
  const [newFinance, setNewFinance] = useState({ property: "", client: "", value: "", dueDate: "", status: "pendente" as FinanceEntry["status"] });

  // Financial metrics
  const totalReceived = finance.filter(f => f.status === "pago").reduce((s, f) => s + f.value, 0);
  const totalPending = finance.filter(f => f.status === "pendente").reduce((s, f) => s + f.value, 0);
  const totalOverdue = finance.filter(f => f.status === "atrasado").reduce((s, f) => s + f.value, 0);
  const totalJobs = jobs.length;

  // Kanban drag & drop
  const handleDragStart = (jobId: string) => setDraggedJobId(jobId);
  const handleDrop = (newStatus: VideoJob["status"]) => {
    if (!draggedJobId) return;
    setJobs(prev => prev.map(j => j.id === draggedJobId ? { ...j, status: newStatus } : j));
    setDraggedJobId(null);
    toast.success("Status atualizado!");
  };

  // CRUD handlers
  const handleAddJob = () => {
    if (!newJob.property || !newJob.client) return toast.error("Preencha os campos obrigatórios");
    const job: VideoJob = {
      id: Date.now().toString(), property: newJob.property, client: newJob.client,
      address: newJob.address, value: Number(newJob.value) || 0, status: newJob.status,
      dueDate: newJob.dueDate, notes: newJob.notes, createdAt: new Date().toISOString().split("T")[0],
    };
    if (editingJob) {
      setJobs(prev => prev.map(j => j.id === editingJob.id ? { ...job, id: editingJob.id, createdAt: editingJob.createdAt } : j));
      toast.success("Trabalho atualizado!");
    } else {
      setJobs(prev => [...prev, job]);
      toast.success("Novo trabalho adicionado!");
    }
    setNewJob({ property: "", client: "", address: "", value: "", dueDate: "", notes: "", status: "gravar" });
    setEditingJob(null);
    setJobDialogOpen(false);
  };

  const handleEditJob = (job: VideoJob) => {
    setEditingJob(job);
    setNewJob({ property: job.property, client: job.client, address: job.address, value: String(job.value), dueDate: job.dueDate, notes: job.notes, status: job.status });
    setJobDialogOpen(true);
  };

  const handleDeleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    toast.success("Trabalho removido!");
  };

  const handleAddFinance = () => {
    if (!newFinance.property || !newFinance.client) return toast.error("Preencha os campos obrigatórios");
    const entry: FinanceEntry = {
      id: Date.now().toString(), property: newFinance.property, client: newFinance.client,
      value: Number(newFinance.value) || 0, status: newFinance.status, dueDate: newFinance.dueDate,
    };
    setFinance(prev => [...prev, entry]);
    setNewFinance({ property: "", client: "", value: "", dueDate: "", status: "pendente" });
    setFinanceDialogOpen(false);
    toast.success("Registro financeiro adicionado!");
  };

  const toggleFinanceStatus = (id: string) => {
    setFinance(prev => prev.map(f => {
      if (f.id !== id) return f;
      if (f.status === "pago") return { ...f, status: "pendente" as const, paidAt: undefined };
      return { ...f, status: "pago" as const, paidAt: new Date().toISOString().split("T")[0] };
    }));
    toast.success("Status atualizado!");
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return toast.error("Preencha título e data");
    const event: AgendaEvent = { id: Date.now().toString(), ...newEvent };
    setEvents(prev => [...prev, event]);
    setNewEvent({ title: "", date: "", time: "", type: "gravacao", notes: "" });
    setEventDialogOpen(false);
    toast.success("Evento adicionado!");
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Evento removido!");
  };

  const filteredFinance = finance.filter(f =>
    f.property.toLowerCase().includes(searchFinance.toLowerCase()) ||
    f.client.toLowerCase().includes(searchFinance.toLowerCase())
  );

  // Events for selected date
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const eventsForDate = events.filter(e => e.date === selectedDateStr);
  const datesWithEvents = events.map(e => new Date(e.date + "T12:00:00"));

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Video className="w-7 h-7 text-accent" /> Video Maker
            </h1>
            <p className="text-muted-foreground text-sm">Gestão de vídeos imobiliários, financeiro e agenda</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recebido</p>
                <p className="text-lg font-bold text-emerald-400">R$ {totalReceived.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-lg font-bold text-amber-400">R$ {totalPending.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atrasado</p>
                <p className="text-lg font-bold text-red-400">R$ {totalOverdue.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Film className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Trabalhos</p>
                <p className="text-lg font-bold text-blue-400">{totalJobs}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-1.5"><Film className="w-4 h-4" /> Kanban</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1.5"><DollarSign className="w-4 h-4" /> Financeiro</TabsTrigger>
            <TabsTrigger value="agenda" className="gap-1.5"><CalendarIcon className="w-4 h-4" /> Agenda</TabsTrigger>
          </TabsList>

          {/* ==================== KANBAN ==================== */}
          <TabsContent value="kanban" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={jobDialogOpen} onOpenChange={(o) => { setJobDialogOpen(o); if (!o) { setEditingJob(null); setNewJob({ property: "", client: "", address: "", value: "", dueDate: "", notes: "", status: "gravar" }); } }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Trabalho</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingJob ? "Editar Trabalho" : "Novo Trabalho de Vídeo"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Imóvel *</Label><Input value={newJob.property} onChange={e => setNewJob(p => ({ ...p, property: e.target.value }))} placeholder="Ex: Cobertura Ed. Marina" /></div>
                    <div><Label>Cliente *</Label><Input value={newJob.client} onChange={e => setNewJob(p => ({ ...p, client: e.target.value }))} placeholder="Ex: Construtora Alpha" /></div>
                    <div><Label>Endereço</Label><Input value={newJob.address} onChange={e => setNewJob(p => ({ ...p, address: e.target.value }))} placeholder="Av. Beira Mar, 1200" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Valor (R$)</Label><Input type="number" value={newJob.value} onChange={e => setNewJob(p => ({ ...p, value: e.target.value }))} placeholder="1500" /></div>
                      <div><Label>Prazo</Label><Input type="date" value={newJob.dueDate} onChange={e => setNewJob(p => ({ ...p, dueDate: e.target.value }))} /></div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={newJob.status} onValueChange={v => setNewJob(p => ({ ...p, status: v as VideoJob["status"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {kanbanColumns.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Observações</Label><Textarea value={newJob.notes} onChange={e => setNewJob(p => ({ ...p, notes: e.target.value }))} placeholder="Drone, interna, tour virtual..." rows={2} /></div>
                    <Button onClick={handleAddJob} className="w-full">{editingJob ? "Salvar Alterações" : "Adicionar Trabalho"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto">
              {kanbanColumns.map(col => {
                const colJobs = jobs.filter(j => j.status === col.key);
                return (
                  <div
                    key={col.key}
                    className="bg-muted/30 rounded-xl p-3 min-h-[300px] border border-border/50"
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(col.key)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={cn("gap-1", col.color)}>
                        {col.icon} {col.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{colJobs.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colJobs.map(job => (
                        <Card
                          key={job.id}
                          draggable
                          onDragStart={() => handleDragStart(job.id)}
                          className={cn(
                            "cursor-grab active:cursor-grabbing border-border/50 hover:border-accent/40 transition-all",
                            draggedJobId === job.id && "opacity-50 scale-95"
                          )}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-1.5">
                                <GripVertical className="w-3 h-3 text-muted-foreground" />
                                <p className="text-sm font-medium text-foreground leading-tight">{job.property}</p>
                              </div>
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditJob(job)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteJob(job.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{job.client}</p>
                            {job.address && <p className="text-[11px] text-muted-foreground/70">{job.address}</p>}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-semibold text-accent">R$ {job.value.toLocaleString("pt-BR")}</span>
                              {job.dueDate && <span className="text-[10px] text-muted-foreground">{format(new Date(job.dueDate + "T12:00:00"), "dd/MM")}</span>}
                            </div>
                            {job.notes && <p className="text-[11px] text-muted-foreground/60 truncate">{job.notes}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ==================== FINANCEIRO ==================== */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por imóvel ou cliente..." className="pl-9" value={searchFinance} onChange={e => setSearchFinance(e.target.value)} />
              </div>
              <Dialog open={financeDialogOpen} onOpenChange={setFinanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Registro</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Novo Registro Financeiro</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Imóvel *</Label><Input value={newFinance.property} onChange={e => setNewFinance(p => ({ ...p, property: e.target.value }))} /></div>
                    <div><Label>Cliente *</Label><Input value={newFinance.client} onChange={e => setNewFinance(p => ({ ...p, client: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Valor (R$)</Label><Input type="number" value={newFinance.value} onChange={e => setNewFinance(p => ({ ...p, value: e.target.value }))} /></div>
                      <div><Label>Vencimento</Label><Input type="date" value={newFinance.dueDate} onChange={e => setNewFinance(p => ({ ...p, dueDate: e.target.value }))} /></div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={newFinance.status} onValueChange={v => setNewFinance(p => ({ ...p, status: v as FinanceEntry["status"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="atrasado">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddFinance} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFinance.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                  ) : filteredFinance.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium text-foreground">{f.property}</TableCell>
                      <TableCell className="text-muted-foreground">{f.client}</TableCell>
                      <TableCell className="font-semibold text-accent">R$ {f.value.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-muted-foreground">{f.dueDate ? format(new Date(f.dueDate + "T12:00:00"), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          f.status === "pago" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                          f.status === "pendente" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                          f.status === "atrasado" && "bg-red-500/20 text-red-400 border-red-500/30",
                        )}>
                          {f.status === "pago" ? "Pago" : f.status === "pendente" ? "Pendente" : "Atrasado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleFinanceStatus(f.id)} className="gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {f.status === "pago" ? "Desfazer" : "Marcar Pago"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setFinance(prev => prev.filter(x => x.id !== f.id)); toast.success("Removido!"); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ==================== AGENDA ==================== */}
          <TabsContent value="agenda" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Evento</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Novo Evento na Agenda</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Título *</Label><Input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Gravar Cobertura..." /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Data *</Label><Input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} /></div>
                      <div><Label>Horário</Label><Input type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} /></div>
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={newEvent.type} onValueChange={v => setNewEvent(p => ({ ...p, type: v as AgendaEvent["type"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gravacao">Gravação</SelectItem>
                          <SelectItem value="entrega">Entrega</SelectItem>
                          <SelectItem value="reuniao">Reunião</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Observações</Label><Textarea value={newEvent.notes} onChange={e => setNewEvent(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                    <Button onClick={handleAddEvent} className="w-full">Adicionar Evento</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                    modifiers={{ hasEvent: datesWithEvents }}
                    modifiersClassNames={{ hasEvent: "bg-accent/20 font-bold text-accent" }}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </CardTitle>
                  <CardDescription>{eventsForDate.length} evento(s)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventsForDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento nesta data</p>
                  ) : eventsForDate.map(ev => (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className={cn("w-3 h-3 rounded-full mt-1.5 flex-shrink-0", eventTypeColors[ev.type])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{ev.title}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {ev.type === "gravacao" ? "Gravação" : ev.type === "entrega" ? "Entrega" : ev.type === "reuniao" ? "Reunião" : "Outro"}
                          </Badge>
                        </div>
                        {ev.time && <p className="text-xs text-muted-foreground">{ev.time}</p>}
                        {ev.notes && <p className="text-xs text-muted-foreground/70 mt-1">{ev.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => handleDeleteEvent(ev.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* All upcoming events */}
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Próximos Eventos</p>
                    {events
                      .filter(e => new Date(e.date + "T12:00:00") >= new Date())
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .slice(0, 5)
                      .map(ev => (
                        <div key={ev.id} className="flex items-center gap-2 py-1.5">
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", eventTypeColors[ev.type])} />
                          <span className="text-xs text-muted-foreground">{format(new Date(ev.date + "T12:00:00"), "dd/MM")}</span>
                          <span className="text-xs text-foreground">{ev.title}</span>
                          {ev.time && <span className="text-[10px] text-muted-foreground ml-auto">{ev.time}</span>}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

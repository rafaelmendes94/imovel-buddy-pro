import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Video, DollarSign, Calendar as CalendarIcon, Plus, Trash2, Edit, GripVertical,
  CheckCircle2, Clock, Film, Send, Package, Search, ChevronLeft, ChevronRight, MapPin,
  TrendingUp, TrendingDown, BarChart3, Trophy, Clapperboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameMonth, parseISO, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Material types & client types
const materialTypes = [
  { value: "vr", label: "VR" },
  { value: "vc", label: "VC" },
  { value: "vr360", label: "VR 360" },
  { value: "vc360", label: "VC 360" },
  { value: "vcdn", label: "VCDN" },
] as const;
type MaterialType = typeof materialTypes[number]["value"];

const clientTypes = [
  { value: "assinante", label: "Assinante" },
  { value: "construtor", label: "Construtor" },
  { value: "particular", label: "Particular" },
  { value: "mv_broker", label: "MV Broker" },
] as const;
type ClientType = typeof clientTypes[number]["value"];

const materialTypeColors: Record<MaterialType, string> = {
  vr: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  vc: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  vr360: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  vc360: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  vcdn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const clientTypeColors: Record<ClientType, string> = {
  assinante: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  construtor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  particular: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  mv_broker: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

// Types
interface VideoJob {
  id: string;
  property: string;
  client: string;
  address: string;
  value: number;
  materialType: MaterialType;
  clientType: ClientType;
  status: "gravar" | "gravado" | "editando" | "entregue" | "enviado";
  dueDate: string;
  notes: string;
  createdAt: string;
}

interface FinanceEntry {
  id: string;
  property: string;
  client: string;
  materialType: MaterialType;
  clientType: ClientType;
  clientValue: number;
  editorCost: number;
  status: "pendente" | "pago" | "atrasado";
  dueDate: string;
  paidAt?: string;
}

interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  type: "gravacao" | "entrega" | "reuniao" | "outro";
  notes: string;
  location: string;
  jobId?: string;
}

// Kanban columns config
const kanbanColumns: { key: VideoJob["status"]; label: string; icon: React.ReactNode; color: string; headerBg: string }[] = [
  { key: "gravar", label: "Para Gravar", icon: <Clock className="w-4 h-4" />, color: "bg-amber-500/20 text-amber-400 border-amber-500/30", headerBg: "border-t-amber-500" },
  { key: "gravado", label: "Gravado", icon: <Film className="w-4 h-4" />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30", headerBg: "border-t-blue-500" },
  { key: "editando", label: "Editando", icon: <Video className="w-4 h-4" />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30", headerBg: "border-t-purple-500" },
  { key: "entregue", label: "Entregue", icon: <Package className="w-4 h-4" />, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", headerBg: "border-t-emerald-500" },
  { key: "enviado", label: "Enviado", icon: <Send className="w-4 h-4" />, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", headerBg: "border-t-cyan-500" },
];

const eventTypeConfig: Record<AgendaEvent["type"], { label: string; color: string; bg: string }> = {
  gravacao: { label: "Gravação", color: "bg-amber-500", bg: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
  entrega: { label: "Entrega", color: "bg-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" },
  reuniao: { label: "Reunião", color: "bg-blue-500", bg: "bg-blue-500/10 border-blue-500/30 text-blue-300" },
  outro: { label: "Outro", color: "bg-muted-foreground", bg: "bg-muted/30 border-border text-muted-foreground" },
};

// Initial mock data
const initialJobs: VideoJob[] = [
  { id: "1", property: "Cobertura Duplex - Ed. Marina", client: "Construtora Alpha", address: "Av. Beira Mar, 1200", value: 1500, materialType: "vr", clientType: "construtor", status: "gravar", dueDate: "2026-04-02", notes: "Drone + interna", createdAt: "2026-03-25" },
  { id: "2", property: "Apto 3Q - Cond. Jardins", client: "Imobiliária Beta", address: "Rua das Flores, 300", value: 800, materialType: "vc", clientType: "assinante", status: "gravado", dueDate: "2026-03-30", notes: "Já gravado, aguardando edição", createdAt: "2026-03-20" },
  { id: "3", property: "Sala Comercial - Tower One", client: "JB Imóveis", address: "Av. Central, 500", value: 600, materialType: "vr360", clientType: "mv_broker", status: "editando", dueDate: "2026-03-28", notes: "Edição com tour virtual", createdAt: "2026-03-18" },
  { id: "4", property: "Casa 4Q - Cond. Alphaville", client: "RE/MAX", address: "Alameda dos Ipês, 45", value: 2000, materialType: "vc360", clientType: "particular", status: "entregue", dueDate: "2026-03-26", notes: "Entregue via Google Drive", createdAt: "2026-03-10" },
  { id: "5", property: "Loft Studio - Ed. Art Déco", client: "Exclusiva Imóveis", address: "Rua Augusta, 890", value: 500, materialType: "vcdn", clientType: "assinante", status: "enviado", dueDate: "2026-03-22", notes: "", createdAt: "2026-03-05" },
];

const initialFinance: FinanceEntry[] = [
  { id: "1", property: "Cobertura Duplex - Ed. Marina", client: "Construtora Alpha", materialType: "vr", clientType: "construtor", clientValue: 1500, editorCost: 400, status: "pendente", dueDate: "2026-04-05" },
  { id: "2", property: "Apto 3Q - Cond. Jardins", client: "Imobiliária Beta", materialType: "vc", clientType: "assinante", clientValue: 800, editorCost: 250, status: "pendente", dueDate: "2026-04-01" },
  { id: "3", property: "Sala Comercial - Tower One", client: "JB Imóveis", materialType: "vr360", clientType: "mv_broker", clientValue: 600, editorCost: 200, status: "pago", dueDate: "2026-03-28", paidAt: "2026-03-27" },
  { id: "4", property: "Casa 4Q - Cond. Alphaville", client: "RE/MAX", materialType: "vc360", clientType: "particular", clientValue: 2000, editorCost: 600, status: "pago", dueDate: "2026-03-20", paidAt: "2026-03-19" },
  { id: "5", property: "Loft Studio - Ed. Art Déco", client: "Exclusiva Imóveis", materialType: "vcdn", clientType: "assinante", clientValue: 500, editorCost: 150, status: "pago", dueDate: "2026-03-15", paidAt: "2026-03-14" },
  { id: "6", property: "Penthouse Ed. Atlântico", client: "Premium Imóveis", materialType: "vr", clientType: "construtor", clientValue: 2500, editorCost: 700, status: "pago", dueDate: "2026-02-20", paidAt: "2026-02-19" },
  { id: "7", property: "Casa Praia - Cond. Royal", client: "Royal Imóveis", materialType: "vc", clientType: "particular", clientValue: 1800, editorCost: 500, status: "pago", dueDate: "2026-02-10", paidAt: "2026-02-09" },
  { id: "8", property: "Apt 2Q - Ed. Solar", client: "Solar Imóveis", materialType: "vr360", clientType: "assinante", clientValue: 700, editorCost: 200, status: "pago", dueDate: "2026-01-25", paidAt: "2026-01-24" },
  { id: "9", property: "Sala Comercial Centro", client: "JB Imóveis", materialType: "vcdn", clientType: "mv_broker", clientValue: 550, editorCost: 180, status: "pago", dueDate: "2026-01-15", paidAt: "2026-01-14" },
];

const initialEvents: AgendaEvent[] = [
  { id: "1", title: "Gravar Cobertura Ed. Marina", date: "2026-04-02", time: "09:00", endTime: "11:00", type: "gravacao", notes: "Levar drone e gimbal", location: "Av. Beira Mar, 1200", jobId: "1" },
  { id: "2", title: "Entrega vídeo Tower One", date: "2026-03-28", time: "14:00", endTime: "15:00", type: "entrega", notes: "Enviar link do drive", location: "" },
  { id: "3", title: "Reunião com Construtora Alpha", date: "2026-03-29", time: "10:00", endTime: "11:30", type: "reuniao", notes: "Discutir pacote de 5 imóveis", location: "Escritório" },
  { id: "4", title: "Gravar Apto Jardim Europa", date: "2026-03-27", time: "08:00", endTime: "10:00", type: "gravacao", notes: "Tour virtual 360", location: "Rua Europa, 450" },
  { id: "5", title: "Editar vídeo Loft Studio", date: "2026-03-27", time: "14:00", endTime: "18:00", type: "outro", notes: "Finalizar color grading", location: "Estúdio" },
];

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

function InlineEdit({ value, onSave, type = "text", className = "", formatDisplay }: { value: string | number; onSave: (v: string) => void; type?: string; className?: string; formatDisplay?: (v: string | number) => string }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  if (!editing) {
    return (
      <span
        className={cn("cursor-pointer hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-accent/30", className)}
        onClick={() => { setEditValue(String(value)); setEditing(true); }}
        title="Clique para editar"
      >
        {formatDisplay ? formatDisplay(value) : value}
      </span>
    );
  }

  return (
    <Input
      autoFocus
      type={type}
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={() => { onSave(editValue); setEditing(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onSave(editValue); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
      className="h-7 text-xs w-auto min-w-[60px] max-w-[160px] px-1.5"
    />
  );
}

export default function VideoMaker() {
  const [jobs, setJobs] = useState<VideoJob[]>(initialJobs);
  const [finance, setFinance] = useState<FinanceEntry[]>(initialFinance);
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [searchFinance, setSearchFinance] = useState("");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<VideoJob | null>(null);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Agenda state
  const [agendaView, setAgendaView] = useState<"month" | "week">("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<Date | null>(new Date());

  // Forms
  const [newJob, setNewJob] = useState({ property: "", client: "", address: "", value: "", dueDate: "", notes: "", status: "gravar" as VideoJob["status"], materialType: "vr" as MaterialType, clientType: "assinante" as ClientType });
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", endTime: "", type: "gravacao" as AgendaEvent["type"], notes: "", location: "" });
  const [newFinance, setNewFinance] = useState({ property: "", client: "", clientValue: "", editorCost: "", dueDate: "", status: "pendente" as FinanceEntry["status"], materialType: "vr" as MaterialType, clientType: "assinante" as ClientType });

  // ====== FINANCIAL METRICS ======
  const paidEntries = finance.filter(f => f.status === "pago");
  const totalGanhos = paidEntries.reduce((s, f) => s + f.clientValue, 0);
  const totalCustos = paidEntries.reduce((s, f) => s + f.editorCost, 0);
  const totalLucro = totalGanhos - totalCustos;
  const totalPending = finance.filter(f => f.status === "pendente").reduce((s, f) => s + f.clientValue, 0);
  const totalOverdue = finance.filter(f => f.status === "atrasado").reduce((s, f) => s + f.clientValue, 0);
  const totalJobs = jobs.length;

  // Records: day, week, month
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const ganhosDia = paidEntries.filter(f => f.paidAt === todayStr).reduce((s, f) => s + f.clientValue, 0);
  const ganhosSemana = paidEntries.filter(f => f.paidAt && isThisWeek(parseISO(f.paidAt), { weekStartsOn: 0 })).reduce((s, f) => s + f.clientValue, 0);
  const ganhosMes = paidEntries.filter(f => f.paidAt && isThisMonth(parseISO(f.paidAt))).reduce((s, f) => s + f.clientValue, 0);

  // Monthly report data
  const monthlyData = (() => {
    const months: Record<string, { month: string; ganhos: number; custos: number; lucro: number; qtd: number }> = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    paidEntries.forEach(f => {
      if (!f.paidAt) return;
      const d = parseISO(f.paidAt);
      const key = format(d, "yyyy-MM");
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      if (!months[key]) months[key] = { month: label, ganhos: 0, custos: 0, lucro: 0, qtd: 0 };
      months[key].ganhos += f.clientValue;
      months[key].custos += f.editorCost;
      months[key].lucro += f.clientValue - f.editorCost;
      months[key].qtd += 1;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  })();

  const recordMes = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.ganhos)) : 0;

  // Kanban drag & drop
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDraggedJobId(jobId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", jobId);
  };
  const handleDragOver = (e: React.DragEvent, colKey: string) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverColumn(colKey); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e: React.DragEvent, newStatus: VideoJob["status"]) => {
    e.preventDefault();
    const jobId = draggedJobId || e.dataTransfer.getData("text/plain");
    if (!jobId) return;
    const job = jobs.find(j => j.id === jobId);
    if (job && job.status !== newStatus) {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      toast.success(`Movido para "${kanbanColumns.find(c => c.key === newStatus)?.label}"`);
    }
    setDraggedJobId(null);
    setDragOverColumn(null);
  };
  const handleDragEnd = () => { setDraggedJobId(null); setDragOverColumn(null); };
  const moveJob = (jobId: string, direction: "next" | "prev") => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const order: VideoJob["status"][] = ["gravar", "gravado", "editando", "entregue", "enviado"];
    const idx = order.indexOf(job.status);
    const ni = direction === "next" ? idx + 1 : idx - 1;
    if (ni < 0 || ni >= order.length) return;
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: order[ni] } : j));
    toast.success(`Movido para "${kanbanColumns[ni].label}"`);
  };

  // CRUD handlers
  const handleAddJob = () => {
    if (!newJob.property || !newJob.client) return toast.error("Preencha os campos obrigatórios");
    const job: VideoJob = { id: Date.now().toString(), property: newJob.property, client: newJob.client, address: newJob.address, value: Number(newJob.value) || 0, materialType: newJob.materialType, clientType: newJob.clientType, status: newJob.status, dueDate: newJob.dueDate, notes: newJob.notes, createdAt: new Date().toISOString().split("T")[0] };
    if (editingJob) {
      setJobs(prev => prev.map(j => j.id === editingJob.id ? { ...job, id: editingJob.id, createdAt: editingJob.createdAt } : j));
      toast.success("Trabalho atualizado!");
    } else {
      setJobs(prev => [...prev, job]);
      toast.success("Novo trabalho adicionado!");
    }
    setNewJob({ property: "", client: "", address: "", value: "", dueDate: "", notes: "", status: "gravar", materialType: "vr", clientType: "assinante" });
    setEditingJob(null);
    setJobDialogOpen(false);
  };
  const handleEditJob = (job: VideoJob) => { setEditingJob(job); setNewJob({ property: job.property, client: job.client, address: job.address, value: String(job.value), dueDate: job.dueDate, notes: job.notes, status: job.status, materialType: job.materialType, clientType: job.clientType }); setJobDialogOpen(true); };
  const handleDeleteJob = (id: string) => { setJobs(prev => prev.filter(j => j.id !== id)); toast.success("Trabalho removido!"); };

  const handleAddFinance = () => {
    if (!newFinance.property || !newFinance.client) return toast.error("Preencha os campos obrigatórios");
    const entry: FinanceEntry = { id: Date.now().toString(), property: newFinance.property, client: newFinance.client, materialType: newFinance.materialType, clientType: newFinance.clientType, clientValue: Number(newFinance.clientValue) || 0, editorCost: Number(newFinance.editorCost) || 0, status: newFinance.status, dueDate: newFinance.dueDate };
    setFinance(prev => [...prev, entry]);
    setNewFinance({ property: "", client: "", clientValue: "", editorCost: "", dueDate: "", status: "pendente", materialType: "vr", clientType: "assinante" });
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
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...editingEvent, ...newEvent } : e));
      toast.success("Evento atualizado!");
    } else {
      setEvents(prev => [...prev, { id: Date.now().toString(), ...newEvent }]);
      toast.success("Evento adicionado!");
    }
    setNewEvent({ title: "", date: "", time: "", endTime: "", type: "gravacao", notes: "", location: "" });
    setEditingEvent(null);
    setEventDialogOpen(false);
  };
  const handleEditEvent = (ev: AgendaEvent) => { setEditingEvent(ev); setNewEvent({ title: ev.title, date: ev.date, time: ev.time, endTime: ev.endTime, type: ev.type, notes: ev.notes, location: ev.location }); setEventDialogOpen(true); };
  const handleDeleteEvent = (id: string) => { setEvents(prev => prev.filter(e => e.id !== id)); toast.success("Evento removido!"); };

  const filteredFinance = finance.filter(f => f.property.toLowerCase().includes(searchFinance.toLowerCase()) || f.client.toLowerCase().includes(searchFinance.toLowerCase()));

  // Agenda helpers
  const getEventsForDate = (date: Date) => events.filter(e => e.date === format(date, "yyyy-MM-dd")).sort((a, b) => a.time.localeCompare(b.time));
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const wkStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const wkEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: wkStart, end: wkEnd });
  const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const selectedDateEvents = selectedAgendaDate ? getEventsForDate(selectedAgendaDate) : [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Clapperboard className="w-7 h-7 text-accent" /> Material Extra
            </h1>
            <p className="text-muted-foreground text-sm">Gestão de produção audiovisual, financeiro e agenda</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Ganhos</p><p className="text-base font-bold text-emerald-400">{fmtBRL(totalGanhos)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-400" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Custos Edição</p><p className="text-base font-bold text-red-400">{fmtBRL(totalCustos)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center"><DollarSign className="w-5 h-5 text-accent" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Lucro Líquido</p><p className="text-base font-bold text-accent">{fmtBRL(totalLucro)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-400" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Pendente</p><p className="text-base font-bold text-amber-400">{fmtBRL(totalPending)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center"><DollarSign className="w-5 h-5 text-red-400" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Atrasado</p><p className="text-base font-bold text-red-400">{fmtBRL(totalOverdue)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Film className="w-5 h-5 text-blue-400" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Trabalhos</p><p className="text-base font-bold text-blue-400">{totalJobs}</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-1.5"><Film className="w-4 h-4" /> Kanban</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1.5"><DollarSign className="w-4 h-4" /> Financeiro</TabsTrigger>
            <TabsTrigger value="relatorio" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Relatório</TabsTrigger>
            <TabsTrigger value="agenda" className="gap-1.5"><CalendarIcon className="w-4 h-4" /> Agenda</TabsTrigger>
          </TabsList>

          {/* ==================== KANBAN ==================== */}
          <TabsContent value="kanban" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={jobDialogOpen} onOpenChange={(o) => { setJobDialogOpen(o); if (!o) { setEditingJob(null); setNewJob({ property: "", client: "", address: "", value: "", dueDate: "", notes: "", status: "gravar", materialType: "vr", clientType: "assinante" }); } }}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Trabalho</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingJob ? "Editar Trabalho" : "Novo Trabalho"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Imóvel *</Label><Input value={newJob.property} onChange={e => setNewJob(p => ({ ...p, property: e.target.value }))} placeholder="Ex: Cobertura Ed. Marina" /></div>
                    <div><Label>Cliente *</Label><Input value={newJob.client} onChange={e => setNewJob(p => ({ ...p, client: e.target.value }))} placeholder="Ex: Construtora Alpha" /></div>
                    <div><Label>Endereço</Label><Input value={newJob.address} onChange={e => setNewJob(p => ({ ...p, address: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Tipo de Material</Label><Select value={newJob.materialType} onValueChange={v => setNewJob(p => ({ ...p, materialType: v as MaterialType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{materialTypes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Tipo de Cliente</Label><Select value={newJob.clientType} onValueChange={v => setNewJob(p => ({ ...p, clientType: v as ClientType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{clientTypes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Valor (R$)</Label><Input type="number" value={newJob.value} onChange={e => setNewJob(p => ({ ...p, value: e.target.value }))} /></div>
                      <div><Label>Prazo</Label><Input type="date" value={newJob.dueDate} onChange={e => setNewJob(p => ({ ...p, dueDate: e.target.value }))} /></div>
                    </div>
                    <div><Label>Status</Label><Select value={newJob.status} onValueChange={v => setNewJob(p => ({ ...p, status: v as VideoJob["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{kanbanColumns.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Observações</Label><Textarea value={newJob.notes} onChange={e => setNewJob(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                    <Button onClick={handleAddJob} className="w-full">{editingJob ? "Salvar Alterações" : "Adicionar Trabalho"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {kanbanColumns.map(col => {
                const colJobs = jobs.filter(j => j.status === col.key);
                const isOver = dragOverColumn === col.key;
                const statusOrder: VideoJob["status"][] = ["gravar", "gravado", "editando", "entregue", "enviado"];
                const colIdx = statusOrder.indexOf(col.key);
                return (
                  <div key={col.key} className={cn("rounded-xl p-3 min-h-[350px] border-t-[3px] border border-border/50 bg-muted/20 transition-all duration-200", col.headerBg, isOver && "bg-accent/10 border-accent/40 scale-[1.01] shadow-lg shadow-accent/10")} onDragOver={e => handleDragOver(e, col.key)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, col.key)}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                      <Badge variant="outline" className={cn("gap-1 text-xs", col.color)}>{col.icon} {col.label}</Badge>
                      <span className="text-xs font-bold text-muted-foreground ml-auto bg-muted/50 w-6 h-6 rounded-full flex items-center justify-center">{colJobs.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colJobs.map(job => (
                        <Card key={job.id} draggable onDragStart={e => handleDragStart(e, job.id)} onDragEnd={handleDragEnd} className={cn("cursor-grab active:cursor-grabbing border-border/50 hover:border-accent/40 transition-all duration-200 hover:shadow-md", draggedJobId === job.id && "opacity-40 scale-95 rotate-1")}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0"><GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" /><p className="text-sm font-medium text-foreground leading-tight truncate">{job.property}</p></div>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditJob(job)}><Edit className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteJob(job.id)}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{job.client}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", materialTypeColors[job.materialType])}>{materialTypes.find(m => m.value === job.materialType)?.label}</Badge>
                              <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", clientTypeColors[job.clientType])}>{clientTypes.find(c => c.value === job.clientType)?.label}</Badge>
                            </div>
                            {job.address && <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1"><MapPin className="w-3 h-3" />{job.address}</p>}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-semibold text-accent">{fmtBRL(job.value)}</span>
                              {job.dueDate && <span className="text-[10px] text-muted-foreground">{format(new Date(job.dueDate + "T12:00:00"), "dd/MM")}</span>}
                            </div>
                            {job.notes && <p className="text-[11px] text-muted-foreground/60 truncate">{job.notes}</p>}
                            <div className="flex gap-1 pt-1 md:hidden">
                              {colIdx > 0 && <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1 gap-0.5" onClick={() => moveJob(job.id, "prev")}><ChevronLeft className="w-3 h-3" /> {kanbanColumns[colIdx - 1].label}</Button>}
                              {colIdx < statusOrder.length - 1 && <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1 gap-0.5" onClick={() => moveJob(job.id, "next")}>{kanbanColumns[colIdx + 1].label} <ChevronRight className="w-3 h-3" /></Button>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {colJobs.length === 0 && <div className={cn("border-2 border-dashed rounded-lg p-6 text-center transition-colors", isOver ? "border-accent/50 bg-accent/5" : "border-border/30")}><p className="text-xs text-muted-foreground/50">Arraste aqui</p></div>}
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
                <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Registro</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Novo Registro Financeiro</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Imóvel *</Label><Input value={newFinance.property} onChange={e => setNewFinance(p => ({ ...p, property: e.target.value }))} /></div>
                    <div><Label>Cliente *</Label><Input value={newFinance.client} onChange={e => setNewFinance(p => ({ ...p, client: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Tipo de Material</Label><Select value={newFinance.materialType} onValueChange={v => setNewFinance(p => ({ ...p, materialType: v as MaterialType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{materialTypes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Tipo de Cliente</Label><Select value={newFinance.clientType} onValueChange={v => setNewFinance(p => ({ ...p, clientType: v as ClientType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{clientTypes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Valor Cobrado do Cliente (R$)</Label><Input type="number" value={newFinance.clientValue} onChange={e => setNewFinance(p => ({ ...p, clientValue: e.target.value }))} placeholder="1500" /></div>
                      <div><Label>Valor Pago ao Editor (R$)</Label><Input type="number" value={newFinance.editorCost} onChange={e => setNewFinance(p => ({ ...p, editorCost: e.target.value }))} placeholder="400" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Vencimento</Label><Input type="date" value={newFinance.dueDate} onChange={e => setNewFinance(p => ({ ...p, dueDate: e.target.value }))} /></div>
                      <div><Label>Status</Label><Select value={newFinance.status} onValueChange={v => setNewFinance(p => ({ ...p, status: v as FinanceEntry["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem></SelectContent></Select></div>
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
                    <TableHead>Material</TableHead>
                    <TableHead>Tipo Cliente</TableHead>
                    <TableHead>Valor Cliente</TableHead>
                    <TableHead>Custo Editor</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFinance.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                  ) : filteredFinance.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium text-foreground">
                        <InlineEdit value={f.property} onSave={v => { setFinance(prev => prev.map(x => x.id === f.id ? { ...x, property: v } : x)); toast.success("Atualizado!"); }} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <InlineEdit value={f.client} onSave={v => { setFinance(prev => prev.map(x => x.id === f.id ? { ...x, client: v } : x)); toast.success("Atualizado!"); }} />
                      </TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px]", materialTypeColors[f.materialType])}>{materialTypes.find(m => m.value === f.materialType)?.label}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px]", clientTypeColors[f.clientType])}>{clientTypes.find(c => c.value === f.clientType)?.label}</Badge></TableCell>
                      <TableCell>
                        <InlineEdit value={f.clientValue} type="number" className="font-semibold text-emerald-400" formatDisplay={v => fmtBRL(Number(v))} onSave={v => { setFinance(prev => prev.map(x => x.id === f.id ? { ...x, clientValue: Number(v) || 0 } : x)); toast.success("Atualizado!"); }} />
                      </TableCell>
                      <TableCell>
                        <InlineEdit value={f.editorCost} type="number" className="font-semibold text-red-400" formatDisplay={v => fmtBRL(Number(v))} onSave={v => { setFinance(prev => prev.map(x => x.id === f.id ? { ...x, editorCost: Number(v) || 0 } : x)); toast.success("Atualizado!"); }} />
                      </TableCell>
                      <TableCell className="font-semibold text-accent">{fmtBRL(f.clientValue - f.editorCost)}</TableCell>
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
                          <CheckCircle2 className="w-3.5 h-3.5" />{f.status === "pago" ? "Desfazer" : "Pago"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setFinance(prev => prev.filter(x => x.id !== f.id)); toast.success("Removido!"); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ==================== RELATÓRIO ==================== */}
          <TabsContent value="relatorio" className="space-y-4">
            {/* Records */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-amber-400" /><p className="text-xs text-muted-foreground uppercase font-semibold">Record do Mês</p></div>
                  <p className="text-xl font-bold text-amber-400">{fmtBRL(recordMes)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Melhor mês registrado</p>
                </CardContent>
              </Card>
              <Card className="border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-accent" /><p className="text-xs text-muted-foreground uppercase font-semibold">Ganhos Mês Atual</p></div>
                  <p className="text-xl font-bold text-accent">{fmtBRL(ganhosMes)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{format(today, "MMMM yyyy", { locale: ptBR })}</p>
                </CardContent>
              </Card>
              <Card className="border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><CalendarIcon className="w-4 h-4 text-blue-400" /><p className="text-xs text-muted-foreground uppercase font-semibold">Ganhos Semana</p></div>
                  <p className="text-xl font-bold text-blue-400">{fmtBRL(ganhosSemana)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Semana atual</p>
                </CardContent>
              </Card>
              <Card className="border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-emerald-400" /><p className="text-xs text-muted-foreground uppercase font-semibold">Ganhos Hoje</p></div>
                  <p className="text-xl font-bold text-emerald-400">{fmtBRL(ganhosDia)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{format(today, "dd/MM/yyyy")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-accent" /> Relatório Mensal</CardTitle>
                <CardDescription>Ganhos, custos e lucro por mês</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado financeiro registrado</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                        formatter={(value: number, name: string) => [fmtBRL(value), name === "ganhos" ? "Ganhos" : name === "custos" ? "Custos Edição" : "Lucro"]}
                      />
                      <Legend formatter={(value) => value === "ganhos" ? "Ganhos" : value === "custos" ? "Custos Edição" : "Lucro"} />
                      <Bar dataKey="ganhos" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="custos" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Monthly table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Detalhamento Mensal</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Trabalhos</TableHead>
                      <TableHead>Ganhos</TableHead>
                      <TableHead>Custos</TableHead>
                      <TableHead>Lucro</TableHead>
                      <TableHead>Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map(m => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium text-foreground">{m.month}</TableCell>
                        <TableCell className="text-muted-foreground">{m.qtd}</TableCell>
                        <TableCell className="font-semibold text-emerald-400">{fmtBRL(m.ganhos)}</TableCell>
                        <TableCell className="font-semibold text-red-400">{fmtBRL(m.custos)}</TableCell>
                        <TableCell className="font-semibold text-accent">{fmtBRL(m.lucro)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(m.lucro > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30")}>
                            {m.ganhos > 0 ? ((m.lucro / m.ganhos) * 100).toFixed(0) : 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 border-border font-bold">
                      <TableCell className="text-foreground">Total</TableCell>
                      <TableCell className="text-muted-foreground">{monthlyData.reduce((s, m) => s + m.qtd, 0)}</TableCell>
                      <TableCell className="text-emerald-400">{fmtBRL(monthlyData.reduce((s, m) => s + m.ganhos, 0))}</TableCell>
                      <TableCell className="text-red-400">{fmtBRL(monthlyData.reduce((s, m) => s + m.custos, 0))}</TableCell>
                      <TableCell className="text-accent">{fmtBRL(monthlyData.reduce((s, m) => s + m.lucro, 0))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                          {totalGanhos > 0 ? ((totalLucro / totalGanhos) * 100).toFixed(0) : 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== AGENDA ==================== */}
          <TabsContent value="agenda" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => agendaView === "month" ? setCurrentMonth(subMonths(currentMonth, 1)) : setCurrentWeek(subWeeks(currentWeek, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <h3 className="text-lg font-semibold text-foreground min-w-[200px] text-center">
                  {agendaView === "month" ? format(currentMonth, "MMMM yyyy", { locale: ptBR }) : `${format(wkStart, "dd MMM", { locale: ptBR })} - ${format(wkEnd, "dd MMM yyyy", { locale: ptBR })}`}
                </h3>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => agendaView === "month" ? setCurrentMonth(addMonths(currentMonth, 1)) : setCurrentWeek(addWeeks(currentWeek, 1))}><ChevronRight className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setCurrentMonth(new Date()); setCurrentWeek(new Date()); setSelectedAgendaDate(new Date()); }}>Hoje</Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button className={cn("px-3 py-1.5 text-xs font-medium transition-colors", agendaView === "month" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setAgendaView("month")}>Mês</button>
                  <button className={cn("px-3 py-1.5 text-xs font-medium transition-colors", agendaView === "week" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setAgendaView("week")}>Semana</button>
                </div>
                <Dialog open={eventDialogOpen} onOpenChange={(o) => { setEventDialogOpen(o); if (!o) { setEditingEvent(null); setNewEvent({ title: "", date: "", time: "", endTime: "", type: "gravacao", notes: "", location: "" }); } }}>
                  <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Evento</Button></DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Título *</Label><Input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label>Data *</Label><Input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} /></div>
                        <div><Label>Início</Label><Input type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} /></div>
                        <div><Label>Fim</Label><Input type="time" value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Tipo</Label><Select value={newEvent.type} onValueChange={v => setNewEvent(p => ({ ...p, type: v as AgendaEvent["type"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gravacao">Gravação</SelectItem><SelectItem value="entrega">Entrega</SelectItem><SelectItem value="reuniao">Reunião</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div>
                        <div><Label>Local</Label><Input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} /></div>
                      </div>
                      <div><Label>Observações</Label><Textarea value={newEvent.notes} onChange={e => setNewEvent(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                      <Button onClick={handleAddEvent} className="w-full">{editingEvent ? "Salvar Alterações" : "Adicionar Evento"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {agendaView === "month" && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
                <Card>
                  <CardContent className="p-2 sm:p-4">
                    <div className="grid grid-cols-7 mb-1">{weekDayNames.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
                      {monthDays.map(day => {
                        const dayEvents = getEventsForDate(day);
                        const isSelected = selectedAgendaDate && isSameDay(day, selectedAgendaDate);
                        const isCurrentMo = isSameMonth(day, currentMonth);
                        return (
                          <button key={day.toISOString()} onClick={() => setSelectedAgendaDate(day)} className={cn("min-h-[80px] p-1.5 text-left transition-colors bg-card hover:bg-accent/10 relative", !isCurrentMo && "opacity-40", isSelected && "ring-2 ring-accent ring-inset bg-accent/5", isToday(day) && "bg-accent/10")}>
                            <span className={cn("text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full", isToday(day) && "bg-accent text-accent-foreground")}>{format(day, "d")}</span>
                            <div className="mt-0.5 space-y-0.5">
                              {dayEvents.slice(0, 3).map(ev => <div key={ev.id} className={cn("text-[10px] px-1 py-0.5 rounded truncate border", eventTypeConfig[ev.type].bg)}>{ev.time && <span className="font-semibold">{ev.time} </span>}{ev.title}</div>)}
                              {dayEvents.length > 3 && <div className="text-[10px] text-muted-foreground text-center">+{dayEvents.length - 3} mais</div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{selectedAgendaDate ? format(selectedAgendaDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}</CardTitle>
                    <CardDescription>{selectedDateEvents.length} evento(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedDateEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum evento nesta data</p>
                        <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => { setNewEvent(p => ({ ...p, date: format(selectedAgendaDate!, "yyyy-MM-dd") })); setEventDialogOpen(true); }}><Plus className="w-3 h-3" /> Adicionar</Button>
                      </div>
                    ) : selectedDateEvents.map(ev => <EventCard key={ev.id} event={ev} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />)}
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Próximos Eventos</p>
                      {events.filter(e => new Date(e.date + "T12:00:00") >= new Date()).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 6).map(ev => (
                        <div key={ev.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1" onClick={() => setSelectedAgendaDate(new Date(ev.date + "T12:00:00"))}>
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", eventTypeConfig[ev.type].color)} />
                          <span className="text-xs text-muted-foreground w-10">{format(new Date(ev.date + "T12:00:00"), "dd/MM")}</span>
                          <span className="text-xs text-foreground flex-1 truncate">{ev.title}</span>
                          {ev.time && <span className="text-[10px] text-muted-foreground">{ev.time}</span>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {agendaView === "week" && (
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(day => {
                      const dayEvents = getEventsForDate(day);
                      const isSelected = selectedAgendaDate && isSameDay(day, selectedAgendaDate);
                      return (
                        <div key={day.toISOString()} className={cn("rounded-lg border border-border/50 p-2 min-h-[400px] transition-colors", isToday(day) && "border-accent/50 bg-accent/5", isSelected && "ring-2 ring-accent")}>
                          <button onClick={() => setSelectedAgendaDate(day)} className="w-full text-center mb-2">
                            <div className="text-[10px] text-muted-foreground uppercase">{weekDayNames[getDay(day)]}</div>
                            <div className={cn("text-lg font-bold mx-auto w-9 h-9 rounded-full flex items-center justify-center", isToday(day) ? "bg-accent text-accent-foreground" : "text-foreground")}>{format(day, "d")}</div>
                          </button>
                          <div className="space-y-1.5">
                            {dayEvents.map(ev => (
                              <div key={ev.id} onClick={() => handleEditEvent(ev)} className={cn("text-[11px] p-1.5 rounded border cursor-pointer hover:opacity-80 transition-opacity", eventTypeConfig[ev.type].bg)}>
                                <div className="font-semibold">{ev.time}{ev.endTime ? ` - ${ev.endTime}` : ""}</div>
                                <div className="truncate">{ev.title}</div>
                                {ev.location && <div className="flex items-center gap-0.5 text-[10px] opacity-70 mt-0.5"><MapPin className="w-2.5 h-2.5" />{ev.location}</div>}
                              </div>
                            ))}
                            {dayEvents.length === 0 && <button onClick={() => { setNewEvent(p => ({ ...p, date: format(day, "yyyy-MM-dd") })); setEventDialogOpen(true); }} className="w-full text-center py-4 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"><Plus className="w-4 h-4 mx-auto" /></button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EventCard({ event: ev, onEdit, onDelete }: { event: AgendaEvent; onEdit: (e: AgendaEvent) => void; onDelete: (id: string) => void }) {
  const cfg = eventTypeConfig[ev.type];
  return (
    <div className={cn("p-3 rounded-lg border transition-colors hover:bg-muted/20", cfg.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1"><p className="text-sm font-semibold truncate">{ev.title}</p><Badge variant="outline" className="text-[10px] flex-shrink-0">{cfg.label}</Badge></div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {ev.time && <span className="font-medium">{ev.time}{ev.endTime ? ` - ${ev.endTime}` : ""}</span>}
            {ev.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{ev.location}</span>}
          </div>
          {ev.notes && <p className="text-xs text-muted-foreground/70 mt-1.5">{ev.notes}</p>}
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(ev)}><Edit className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(ev.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

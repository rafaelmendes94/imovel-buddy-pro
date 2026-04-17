import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Plus, Trash2, FileSpreadsheet, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}

interface ManualSale {
  id: string;
  data_venda: string;
  cidade: string;
  bairro: string;
  tipo: string;
  empreendimento: string;
  edificio_condominio: string;
  valor: number;
  comissao: number;
  corretor: string;
  cliente: string;
  origem: string;
}

const COLUMNS = [
  "data_venda", "cidade", "bairro", "tipo", "empreendimento",
  "edificio_condominio", "valor", "comissao", "corretor", "cliente",
];

const COLUMN_LABELS: Record<string, string> = {
  data_venda: "Data da Venda (AAAA-MM-DD)",
  cidade: "Cidade",
  bairro: "Bairro",
  tipo: "Tipo",
  empreendimento: "Empreendimento",
  edificio_condominio: "Edifício/Condomínio",
  valor: "Valor (R$)",
  comissao: "Comissão (R$)",
  corretor: "Corretor",
  cliente: "Cliente",
};

const empty = {
  data_venda: new Date().toISOString().slice(0, 10),
  cidade: "", bairro: "", tipo: "", empreendimento: "",
  edificio_condominio: "", valor: "", comissao: "", corretor: "", cliente: "",
};

export function ManualSalesDialog({ open, onOpenChange, onChanged }: Props) {
  const [list, setList] = useState<ManualSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(empty);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vendas_manuais")
      .select("*")
      .order("data_venda", { ascending: false });
    setList((data || []) as ManualSale[]);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      data_venda: "2025-01-15", cidade: "Capão da Canoa", bairro: "Centro",
      tipo: "Apartamento", empreendimento: "Ed. Exemplo", edificio_condominio: "Ed. Exemplo",
      valor: 450000, comissao: 22500, corretor: "Nome do Corretor", cliente: "Nome do Cliente",
    }]);
    ws["!cols"] = COLUMNS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, "modelo-vendas-manuais.xlsx");
  };

  const handleAdd = async () => {
    if (!form.data_venda || !form.valor) {
      toast.error("Data e Valor são obrigatórios");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Faça login"); return; }

    const { error } = await supabase.from("vendas_manuais").insert({
      user_id: u.user.id,
      data_venda: form.data_venda,
      cidade: form.cidade,
      bairro: form.bairro,
      tipo: form.tipo,
      empreendimento: form.empreendimento,
      edificio_condominio: form.edificio_condominio,
      valor: Number(form.valor) || 0,
      comissao: Number(form.comissao) || 0,
      corretor: form.corretor,
      cliente: form.cliente,
      origem: "manual",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Venda manual adicionada");
    setForm(empty);
    await load();
    onChanged();
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { toast.error("Faça login"); return; }

      const payload = rows
        .filter(r => r.data_venda && r.valor)
        .map(r => ({
          user_id: u.user!.id,
          data_venda: typeof r.data_venda === "number"
            ? new Date(Math.round((r.data_venda - 25569) * 86400 * 1000)).toISOString().slice(0, 10)
            : String(r.data_venda).slice(0, 10),
          cidade: String(r.cidade || ""),
          bairro: String(r.bairro || ""),
          tipo: String(r.tipo || ""),
          empreendimento: String(r.empreendimento || ""),
          edificio_condominio: String(r.edificio_condominio || ""),
          valor: Number(r.valor) || 0,
          comissao: Number(r.comissao) || 0,
          corretor: String(r.corretor || ""),
          cliente: String(r.cliente || ""),
          origem: "planilha",
        }));

      if (payload.length === 0) { toast.error("Nenhuma linha válida (precisa data_venda e valor)"); return; }

      const { error } = await supabase.from("vendas_manuais").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(`${payload.length} venda(s) importada(s)`);
      await load();
      onChanged();
    } catch (e: any) {
      toast.error("Erro ao ler planilha: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta venda?")) return;
    await supabase.from("vendas_manuais").delete().eq("id", id);
    toast.success("Excluída");
    await load();
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" /> Vendas Manuais (Dados Históricos)
          </DialogTitle>
          <DialogDescription>
            Inclua vendas passadas sem precisar cadastrar o imóvel. Marcadas como
            <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-900 border-amber-300">Manual</Badge>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-1" /> Upload Planilha</TabsTrigger>
            <TabsTrigger value="manual"><Plus className="w-4 h-4 mr-1" /> Adicionar Manual</TabsTrigger>
            <TabsTrigger value="list"><FileSpreadsheet className="w-4 h-4 mr-1" /> Registros ({list.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <div className="rounded-lg border-2 border-dashed p-6 text-center bg-muted/20">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Faça upload de uma planilha .xlsx ou .csv</p>
              <p className="text-xs text-muted-foreground mb-4">
                Colunas esperadas: {COLUMNS.join(", ")}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-1" /> Baixar modelo
                </Button>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button asChild size="sm" disabled={importing}>
                    <span><Upload className="w-4 h-4 mr-1" /> {importing ? "Importando..." : "Selecionar planilha"}</span>
                  </Button>
                  <input
                    id="file-upload" type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }}
                  />
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              {COLUMNS.map(col => (
                <div key={col}>
                  <Label className="text-xs">{COLUMN_LABELS[col]}</Label>
                  <Input
                    type={col === "data_venda" ? "date" : col === "valor" || col === "comissao" ? "number" : "text"}
                    value={(form as any)[col]}
                    onChange={e => setForm({ ...form, [col]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleAdd} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Adicionar venda
            </Button>
          </TabsContent>

          <TabsContent value="list" className="pt-4">
            {loading ? <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p> :
              list.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">Nenhuma venda manual cadastrada</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs">{new Date(v.data_venda).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-xs">{v.cidade}</TableCell>
                        <TableCell className="text-xs">{v.empreendimento || v.edificio_condominio}</TableCell>
                        <TableCell className="text-xs font-semibold">R$ {Number(v.valor).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300">
                            {v.origem === "planilha" ? "Planilha" : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

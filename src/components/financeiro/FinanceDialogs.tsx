import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FinPlan, FinSubscriber } from "@/hooks/useFinanceData";
import { CANCEL_REASONS, CYCLE_LABEL, PAYMENT_METHODS, formatCurrency, isoDate, normalizeCycle } from "@/lib/finance";
import { format } from "date-fns";

const today = () => isoDate(new Date());
const currentCompetence = () => format(new Date(), "yyyy-MM");

export function ManualPaymentDialog({
  open, onOpenChange, subscribers, defaultSubscriberId, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscribers: FinSubscriber[];
  defaultSubscriberId?: string;
  onSubmit: (input: any) => Promise<void>;
}) {
  const [subscriberId, setSubscriberId] = useState(defaultSubscriberId || "");
  const [amount, setAmount] = useState("");
  const [competence, setCompetence] = useState(currentCompetence());
  const [paidAt, setPaidAt] = useState(today());
  const [method, setMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const [courtesy, setCourtesy] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Cliente</Label>
            <Select value={subscriberId} onValueChange={setSubscriberId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {subscribers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Competência</Label>
              <Input type="month" value={competence} onChange={(e) => setCompetence(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data do pagamento</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Forma</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
            <div>
              <p className="text-sm font-medium">Cortesia / isenção</p>
              <p className="text-xs text-muted-foreground">Não conta como inadimplência</p>
            </div>
            <Switch checked={courtesy} onCheckedChange={setCourtesy} />
          </div>
          <Textarea placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !subscriberId || (!courtesy && !amount)}
            onClick={async () => {
              setSaving(true);
              await onSubmit({
                subscriber_id: subscriberId,
                amount: parseFloat(amount || "0"),
                competence,
                paid_at: paidAt,
                method,
                notes,
                is_courtesy: courtesy,
              });
              setSaving(false);
              onOpenChange(false);
            }}
          >
            {saving ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChargeDialog({
  open, onOpenChange, subscriber, defaultAmount, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriber: FinSubscriber | null;
  defaultAmount: number;
  onSubmit: (amount: number, dueDate: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(defaultAmount || ""));
  const [dueDate, setDueDate] = useState(today());
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) { setAmount(String(defaultAmount || "")); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Gerar cobrança</DialogTitle>
          <DialogDescription>{subscriber?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Valor (R$)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Vencimento</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !amount}
            onClick={async () => {
              setSaving(true);
              await onSubmit(parseFloat(amount), dueDate);
              setSaving(false);
              onOpenChange(false);
            }}
          >
            {saving ? "Salvando..." : "Gerar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriberEditDialog({
  open, onOpenChange, subscriber, plans, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriber: FinSubscriber | null;
  plans: FinPlan[];
  onSubmit: (patch: Record<string, any>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const value = (k: string, fallback: any = "") => (form[k] !== undefined ? form[k] : (subscriber as any)?.[k] ?? fallback);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setForm({}); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Editar assinante</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto">
          <Input placeholder="Nome" value={value("name")} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Telefone" value={value("phone")} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="CRECI" value={value("creci")} onChange={(e) => setForm((p) => ({ ...p, creci: e.target.value }))} />
          </div>
          <Input placeholder="E-mail" value={value("email")} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="CPF/CNPJ" value={value("document")} onChange={(e) => setForm((p) => ({ ...p, document: e.target.value }))} />
            <Input placeholder="Cidade" value={value("city")} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={value("subscriber_type", "corretor")} onValueChange={(v) => setForm((p) => ({ ...p, subscriber_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                  <SelectItem value="corretor">Corretor autônomo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Plano</Label>
              <Select value={value("plan_id") || ""} onValueChange={(v) => {
                const plan = plans.find((p) => p.id === v);
                setForm((p) => ({ ...p, plan_id: v, plan: plan?.billing_cycle || p.plan }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {plans.filter((p) => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)} / {CYCLE_LABEL[normalizeCycle(p.billing_cycle)]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Próximo vencimento</Label>
              <Input type="date" value={value("next_due_date") || ""} onChange={(e) => setForm((p) => ({ ...p, next_due_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Dia de vencimento</Label>
              <Input type="number" min={1} max={28} value={value("due_day", 5)} onChange={(e) => setForm((p) => ({ ...p, due_day: parseInt(e.target.value || "5") }))} />
            </div>
          </div>
          <Textarea placeholder="Observações" value={value("notes")} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSubmit(form);
              setSaving(false);
              onOpenChange(false);
              setForm({});
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CancelDialog({
  open, onOpenChange, subscriber, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriber: FinSubscriber | null;
  onSubmit: (reason: string, note: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancelar assinatura</DialogTitle>
          <DialogDescription>{subscriber?.name} · o histórico é preservado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Motivo do cancelamento" /></SelectTrigger>
            <SelectContent>
              {CANCEL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea placeholder="Detalhes (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={saving || !reason}
            onClick={async () => {
              setSaving(true);
              await onSubmit(reason, note);
              setSaving(false);
              onOpenChange(false);
            }}
          >
            {saving ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NoteDialog({
  open, onOpenChange, subscriber, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriber: FinSubscriber | null;
  onSubmit: (notes: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) setText(subscriber?.notes || ""); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Observações</DialogTitle></DialogHeader>
        <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSubmit(text);
              setSaving(false);
              onOpenChange(false);
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

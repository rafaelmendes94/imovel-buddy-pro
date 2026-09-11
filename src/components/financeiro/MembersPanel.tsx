import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinMember } from "@/hooks/useFinanceData";
import { MEMBER_ROLES, formatDateTime, waLink } from "@/lib/finance";
import { MoreVertical, Plus, UserPlus } from "lucide-react";

interface Props {
  subscriberId: string;
  members: FinMember[];
  onSave: (subscriberId: string, member: Partial<FinMember> & { name: string }) => Promise<void>;
  onRemove: (m: FinMember) => Promise<void>;
  onStatus: (m: FinMember, status: string) => Promise<void>;
}

const roleLabel = (v: string) => MEMBER_ROLES.find((r) => r.value === v)?.label || "Corretor";

export function MembersPanel({ subscriberId, members, onSave, onRemove, onStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<FinMember> & { name: string }>({ name: "", member_role: "broker", status: "active" });
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing({ name: "", member_role: "broker", status: "active" });
    setOpen(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Usuários vinculados ({members.length})
        </p>
        <Button size="sm" variant="outline" onClick={openNew}>
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Adicionar
        </Button>
      </div>

      {members.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário vinculado.</p>}

      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
          <Avatar className="w-9 h-9">
            <AvatarImage src={m.avatar_url || undefined} />
            <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
              <Badge variant="outline" className="text-[10px]">{roleLabel(m.member_role)}</Badge>
              {m.status === "blocked" && <Badge variant="outline" className="text-[10px] bg-slate-200">Bloqueado</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {[m.creci && `CRECI ${m.creci}`, m.phone, m.email].filter(Boolean).join(" · ") || "Sem contato"}
            </p>
            <p className="text-[11px] text-muted-foreground">Último acesso: {formatDateTime(m.last_access_at)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {waLink(m.phone) && (
              <Button size="sm" variant="ghost" asChild>
                <a href={waLink(m.phone)!} target="_blank" rel="noreferrer">WhatsApp</a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditing(m); setOpen(true); }}>Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatus(m, m.status === "blocked" ? "active" : "blocked")}>
                  {m.status === "blocked" ? "Liberar acesso" : "Bloquear acesso"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRemove(m)} className="text-destructive">
                  Retirar do grupo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing.id ? "Editar usuário" : "Adicionar usuário"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Telefone / WhatsApp" value={editing.phone || ""} onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))} />
              <Input placeholder="CRECI" value={editing.creci || ""} onChange={(e) => setEditing((p) => ({ ...p, creci: e.target.value }))} />
            </div>
            <Input placeholder="E-mail" value={editing.email || ""} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={editing.member_role || "broker"} onValueChange={(v) => setEditing((p) => ({ ...p, member_role: v }))}>
                <SelectTrigger><SelectValue placeholder="Função" /></SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={editing.status || "active"} onValueChange={(v) => setEditing((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="URL da foto (opcional)" value={editing.avatar_url || ""} onChange={(e) => setEditing((p) => ({ ...p, avatar_url: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button
              disabled={saving || !editing.name}
              onClick={async () => {
                setSaving(true);
                await onSave(subscriberId, editing);
                setSaving(false);
                setOpen(false);
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

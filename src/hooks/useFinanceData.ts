import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isoDate, nextDueDate, toDate } from "@/lib/finance";

export interface FinSubscriber {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creci: string | null;
  plan: string;
  status: string;
  notes: string | null;
  created_at: string;
  plan_id: string | null;
  subscriber_type: string;
  owner_user_id: string | null;
  due_day: number | null;
  next_due_date: string | null;
  start_date: string | null;
  document: string | null;
  city: string | null;
  blocked_at: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
}

export interface FinPayment {
  id: string;
  subscriber_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  reference_month: string;
  created_at: string;
  competence: string | null;
  method: string | null;
  paid_by: string | null;
  paid_by_name: string | null;
  notes: string | null;
  discount_amount: number | null;
  is_courtesy: boolean | null;
}

export interface FinMember {
  id: string;
  subscriber_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creci: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
  member_role: string;
  avatar_url: string | null;
  last_access_at: string | null;
  previous_status: string | null;
}

export interface FinPlan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  plan_type: string;
  is_active: boolean;
  max_brokers: number;
  discount_percent: number | null;
  description: string | null;
  notes: string | null;
}

export interface FinLog {
  id: string;
  subscriber_id: string;
  payment_id: string | null;
  event_type: string;
  description: string;
  metadata: any;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
}

export function useFinanceData() {
  const [subscribers, setSubscribers] = useState<FinSubscriber[]>([]);
  const [payments, setPayments] = useState<FinPayment[]>([]);
  const [members, setMembers] = useState<FinMember[]>([]);
  const [plans, setPlans] = useState<FinPlan[]>([]);
  const [logs, setLogs] = useState<FinLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actor, setActor] = useState<{ id: string | null; name: string }>({ id: null, name: "Administrador" });

  const fetchAll = useCallback(async () => {
    const [subRes, payRes, memRes, planRes, logRes, userRes] = await Promise.all([
      supabase.from("subscribers").select("*").order("name"),
      supabase.from("payments").select("*").order("due_date", { ascending: false }),
      supabase.from("subscriber_brokers").select("*").order("name"),
      supabase.from("plans").select("*").order("plan_type").order("price"),
      supabase.from("financial_activity_logs").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.auth.getUser(),
    ]);
    setSubscribers((subRes.data as any[]) || []);
    setPayments((payRes.data as any[]) || []);
    setMembers((memRes.data as any[]) || []);
    setPlans((planRes.data as any[]) || []);
    setLogs((logRes.data as any[]) || []);
    const u = userRes.data?.user;
    if (u) {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", u.id).maybeSingle();
      setActor({ id: u.id, name: (prof as any)?.full_name || u.email || "Administrador" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const logEvent = useCallback(
    async (
      subscriberId: string,
      eventType: string,
      description: string,
      metadata: Record<string, any> = {},
      paymentId?: string | null,
    ) => {
      await supabase.from("financial_activity_logs").insert({
        subscriber_id: subscriberId,
        payment_id: paymentId ?? null,
        event_type: eventType,
        description,
        metadata,
        actor_id: actor.id,
        actor_name: actor.name,
      } as any);
    },
    [actor],
  );

  const planOf = useCallback(
    (sub: FinSubscriber) => plans.find((p) => p.id === sub.plan_id) || null,
    [plans],
  );

  const cycleOf = useCallback(
    (sub: FinSubscriber) => planOf(sub)?.billing_cycle || sub.plan || "monthly",
    [planOf],
  );

  /** Pagamento com 1 clique. Gera apenas a próxima cobrança. */
  const confirmPayment = useCallback(
    async (payment: FinPayment, sub: FinSubscriber, opts?: { method?: string; notes?: string }) => {
      const paidAt = new Date().toISOString();
      await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: paidAt,
          method: opts?.method ?? null,
          notes: opts?.notes ?? null,
          paid_by: actor.id,
          paid_by_name: actor.name,
        } as any)
        .eq("id", payment.id);

      const cycle = cycleOf(sub);
      const base = toDate(payment.due_date) || new Date();
      const next = nextDueDate(base, cycle);
      const nextIso = isoDate(next);
      const nextCompetence = isoDate(new Date(next.getFullYear(), next.getMonth(), 1));

      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("subscriber_id", sub.id)
        .eq("due_date", nextIso)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("payments").insert({
          subscriber_id: sub.id,
          amount: payment.amount,
          due_date: nextIso,
          status: "pending",
          reference_month: nextCompetence,
          competence: nextCompetence,
        } as any);
      }

      await supabase
        .from("subscribers")
        .update({ next_due_date: nextIso, status: sub.status === "blocked" ? "blocked" : "active" } as any)
        .eq("id", sub.id);

      await logEvent(
        sub.id,
        "payment_registered",
        `Pagamento registrado de R$ ${Number(payment.amount).toFixed(2)}`,
        { amount: payment.amount, competence: payment.competence || payment.due_date, method: opts?.method || null },
        payment.id,
      );
      await fetchAll();
    },
    [actor, cycleOf, fetchAll, logEvent],
  );

  const registerManualPayment = useCallback(
    async (input: {
      subscriber_id: string;
      amount: number;
      competence: string;
      paid_at: string;
      method: string;
      notes?: string;
      is_courtesy?: boolean;
      discount_amount?: number;
    }) => {
      const competenceIso = `${input.competence}-01`;
      await supabase.from("payments").insert({
        subscriber_id: input.subscriber_id,
        amount: input.amount,
        due_date: input.paid_at,
        paid_at: input.is_courtesy ? input.paid_at : new Date(`${input.paid_at}T12:00:00`).toISOString(),
        status: input.is_courtesy ? "courtesy" : "paid",
        reference_month: competenceIso,
        competence: competenceIso,
        method: input.method,
        notes: input.notes || null,
        is_courtesy: !!input.is_courtesy,
        discount_amount: input.discount_amount || 0,
        paid_by: actor.id,
        paid_by_name: actor.name,
      } as any);
      await logEvent(
        input.subscriber_id,
        input.is_courtesy ? "courtesy" : "payment_registered",
        input.is_courtesy
          ? `Cortesia/isenção lançada (${input.competence})`
          : `Pagamento manual de R$ ${input.amount.toFixed(2)} (${input.competence})`,
        input as any,
      );
      await fetchAll();
    },
    [actor, fetchAll, logEvent],
  );

  const createCharge = useCallback(
    async (sub: FinSubscriber, amount: number, dueDate: string) => {
      const competence = `${dueDate.slice(0, 7)}-01`;
      await supabase.from("payments").insert({
        subscriber_id: sub.id,
        amount,
        due_date: dueDate,
        status: "pending",
        reference_month: competence,
        competence,
      } as any);
      await supabase.from("subscribers").update({ next_due_date: dueDate } as any).eq("id", sub.id);
      await logEvent(sub.id, "charge_created", `Cobrança criada de R$ ${amount.toFixed(2)} para ${dueDate}`, { amount, dueDate });
      await fetchAll();
    },
    [fetchAll, logEvent],
  );

  /** Bloqueia/libera o titular e todos os vinculados, preservando os dados. */
  const setGroupBlocked = useCallback(
    async (sub: FinSubscriber, blocked: boolean) => {
      if (blocked) {
        const group = members.filter((m) => m.subscriber_id === sub.id);
        await Promise.all(
          group.map((m) =>
            supabase
              .from("subscriber_brokers")
              .update({ previous_status: m.status === "blocked" ? m.previous_status || "active" : m.status, status: "blocked" } as any)
              .eq("id", m.id),
          ),
        );
        await supabase
          .from("subscribers")
          .update({ status: "blocked", blocked_at: new Date().toISOString() } as any)
          .eq("id", sub.id);
      } else {
        const group = members.filter((m) => m.subscriber_id === sub.id);
        await Promise.all(
          group.map((m) =>
            supabase
              .from("subscriber_brokers")
              .update({ status: m.previous_status || "active", previous_status: null } as any)
              .eq("id", m.id),
          ),
        );
        await supabase.from("subscribers").update({ status: "active", blocked_at: null } as any).eq("id", sub.id);
      }

      // Reflete no acesso ao sistema (conta-mãe + vinculados herdam via agency_id)
      if (sub.owner_user_id) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id,status")
          .eq("user_id", sub.owner_user_id)
          .order("created_at", { ascending: false })
          .limit(1);
        const target = subs?.[0] as any;
        if (target) {
          await supabase
            .from("subscriptions")
            .update(
              blocked
                ? ({ status: "blocked", blocked_at: new Date().toISOString() } as any)
                : ({ status: "active", blocked_at: null } as any),
            )
            .eq("id", target.id);
        }
      }

      await logEvent(
        sub.id,
        blocked ? "blocked" : "unblocked",
        blocked ? "Acesso bloqueado (titular e vinculados)" : "Acesso liberado (titular e vinculados)",
      );
      await fetchAll();
    },
    [fetchAll, logEvent, members],
  );

  const updateSubscriber = useCallback(
    async (sub: FinSubscriber, patch: Record<string, any>, description?: string, eventType = "updated") => {
      await supabase.from("subscribers").update(patch as any).eq("id", sub.id);
      await logEvent(sub.id, eventType, description || "Cadastro atualizado", patch);
      await fetchAll();
    },
    [fetchAll, logEvent],
  );

  const cancelSubscription = useCallback(
    async (sub: FinSubscriber, reason: string, note?: string) => {
      await supabase
        .from("subscribers")
        .update({ status: "cancelled", cancel_reason: reason, cancelled_at: new Date().toISOString() } as any)
        .eq("id", sub.id);
      await logEvent(sub.id, "cancelled", `Assinatura cancelada — motivo: ${reason}`, { reason, note });
      await fetchAll();
    },
    [fetchAll, logEvent],
  );

  const upsertMember = useCallback(
    async (subscriberId: string, member: Partial<FinMember> & { name: string }) => {
      if (member.id) {
        await supabase.from("subscriber_brokers").update(member as any).eq("id", member.id);
        await logEvent(subscriberId, "member_updated", `Usuário atualizado: ${member.name}`, member as any);
      } else {
        await supabase.from("subscriber_brokers").insert({ ...member, subscriber_id: subscriberId } as any);
        await logEvent(subscriberId, "member_added", `Usuário vinculado: ${member.name}`, member as any);
      }
      await fetchAll();
    },
    [fetchAll, logEvent],
  );

  const removeMember = useCallback(
    async (member: FinMember) => {
      await supabase.from("subscriber_brokers").delete().eq("id", member.id);
      await logEvent(member.subscriber_id, "member_removed", `Usuário removido do grupo: ${member.name}`);
      await fetchAll();
    },
    [fetchAll, logEvent],
  );

  const setMemberStatus = useCallback(
    async (member: FinMember, status: string) => {
      await supabase.from("subscriber_brokers").update({ status } as any).eq("id", member.id);
      await logEvent(
        member.subscriber_id,
        status === "blocked" ? "member_blocked" : "member_unblocked",
        `${member.name}: acesso ${status === "blocked" ? "bloqueado" : "liberado"}`,
      );
      await fetchAll();
    },
    [fetchAll, logEvent],
  );

  return {
    subscribers,
    payments,
    members,
    plans,
    logs,
    loading,
    actor,
    fetchAll,
    planOf,
    cycleOf,
    logEvent,
    confirmPayment,
    registerManualPayment,
    createCharge,
    setGroupBlocked,
    updateSubscriber,
    cancelSubscription,
    upsertMember,
    removeMember,
    setMemberStatus,
  };
}

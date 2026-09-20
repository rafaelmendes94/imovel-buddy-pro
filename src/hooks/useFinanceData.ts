import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isoDate, nextDueDate, toDate } from "@/lib/finance";

export interface FinSubscriber {
  id: string;
  source?: "legacy" | "subscription" | "profile";
  subscription_id?: string | null;
  legacy_subscriber_id?: string | null;
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
  source?: "legacy" | "subscription" | "synthetic";
  subscription_payment_id?: string | null;
  subscription_id?: string | null;
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
    const [subRes, payRes, memRes, planRes, logRes, userRes, realSubRes, realPayRes, clientProfilesRes] = await Promise.all([
      supabase.from("subscribers").select("*").order("name"),
      supabase.from("payments").select("*").order("due_date", { ascending: false }),
      supabase.from("subscriber_brokers").select("*").order("name"),
      supabase.from("plans").select("*").order("plan_type").order("price"),
      supabase.from("financial_activity_logs").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.auth.getUser(),
      supabase.from("subscriptions").select("*, plans(*)").order("created_at", { ascending: false }),
      supabase.from("subscription_payments").select("*").order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, account_type, created_at, approval_status, rejection_reason")
        .in("account_type", ["corretor", "imobiliaria"]),
    ]);

    const legacySubscribers = ((subRes.data as any[]) || []).map((sub) => ({ ...sub, source: "legacy" as const }));
    const legacyPayments = ((payRes.data as any[]) || []).map((payment) => ({
      ...payment,
      source: "legacy" as const,
      subscription_payment_id: null,
      subscription_id: null,
    }));
    const plansData = (planRes.data as FinPlan[]) || [];
    const realSubscriptions = (realSubRes.data as any[]) || [];
    const realPayments = (realPayRes.data as any[]) || [];
    const userIds = [...new Set(realSubscriptions.map((sub) => sub.user_id).filter(Boolean))];
    const { data: profilesData } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, email, phone, account_type, created_at, approval_status, rejection_reason")
          .in("user_id", userIds)
      : { data: [] as any[] };

    const profileByUser = new Map(((profilesData as any[]) || []).map((profile) => [profile.user_id, profile]));
    const legacyByOwner = new Map(
      legacySubscribers
        .filter((sub) => sub.owner_user_id)
        .map((sub) => [sub.owner_user_id as string, sub]),
    );
    const visibleIdBySubscription = new Map<string, string>();
    const planById = new Map(plansData.map((plan) => [plan.id, plan]));

    const subscriptionSubscribers: FinSubscriber[] = realSubscriptions.map((sub) => {
      const profile = profileByUser.get(sub.user_id) || {};
      const plan = sub.plans || planById.get(sub.plan_id) || {};
      const legacy = legacyByOwner.get(sub.user_id);
      const visibleId = legacy?.id || sub.id;
      visibleIdBySubscription.set(sub.id, visibleId);
      return {
        id: visibleId,
        source: "subscription",
        subscription_id: sub.id,
        legacy_subscriber_id: legacy?.id || null,
        name: profile.full_name || legacy?.name || profile.email || "Cliente sem nome",
        email: profile.email || legacy?.email || null,
        phone: profile.phone || legacy?.phone || null,
        creci: legacy?.creci || null,
        plan: plan.billing_cycle || legacy?.plan || "monthly",
        status: sub.status,
        notes: legacy?.notes || null,
        created_at: sub.created_at,
        plan_id: sub.plan_id || null,
        subscriber_type: profile.account_type || legacy?.subscriber_type || plan.plan_type || "corretor",
        owner_user_id: sub.user_id,
        due_day: legacy?.due_day || (sub.current_period_end ? new Date(sub.current_period_end).getDate() : null),
        next_due_date: sub.current_period_end ? sub.current_period_end.slice(0, 10) : null,
        start_date: sub.current_period_start ? sub.current_period_start.slice(0, 10) : sub.created_at?.slice(0, 10) || null,
        document: legacy?.document || null,
        city: legacy?.city || null,
        blocked_at: sub.blocked_at || null,
        cancel_reason: legacy?.cancel_reason || null,
        cancelled_at: sub.status === "cancelled" ? sub.current_period_end || null : legacy?.cancelled_at || null,
      };
    });

    const subscribedUserIds = new Set(realSubscriptions.map((sub) => sub.user_id).filter(Boolean));
    const legacyOwnerIds = new Set(legacySubscribers.map((sub) => sub.owner_user_id).filter(Boolean));
    const profileSubscribers: FinSubscriber[] = (((clientProfilesRes.data as any[]) || [])
      .filter((profile) => profile.user_id && !subscribedUserIds.has(profile.user_id) && !legacyOwnerIds.has(profile.user_id))
      .map((profile) => ({
        id: profile.user_id,
        source: "profile" as const,
        subscription_id: null,
        legacy_subscriber_id: null,
        name: profile.full_name || profile.email || "Cliente sem nome",
        email: profile.email || null,
        phone: profile.phone || null,
        creci: null,
        plan: "monthly",
        status:
          profile.approval_status === "pending"
            ? "pending_approval"
            : profile.approval_status === "rejected" && String(profile.rejection_reason || "").startsWith("Cancelado:")
              ? "cancelled"
              : profile.approval_status === "rejected"
                ? "blocked"
                : "without_plan",
        notes: null,
        created_at: profile.created_at,
        plan_id: null,
        subscriber_type: profile.account_type || "corretor",
        owner_user_id: profile.user_id,
        due_day: null,
        next_due_date: null,
        start_date: profile.created_at?.slice(0, 10) || null,
        document: null,
        city: null,
        blocked_at: null,
        cancel_reason: profile.approval_status === "rejected" ? profile.rejection_reason || "Cadastro recusado" : null,
        cancelled_at: null,
      })));

    const realPaymentRows: FinPayment[] = realPayments.map((payment) => {
      const sub = realSubscriptions.find((item) => item.id === payment.subscription_id);
      const dueDate = payment.paid_at || sub?.current_period_end || payment.created_at;
      return {
        id: payment.id,
        source: "subscription",
        subscription_payment_id: payment.id,
        subscription_id: payment.subscription_id,
        subscriber_id: visibleIdBySubscription.get(payment.subscription_id) || payment.subscription_id,
        amount: Number(payment.amount) || 0,
        due_date: dueDate.slice(0, 10),
        paid_at: payment.paid_at,
        status: payment.status === "approved" ? "paid" : payment.status,
        reference_month: payment.reference_period?.length === 7 ? `${payment.reference_period}-01` : payment.reference_period || dueDate.slice(0, 10),
        created_at: payment.created_at,
        competence: payment.reference_period?.length === 7 ? `${payment.reference_period}-01` : payment.reference_period || null,
        method: payment.asaas_payment_id ? "asaas" : payment.mercado_pago_payment_id ? "mercado_pago" : null,
        paid_by: null,
        paid_by_name: payment.asaas_payment_id ? "Asaas" : payment.mercado_pago_payment_id ? "Mercado Pago" : null,
        notes: null,
        discount_amount: 0,
        is_courtesy: false,
      };
    });

    const realPaymentKeys = new Set(realPaymentRows.map((payment) => `${payment.subscription_id}:${payment.reference_month?.slice(0, 7)}`));
    const syntheticPayments: FinPayment[] = subscriptionSubscribers
      .filter((sub) => sub.subscription_id && sub.status !== "cancelled")
      .map((sub) => {
        const dueDate = sub.next_due_date || new Date().toISOString().slice(0, 10);
        const referenceMonth = `${dueDate.slice(0, 7)}-01`;
        if (realPaymentKeys.has(`${sub.subscription_id}:${dueDate.slice(0, 7)}`)) return null;
        const plan = plansData.find((item) => item.id === sub.plan_id);
        return {
          id: `due:${sub.subscription_id}:${dueDate}`,
          source: "synthetic" as const,
          subscription_payment_id: null,
          subscription_id: sub.subscription_id,
          subscriber_id: sub.id,
          amount: Number(plan?.price) || 0,
          due_date: dueDate,
          paid_at: null,
          status: ["overdue", "blocked"].includes(sub.status) ? "overdue" : "pending",
          reference_month: referenceMonth,
          created_at: dueDate,
          competence: referenceMonth,
          method: null,
          paid_by: null,
          paid_by_name: null,
          notes: null,
          discount_amount: 0,
          is_courtesy: false,
        };
      })
      .filter(Boolean) as FinPayment[];

    const realUserIds = new Set(realSubscriptions.map((sub) => sub.user_id).filter(Boolean));
    const subscribersData = [
      ...subscriptionSubscribers,
      ...profileSubscribers,
      ...legacySubscribers.filter((sub) => !sub.owner_user_id || !realUserIds.has(sub.owner_user_id)),
    ];
    const paymentsData = [...realPaymentRows, ...syntheticPayments, ...legacyPayments].sort((a, b) =>
      a.due_date < b.due_date ? 1 : -1,
    );

    setSubscribers(subscribersData);
    setPayments(paymentsData);
    setMembers((memRes.data as any[]) || []);
    setPlans(plansData);
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
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(subscriberId)) {
        return;
      }
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

  const subscriptionIdOf = (sub: FinSubscriber) => sub.subscription_id || (sub.source === "subscription" ? sub.id : null);

  const createOrUpdateSubscription = useCallback(
    async (sub: FinSubscriber, planId: string, nextDueDate?: string | null) => {
      if (!sub.owner_user_id) return null;

      const { data: subscriptionId, error } = await supabase.rpc("create_trial_subscription", {
        _user_id: sub.owner_user_id,
        _plan_id: planId,
      });
      if (error) throw error;

      const patch: Record<string, any> = {};
      if (nextDueDate) patch.current_period_end = `${nextDueDate}T12:00:00`;
      if (Object.keys(patch).length && subscriptionId) {
        await supabase.from("subscriptions").update(patch as any).eq("id", subscriptionId as string);
      }

      await supabase
        .from("profiles")
        .update({ approval_status: "approved", approved_at: new Date().toISOString(), approved_by: actor.id } as any)
        .eq("user_id", sub.owner_user_id);

      return subscriptionId as string | null;
    },
    [actor.id],
  );

  const advanceSubscription = useCallback(
    async (sub: FinSubscriber, baseDate: string, amount: number, paidAt: string, paymentId?: string) => {
      const subscriptionId = subscriptionIdOf(sub);
      if (!subscriptionId) return;

      const base = toDate(baseDate) || new Date();
      const next = nextDueDate(base, cycleOf(sub));
      const nextIso = next.toISOString();
      const referencePeriod = baseDate.slice(0, 7);

      if (paymentId && !paymentId.startsWith("due:")) {
        await supabase
          .from("subscription_payments")
          .update({ status: "approved", paid_at: paidAt } as any)
          .eq("id", paymentId);
      } else {
        await supabase.from("subscription_payments").insert({
          subscription_id: subscriptionId,
          amount,
          status: "approved",
          paid_at: paidAt,
          reference_period: referencePeriod,
        } as any);
      }

      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          blocked_at: null,
          current_period_start: paidAt,
          current_period_end: nextIso,
        } as any)
        .eq("id", subscriptionId);
    },
    [cycleOf],
  );

  /** Pagamento com 1 clique. Gera apenas a próxima cobrança. */
  const confirmPayment = useCallback(
    async (payment: FinPayment, sub: FinSubscriber, opts?: { method?: string; notes?: string }) => {
      const paidAt = new Date().toISOString();
      if (sub.source === "subscription" || payment.source === "subscription" || payment.source === "synthetic") {
        await advanceSubscription(sub, payment.due_date, Number(payment.amount) || 0, paidAt, payment.subscription_payment_id || payment.id);
        if (sub.legacy_subscriber_id) {
          await supabase
            .from("subscribers")
            .update({ next_due_date: isoDate(nextDueDate(toDate(payment.due_date) || new Date(), cycleOf(sub))), status: "active", blocked_at: null } as any)
            .eq("id", sub.legacy_subscriber_id);
        }
        await logEvent(
          sub.legacy_subscriber_id || sub.id,
          "payment_registered",
          `Pagamento registrado de R$ ${Number(payment.amount).toFixed(2)}`,
          { amount: payment.amount, competence: payment.competence || payment.due_date, method: opts?.method || "asaas/manual" },
          null,
        );
        await fetchAll();
        return;
      }

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
    [actor, advanceSubscription, cycleOf, fetchAll, logEvent],
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
      const sub = subscribers.find((item) => item.id === input.subscriber_id);
      if (sub?.source === "profile") {
        if (!sub.plan_id) throw new Error("Vincule um plano antes de lançar pagamento para este cadastro.");
        await createOrUpdateSubscription(sub, sub.plan_id, input.paid_at);
        await fetchAll();
        return;
      }
      if (sub?.source === "subscription") {
        const paidAt = input.is_courtesy ? `${input.paid_at}T12:00:00` : new Date(`${input.paid_at}T12:00:00`).toISOString();
        await advanceSubscription(sub, input.paid_at, input.amount, paidAt);
        await logEvent(
          sub.legacy_subscriber_id || sub.id,
          input.is_courtesy ? "courtesy" : "payment_registered",
          input.is_courtesy
            ? `Cortesia/isenção lançada (${input.competence})`
            : `Pagamento manual de R$ ${input.amount.toFixed(2)} (${input.competence})`,
          input as any,
          null,
        );
        await fetchAll();
        return;
      }

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
    [actor, advanceSubscription, createOrUpdateSubscription, fetchAll, logEvent, subscribers],
  );

  const createCharge = useCallback(
    async (sub: FinSubscriber, amount: number, dueDate: string) => {
      if (sub.source === "subscription") {
        await logEvent(
          sub.legacy_subscriber_id || sub.id,
          "charge_created",
          `Cobrança registrada para ${dueDate} (${amount.toFixed(2)})`,
          { amount, dueDate, subscription_id: sub.subscription_id },
          null,
        );
        await fetchAll();
        return;
      }

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
      if (sub.source === "subscription") {
        const subscriptionId = subscriptionIdOf(sub);
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update(
              blocked
                ? ({ status: "blocked", blocked_at: new Date().toISOString() } as any)
                : ({ status: "active", blocked_at: null } as any),
            )
            .eq("id", subscriptionId);
        }
        if (sub.legacy_subscriber_id) {
          await supabase
            .from("subscribers")
            .update(
              blocked
                ? ({ status: "blocked", blocked_at: new Date().toISOString() } as any)
                : ({ status: "active", blocked_at: null } as any),
            )
            .eq("id", sub.legacy_subscriber_id);
        }
      } else if (sub.source === "profile") {
        await supabase
          .from("profiles")
          .update({ approval_status: blocked ? "rejected" : "approved", rejection_reason: blocked ? "Acesso bloqueado pelo administrador" : null } as any)
          .eq("user_id", sub.owner_user_id);
      } else if (blocked) {
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
      if (sub.source !== "subscription" && sub.owner_user_id) {
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
      if (sub.source === "subscription") {
        const subscriptionPatch: Record<string, any> = {};
        const profilePatch: Record<string, any> = {};

        if (patch.plan_id !== undefined) subscriptionPatch.plan_id = patch.plan_id;
        if (patch.status !== undefined) subscriptionPatch.status = patch.status;
        if (patch.next_due_date !== undefined) subscriptionPatch.current_period_end = `${patch.next_due_date}T12:00:00`;
        if (patch.subscriber_type !== undefined) profilePatch.account_type = patch.subscriber_type;
        if (patch.name !== undefined) profilePatch.full_name = patch.name;
        if (patch.email !== undefined) profilePatch.email = patch.email;
        if (patch.phone !== undefined) profilePatch.phone = patch.phone;

        const subscriptionId = subscriptionIdOf(sub);
        if (subscriptionId && Object.keys(subscriptionPatch).length) {
          await supabase.from("subscriptions").update(subscriptionPatch as any).eq("id", subscriptionId);
        }
        if (sub.owner_user_id && Object.keys(profilePatch).length) {
          await supabase.from("profiles").update(profilePatch as any).eq("user_id", sub.owner_user_id);
        }
        if (sub.legacy_subscriber_id) {
          const legacyPatch = { ...patch };
          if (legacyPatch.next_due_date === "") legacyPatch.next_due_date = null;
          await supabase.from("subscribers").update(legacyPatch as any).eq("id", sub.legacy_subscriber_id);
        }
      } else if (sub.source === "profile") {
        const profilePatch: Record<string, any> = {};
        if (patch.subscriber_type !== undefined) profilePatch.account_type = patch.subscriber_type;
        if (patch.name !== undefined) profilePatch.full_name = patch.name;
        if (patch.email !== undefined) profilePatch.email = patch.email;
        if (patch.phone !== undefined) profilePatch.phone = patch.phone;
        if (Object.keys(profilePatch).length && sub.owner_user_id) {
          await supabase.from("profiles").update(profilePatch as any).eq("user_id", sub.owner_user_id);
        }
        if (patch.plan_id) {
          await createOrUpdateSubscription(
            { ...sub, owner_user_id: sub.owner_user_id, plan_id: patch.plan_id, subscriber_type: patch.subscriber_type || sub.subscriber_type },
            patch.plan_id,
            patch.next_due_date,
          );
        }
      } else {
        await supabase.from("subscribers").update(patch as any).eq("id", sub.id);
      }
      await logEvent(sub.id, eventType, description || "Cadastro atualizado", patch);
      await fetchAll();
    },
    [createOrUpdateSubscription, fetchAll, logEvent],
  );

  const cancelSubscription = useCallback(
    async (sub: FinSubscriber, reason: string, note?: string) => {
      if (sub.source === "subscription") {
        const subscriptionId = subscriptionIdOf(sub);
        if (subscriptionId) {
          await supabase.from("subscriptions").update({ status: "cancelled" } as any).eq("id", subscriptionId);
        }
        if (sub.legacy_subscriber_id) {
          await supabase
            .from("subscribers")
            .update({ status: "cancelled", cancel_reason: reason, cancelled_at: new Date().toISOString() } as any)
            .eq("id", sub.legacy_subscriber_id);
        }
      } else if (sub.source === "profile") {
        await supabase
          .from("profiles")
          .update({ approval_status: "rejected", rejection_reason: `Cancelado: ${reason}` } as any)
          .eq("user_id", sub.owner_user_id);
      } else {
        await supabase
          .from("subscribers")
          .update({ status: "cancelled", cancel_reason: reason, cancelled_at: new Date().toISOString() } as any)
          .eq("id", sub.id);
      }
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

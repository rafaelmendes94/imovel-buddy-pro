
-- Remove assinaturas duplicadas do usuário rafaelcunha94@gmail.com, mantendo apenas o plano Completo como mais recente
DELETE FROM public.subscriptions
WHERE user_id = '1e23fa52-b6d8-4b24-8651-96673448969d'
  AND id <> '6930433b-ddc1-4ba3-8b78-9e13c3bec0ad';

-- Garante que a assinatura Completo esteja ativa, sem bloqueio e com período longo
UPDATE public.subscriptions
SET status = 'active',
    blocked_at = NULL,
    trial_ends_at = NULL,
    current_period_start = now(),
    current_period_end = now() + interval '365 days',
    created_at = now()
WHERE id = '6930433b-ddc1-4ba3-8b78-9e13c3bec0ad';

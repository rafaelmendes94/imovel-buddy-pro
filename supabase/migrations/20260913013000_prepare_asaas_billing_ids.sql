ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text;

ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS asaas_payment_id text;

UPDATE public.subscriptions
SET asaas_subscription_id = mercado_pago_subscription_id
WHERE asaas_subscription_id IS NULL
  AND mercado_pago_subscription_id IS NOT NULL;

UPDATE public.subscription_payments
SET asaas_payment_id = mercado_pago_payment_id
WHERE asaas_payment_id IS NULL
  AND mercado_pago_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_asaas_subscription_id
  ON public.subscriptions (asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_payments_asaas_payment_id
  ON public.subscription_payments (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;

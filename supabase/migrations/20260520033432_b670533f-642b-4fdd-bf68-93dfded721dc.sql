DROP POLICY IF EXISTS "Brokers can insert own ratings" ON public.broker_ratings;
CREATE POLICY "Authenticated can insert own ratings"
ON public.broker_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = rater_id AND auth.uid() <> broker_id);
-- Allow all authenticated users to read profiles (needed for avaliações feed)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Authenticated users read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
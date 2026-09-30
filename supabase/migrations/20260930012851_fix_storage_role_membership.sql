-- Storage API switches to the JWT role while evaluating storage.objects RLS.
-- Self-hosted installations must explicitly allow its database role to do so.
grant anon to supabase_storage_admin;
grant authenticated to supabase_storage_admin;
grant service_role to supabase_storage_admin;

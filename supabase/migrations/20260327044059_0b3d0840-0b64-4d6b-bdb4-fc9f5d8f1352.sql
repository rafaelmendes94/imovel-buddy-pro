INSERT INTO storage.buckets (id, name, public)
VALUES ('tabelas', 'tabelas', true);

CREATE POLICY "Public read access on tabelas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tabelas');

CREATE POLICY "Public insert on tabelas"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'tabelas');

CREATE POLICY "Public delete on tabelas"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'tabelas');
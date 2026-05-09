-- ============================================================
-- Storage bucket para uploads de apresentações
-- Logos da empresa e fotos do vendedor.
-- Executar no Supabase SQL Editor.
-- ============================================================

-- 1. Cria o bucket público (necessário para o link de share /p/[token]
--    funcionar com cliente final não autenticado)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'presentation-assets',
  'presentation-assets',
  true,
  10485760, -- 10 MB
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Policies de acesso
-- Estrutura de path: <tenant_id>/<user_id>/<kind>/<filename>
-- (kind = 'logo' | 'photo')

drop policy if exists "presentation_assets_public_read" on storage.objects;
create policy "presentation_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'presentation-assets');

-- Upload: usuário autenticado só pode escrever no path do próprio tenant
drop policy if exists "presentation_assets_authenticated_insert" on storage.objects;
create policy "presentation_assets_authenticated_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'presentation-assets'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.users where id = auth.uid()
    )
  );

-- Update/Delete: idem
drop policy if exists "presentation_assets_authenticated_modify" on storage.objects;
create policy "presentation_assets_authenticated_modify"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'presentation-assets'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.users where id = auth.uid()
    )
  );

drop policy if exists "presentation_assets_authenticated_delete" on storage.objects;
create policy "presentation_assets_authenticated_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'presentation-assets'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.users where id = auth.uid()
    )
  );

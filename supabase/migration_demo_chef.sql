-- Migration pour supporter le Chef "démo" (login téléphone purement local).
-- À exécuter une fois dans Supabase → SQL Editor.
-- Effet : le chef_id n'est plus contraint à auth.users → un UUID local marche.

-- 1. Drop la contrainte FK sur chef_id
alter table public.dossiers drop constraint if exists dossiers_chef_id_fkey;

-- 2. Permettre l'insert publique (vu qu'on n'a plus toujours auth.uid())
drop policy if exists "Chef manages own dossiers" on public.dossiers;

create policy "Public inserts dossiers"
  on public.dossiers for insert
  with check (true);

create policy "Public updates own dossiers"
  on public.dossiers for update
  using (true) with check (true);

create policy "Public deletes own dossiers"
  on public.dossiers for delete
  using (true);

-- 3. La policy "Public reads any dossier" existe déjà depuis schema.sql, on garde.

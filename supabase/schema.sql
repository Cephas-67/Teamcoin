-- KandoFoncier · schéma Supabase Postgres
-- À exécuter une fois dans Supabase → SQL Editor

create table if not exists public.actes (
  id              uuid primary key,
  parcelle_ref    text not null,
  parcelle_ville  text not null,
  acheteur_nom    text not null,
  vendeur_nom     text not null,
  document_hash   text not null,
  audio_hash      text not null,
  combined_hash   text not null unique,
  signature       text not null,
  ots_proof       text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_actes_combined_hash on public.actes (combined_hash);
create index if not exists idx_actes_parcelle on public.actes (parcelle_ref);
create index if not exists idx_actes_created_at on public.actes (created_at desc);

alter table public.actes enable row level security;

create policy "Lecture publique des actes"
  on public.actes for select
  using (true);

-- Les inserts passent par l'API (service_role key), donc pas de policy d'insert nécessaire ici.
-- Si un jour tu veux du write côté client, ajoute une policy 'authenticated insert' adaptée.

-- KandoFoncier · schéma Supabase Postgres v2 (stateless workflow)
-- À RE-exécuter dans Supabase → SQL Editor (drop des anciennes tables inclus)

-- ─── Cleanup anciennes tables (v1) ──────────────────────────────────────────
drop table if exists public.actes cascade;
drop table if exists public.users cascade;
drop table if exists public.dossier_checkpoints cascade;
drop table if exists public.dossiers cascade;


-- ─── Dossiers · workflow d'une vente foncière ───────────────────────────────
create table public.dossiers (
  id                   uuid primary key default gen_random_uuid(),
  chef_id              uuid not null references auth.users(id) on delete cascade,

  -- Parcelle
  parcelle_ref         text not null,
  parcelle_quartier    text not null,
  parcelle_commune     text not null,
  parcelle_superficie  int,

  -- Parties
  vendeur_nom          text not null,
  vendeur_phone        text not null,
  acheteur_nom         text not null,
  acheteur_phone       text not null,

  -- Workflow
  mode                 text not null check (mode in ('presentiel','distanciel')),
  statut               text not null default 'INIT'
                       check (statut in ('INIT','VENDEUR_OK','ACHETEUR_OK','SCELLE_COUTUMIER')),

  -- Document principal (hash uniquement, on ne stocke pas le fichier)
  document_hash        text,

  created_at           timestamptz not null default now()
);

create index idx_dossiers_chef on public.dossiers(chef_id);
create index idx_dossiers_statut on public.dossiers(statut);

alter table public.dossiers enable row level security;

-- Chef peut tout sur SES dossiers
create policy "Chef manages own dossiers"
  on public.dossiers for all
  using (auth.uid() = chef_id)
  with check (auth.uid() = chef_id);

-- Lecture publique d'un dossier par UUID (vendeur, acheteur, vérificateur)
create policy "Public reads any dossier"
  on public.dossiers for select
  using (true);

-- Update public limité au workflow (vendeur/acheteur sans compte mettent à jour statut)
-- En prod : passer par une RPC sécurisée. Pour hackathon : ok.
create policy "Public updates dossier workflow"
  on public.dossiers for update
  using (true)
  with check (true);


-- ─── Checkpoints · historique des étapes signées ────────────────────────────
create table public.dossier_checkpoints (
  id              bigserial primary key,
  dossier_id      uuid not null references public.dossiers(id) on delete cascade,
  etape           text not null check (etape in ('CREATION','VENDEUR','ACHETEUR','COUTUMIER','NOTAIRE','ANDF')),
  audio_hash      text,
  document_hash   text,
  current_hash    text not null,
  bitcoin_proof   text,
  signer_phone    text,
  created_at      timestamptz not null default now()
);

create index idx_checkpoints_dossier on public.dossier_checkpoints(dossier_id);

alter table public.dossier_checkpoints enable row level security;

create policy "Public reads checkpoints"
  on public.dossier_checkpoints for select using (true);

create policy "Public inserts checkpoints"
  on public.dossier_checkpoints for insert with check (true);

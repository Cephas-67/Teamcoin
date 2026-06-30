-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Gandehou · schéma Supabase v1                                            ║
-- ║                                                                          ║
-- ║ Couche de preuve d'antériorité et d'intégrité pour le foncier béninois.  ║
-- ║ À exécuter dans Supabase > SQL Editor (drop des tables KandoFoncier      ║
-- ║ inclus, perte volontaire des données de démo précédentes).               ║
-- ║                                                                          ║
-- ║ Auth officiels (chef_quartier, agent_mairie) : Supabase Auth par email   ║
-- ║ Auth citoyens : simulation localStorage côté client (hackathon)          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ─── 0. Cleanup KandoFoncier v2 ─────────────────────────────────────────────
drop table if exists public.dossier_status_history cascade;
drop table if exists public.dossier_checkpoints   cascade;
drop table if exists public.documents             cascade;
drop table if exists public.otp_sessions          cascade;
drop table if exists public.dossiers              cascade;
drop table if exists public.profiles              cascade;
drop table if exists public.actes                 cascade;
drop table if exists public.users                 cascade;


-- ─── 1. profiles · comptes officiels (chef quartier / agent mairie) ─────────
-- Note : pas de FK stricte vers auth.users pour pouvoir aussi insérer
-- des profils de démo (chef simulé). En prod on resserrerait.
create table public.profiles (
  id              uuid primary key default gen_random_uuid(),
  role            text not null check (role in ('chef_quartier','agent_mairie','admin')),
  full_name       text not null,
  email           text,
  phone           text,
  commune         text,
  arrondissement  text,
  quartier        text,
  created_at      timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_commune on public.profiles(commune);

alter table public.profiles enable row level security;

create policy "profiles · lecture publique"
  on public.profiles for select using (true);

create policy "profiles · insert public (hackathon)"
  on public.profiles for insert with check (true);

create policy "profiles · update self ou public (hackathon)"
  on public.profiles for update using (true) with check (true);


-- ─── 2. dossiers · 1 transaction foncière = 1 dossier ───────────────────────
create table public.dossiers (
  id                  uuid primary key default gen_random_uuid(),
  statut              text not null default 'brouillon'
                      check (statut in ('brouillon','atteste_cq','valide_mairie','litige')),

  -- Vendeur
  vendeur_nom         text not null,
  vendeur_cip         text,
  vendeur_phone       text,

  -- Acheteur
  acheteur_nom        text not null,
  acheteur_cip        text,
  acheteur_phone      text,
  acheteur_nationalite text default 'beninoise',

  -- Localisation
  departement         text,
  commune             text not null,
  arrondissement      text,
  quartier            text not null,
  zone                text not null check (zone in ('urbaine','rurale')),

  -- Parcelle
  parcelle_ref        text,
  superficie_m2       numeric,
  voisin_nord         text,
  voisin_sud          text,
  voisin_est          text,
  voisin_ouest        text,

  -- Origine du droit (titre foncier / ADC / lot / autre)
  origine_droit       text,
  origine_reference   text,

  -- Projet de mise en valeur (obligatoire en zone rurale)
  projet_mise_valeur  text,

  -- Auteur du dossier (chef de quartier)
  cree_par            uuid references public.profiles(id) on delete set null,

  -- Drapeaux moteur de règles ANDF (calculés à l'insert/update côté app)
  flag_etranger_zone_rurale boolean default false,
  flag_superficie_seuil     boolean default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_dossiers_statut       on public.dossiers(statut);
create index idx_dossiers_cree_par     on public.dossiers(cree_par);
create index idx_dossiers_commune      on public.dossiers(commune);
create index idx_dossiers_created_at   on public.dossiers(created_at desc);

alter table public.dossiers enable row level security;

create policy "dossiers · lecture publique (vérification)"
  on public.dossiers for select using (true);

create policy "dossiers · insert public (chef quartier)"
  on public.dossiers for insert with check (true);

create policy "dossiers · update public (workflow hackathon)"
  on public.dossiers for update using (true) with check (true);


-- ─── 3. documents · PDF générés + ancrage Bitcoin via OpenTimestamps ────────
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid not null references public.dossiers(id) on delete cascade,
  type            text not null check (type in ('attestation_provisoire','convention_finale')),

  -- Fichier
  storage_bucket  text not null,
  storage_path    text not null,

  -- Empreintes
  sha256          text not null,
  hash_parent     text,           -- chaînage vers le document précédent

  -- Ancrage OpenTimestamps
  ots_status      text not null default 'pending'
                  check (ots_status in ('pending','confirmed','mismatch')),
  ots_proof_path  text,           -- chemin du .ots dans le bucket ots-proofs
  ots_block_height int,           -- hauteur du bloc Bitcoin (renseigné quand confirmé)
  ots_confirmed_at timestamptz,

  -- Vérification publique
  qr_code_url     text,

  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index idx_documents_dossier      on public.documents(dossier_id);
create index idx_documents_sha256       on public.documents(sha256);
create index idx_documents_ots_status   on public.documents(ots_status);
create index idx_documents_pending_cron on public.documents(ots_status) where ots_status = 'pending';

alter table public.documents enable row level security;

create policy "documents · lecture publique"
  on public.documents for select using (true);

create policy "documents · insert public"
  on public.documents for insert with check (true);

create policy "documents · update public (upgrade OTS)"
  on public.documents for update using (true) with check (true);


-- ─── 4. dossier_status_history · piste d'audit complète ─────────────────────
create table public.dossier_status_history (
  id              bigserial primary key,
  dossier_id      uuid not null references public.dossiers(id) on delete cascade,
  ancien_statut   text,
  nouveau_statut  text not null,
  acteur          uuid references public.profiles(id) on delete set null,
  acteur_label    text,           -- snapshot lisible (nom + rôle au moment du changement)
  commentaire     text,
  changed_at      timestamptz not null default now()
);

create index idx_history_dossier on public.dossier_status_history(dossier_id, changed_at desc);

alter table public.dossier_status_history enable row level security;

create policy "history · lecture publique"
  on public.dossier_status_history for select using (true);

create policy "history · insert public"
  on public.dossier_status_history for insert with check (true);


-- ─── 5. otp_sessions · sessions citoyennes éphémères ────────────────────────
-- Conservée pour cohérence avec le dossier de cadrage, même si en hackathon
-- l'OTP est géré côté client (localStorage). En prod : codes hashés, expiry.
create table public.otp_sessions (
  id          uuid primary key default gen_random_uuid(),
  telephone   text not null,
  dossier_id  uuid references public.dossiers(id) on delete cascade,
  code_hash   text,
  expires_at  timestamptz,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_otp_telephone on public.otp_sessions(telephone);
create index idx_otp_dossier   on public.otp_sessions(dossier_id);

alter table public.otp_sessions enable row level security;

create policy "otp · accès public (hackathon)"
  on public.otp_sessions for all using (true) with check (true);


-- ─── 6. Triggers utilitaires ────────────────────────────────────────────────

-- Met à jour automatiquement dossiers.updated_at à chaque modification
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dossiers_touch on public.dossiers;
create trigger trg_dossiers_touch
  before update on public.dossiers
  for each row execute function public.touch_updated_at();


-- Trace automatique des changements de statut dans l'historique
create or replace function public.log_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.dossier_status_history (dossier_id, ancien_statut, nouveau_statut, acteur)
    values (new.id, null, new.statut, new.cree_par);
  elsif (new.statut is distinct from old.statut) then
    insert into public.dossier_status_history (dossier_id, ancien_statut, nouveau_statut, acteur)
    values (new.id, old.statut, new.statut, new.cree_par);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dossiers_log_status on public.dossiers;
create trigger trg_dossiers_log_status
  after insert or update of statut on public.dossiers
  for each row execute function public.log_status_change();


-- ─── 7. Storage · buckets nécessaires ───────────────────────────────────────
-- À créer manuellement dans Supabase > Storage (l'API SQL Storage est limitée).
-- Buckets attendus :
--   • documents-provisoires  (public read)
--   • documents-definitifs   (public read)
--   • ots-proofs             (public read, fichiers .ots)
--
-- Policies recommandées par bucket :
--   SELECT public, INSERT/UPDATE par service_role uniquement (Edge Functions)


-- ─── 8. Données de démo (optionnel, à exécuter en dev seulement) ────────────
-- Décommente pour seed :
--
-- insert into public.profiles (role, full_name, commune, arrondissement, quartier)
-- values
--   ('chef_quartier', 'Démo · Chef Cocotomey', 'Abomey-Calavi', 'Godomey', 'Cocotomey'),
--   ('agent_mairie',  'Démo · Agent Abomey-Calavi', 'Abomey-Calavi', null, null);

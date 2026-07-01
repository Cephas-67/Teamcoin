-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Migration Gandehou · bipartite (vendeur + acheteur)                       ║
-- ║                                                                          ║
-- ║ 1. Identifiant : CIP beninois OU passeport (typé)                         ║
-- ║ 2. Audio : un enregistrement par partie (vendeur + acheteur)              ║
-- ║ 3. Signature biometrique : une par partie (vendeur + acheteur)            ║
-- ║                                                                          ║
-- ║ À exécuter dans Supabase > SQL Editor.                                    ║
-- ║ Idempotent : IF NOT EXISTS partout, safe à rejouer.                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. DOSSIERS · type d'identifiant vendeur + acheteur
-- ═══════════════════════════════════════════════════════════════════════════

-- Ajout du type d'identifiant (cip béninois OU passeport)
alter table public.dossiers
  add column if not exists vendeur_id_type text
    check (vendeur_id_type in ('cip', 'passeport'));

alter table public.dossiers
  add column if not exists acheteur_id_type text
    check (acheteur_id_type in ('cip', 'passeport'));

-- Migration douce : les anciens *_cip sont présumés CIP (Béninois)
update public.dossiers
  set vendeur_id_type = 'cip'
  where vendeur_id_type is null and vendeur_cip is not null;

update public.dossiers
  set acheteur_id_type = 'cip'
  where acheteur_id_type is null and acheteur_cip is not null;

-- NOTE : le rename de *_cip vers *_id_value a été ANNULÉ pour préserver la compat
-- avec le front en production. Le champ vendeur_cip / acheteur_cip garde son nom
-- et contient une valeur générique (CIP OU numéro de passeport), discriminée par
-- vendeur_id_type / acheteur_id_type.
-- Voir migration 2026_07_rollback_cip_rename.sql pour le rollback si nécessaire.


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. DOCUMENTS · audio + signature dédoublés (vendeur / acheteur)
-- ═══════════════════════════════════════════════════════════════════════════

-- Renommage des anciennes colonnes signature vers vendeur_* (idempotent)
do $$
begin
  -- signataire_pubkey_hash -> vendeur_pubkey_hash
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_pubkey_hash') then
    alter table public.documents rename column signataire_pubkey_hash to vendeur_pubkey_hash;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_credential_id') then
    alter table public.documents rename column signataire_credential_id to vendeur_credential_id;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_pubkey_jwk') then
    alter table public.documents rename column signataire_pubkey_jwk to vendeur_pubkey_jwk;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_nom') then
    alter table public.documents rename column signataire_nom to vendeur_signataire_nom;
  end if;

  -- Anciennes colonnes audio (mono-audio) -> vendeur_audio_*
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='audio_storage_path') then
    alter table public.documents rename column audio_storage_path to vendeur_audio_path;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='audio_sha256') then
    alter table public.documents rename column audio_sha256 to vendeur_audio_sha256;
  end if;
end $$;

-- Ajout des colonnes ACHETEUR (audio + signature)
alter table public.documents add column if not exists acheteur_audio_path text;
alter table public.documents add column if not exists acheteur_audio_sha256 text;

alter table public.documents add column if not exists acheteur_pubkey_hash text;
alter table public.documents add column if not exists acheteur_credential_id text;
alter table public.documents add column if not exists acheteur_pubkey_jwk jsonb;
alter table public.documents add column if not exists acheteur_signataire_nom text;

-- Garantir aussi les colonnes vendeur (si migration fraîche, avant renommage)
alter table public.documents add column if not exists vendeur_audio_path text;
alter table public.documents add column if not exists vendeur_audio_sha256 text;
alter table public.documents add column if not exists vendeur_pubkey_hash text;
alter table public.documents add column if not exists vendeur_credential_id text;
alter table public.documents add column if not exists vendeur_pubkey_jwk jsonb;
alter table public.documents add column if not exists vendeur_signataire_nom text;


-- Index sur les credentialId pour retrouver un signataire par sa Passkey
create index if not exists idx_documents_vendeur_credential
  on public.documents(vendeur_credential_id)
  where vendeur_credential_id is not null;

create index if not exists idx_documents_acheteur_credential
  on public.documents(acheteur_credential_id)
  where acheteur_credential_id is not null;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Vérification
-- ═══════════════════════════════════════════════════════════════════════════
-- select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name='dossiers'
--   and column_name like '%id_%' order by column_name;
--
-- select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name='documents'
--   and (column_name like 'vendeur_%' or column_name like 'acheteur_%')
--   order by column_name;

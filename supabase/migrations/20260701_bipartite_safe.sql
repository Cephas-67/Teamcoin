-- Gandehou · migration bipartite SAFE (ne renomme rien, ajoute seulement)
--
-- Ajoute les colonnes id_type/id_value + les colonnes bipartites audio/signature.
-- NE RENOMME PAS vendeur_cip/acheteur_cip pour ne pas casser le code existant.
-- Idempotent : rejouable sans erreur.
--
-- A executer dans Supabase > SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. DOSSIERS · id_type + id_value (CIP beninois OU passeport)
-- ---------------------------------------------------------------------------

alter table public.dossiers
  add column if not exists vendeur_id_type text
    check (vendeur_id_type in ('cip', 'passeport'));

alter table public.dossiers
  add column if not exists vendeur_id_value text;

alter table public.dossiers
  add column if not exists acheteur_id_type text
    check (acheteur_id_type in ('cip', 'passeport'));

alter table public.dossiers
  add column if not exists acheteur_id_value text;

-- Retro-remplissage depuis les anciennes colonnes vendeur_cip / acheteur_cip
-- (13 chiffres = CIP, sinon passeport)
update public.dossiers
  set vendeur_id_type  = case when vendeur_cip ~ '^\d{13}$' then 'cip' else 'passeport' end,
      vendeur_id_value = vendeur_cip
  where vendeur_id_type is null and vendeur_cip is not null;

update public.dossiers
  set acheteur_id_type  = case when acheteur_cip ~ '^\d{13}$' then 'cip' else 'passeport' end,
      acheteur_id_value = acheteur_cip
  where acheteur_id_type is null and acheteur_cip is not null;


-- ---------------------------------------------------------------------------
-- 2. DOCUMENTS · audio + signature bipartite (vendeur + acheteur)
-- ---------------------------------------------------------------------------

-- Colonnes VENDEUR
alter table public.documents add column if not exists vendeur_audio_path text;
alter table public.documents add column if not exists vendeur_audio_sha256 text;
alter table public.documents add column if not exists vendeur_pubkey_hash text;
alter table public.documents add column if not exists vendeur_credential_id text;
alter table public.documents add column if not exists vendeur_pubkey_jwk jsonb;
alter table public.documents add column if not exists vendeur_signataire_nom text;

-- Colonnes ACHETEUR
alter table public.documents add column if not exists acheteur_audio_path text;
alter table public.documents add column if not exists acheteur_audio_sha256 text;
alter table public.documents add column if not exists acheteur_pubkey_hash text;
alter table public.documents add column if not exists acheteur_credential_id text;
alter table public.documents add column if not exists acheteur_pubkey_jwk jsonb;
alter table public.documents add column if not exists acheteur_signataire_nom text;

-- Migration douce depuis les anciennes colonnes mono (si elles existent)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='audio_storage_path') then
    update public.documents
      set vendeur_audio_path = coalesce(vendeur_audio_path, audio_storage_path)
      where vendeur_audio_path is null and audio_storage_path is not null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='audio_sha256') then
    update public.documents
      set vendeur_audio_sha256 = coalesce(vendeur_audio_sha256, audio_sha256)
      where vendeur_audio_sha256 is null and audio_sha256 is not null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_pubkey_hash') then
    update public.documents
      set vendeur_pubkey_hash = coalesce(vendeur_pubkey_hash, signataire_pubkey_hash)
      where vendeur_pubkey_hash is null and signataire_pubkey_hash is not null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_credential_id') then
    update public.documents
      set vendeur_credential_id = coalesce(vendeur_credential_id, signataire_credential_id)
      where vendeur_credential_id is null and signataire_credential_id is not null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_pubkey_jwk') then
    update public.documents
      set vendeur_pubkey_jwk = coalesce(vendeur_pubkey_jwk, signataire_pubkey_jwk)
      where vendeur_pubkey_jwk is null and signataire_pubkey_jwk is not null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='documents' and column_name='signataire_nom') then
    update public.documents
      set vendeur_signataire_nom = coalesce(vendeur_signataire_nom, signataire_nom)
      where vendeur_signataire_nom is null and signataire_nom is not null;
  end if;
end $$;

-- Index pour retrouver un signataire par sa Passkey
create index if not exists idx_documents_vendeur_credential
  on public.documents(vendeur_credential_id)
  where vendeur_credential_id is not null;

create index if not exists idx_documents_acheteur_credential
  on public.documents(acheteur_credential_id)
  where acheteur_credential_id is not null;

-- Index pour retrouver un dossier par id_value (CIP ou passeport)
create index if not exists idx_dossiers_vendeur_id_value
  on public.dossiers(vendeur_id_value) where vendeur_id_value is not null;

create index if not exists idx_dossiers_acheteur_id_value
  on public.dossiers(acheteur_id_value) where acheteur_id_value is not null;


-- ---------------------------------------------------------------------------
-- 3. Verifications (a executer pour valider la migration)
-- ---------------------------------------------------------------------------
-- select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name='dossiers'
--   and (column_name like '%_id_%' or column_name like '%_cip')
--   order by column_name;
--
-- select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name='documents'
--   and (column_name like 'vendeur_%' or column_name like 'acheteur_%')
--   order by column_name;

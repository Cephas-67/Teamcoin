-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Migration · ajout audio + signature biométrique WebAuthn                 ║
-- ║                                                                          ║
-- ║ À exécuter dans Supabase > SQL Editor.                                   ║
-- ║                                                                          ║
-- ║ Logique :                                                                ║
-- ║   • documents.sha256 reste le hash ANCRÉ sur Bitcoin                     ║
-- ║   • Si audio présent : sha256 = combinedHash(pdf_sha256, audio_sha256)   ║
-- ║   • Si pas d'audio : sha256 = pdf_sha256 (compat retro)                  ║
-- ║                                                                          ║
-- ║ Signature WebAuthn (Passkey) :                                           ║
-- ║   • On stocke la public key + credential ID retournés par le navigateur  ║
-- ║   • La vérification cryptographique réelle de la signature WebAuthn      ║
-- ║     se fait côté client (navigator.credentials.get) ; le backend stocke. ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

alter table public.documents
  add column if not exists pdf_sha256           text,
  add column if not exists audio_storage_path   text,
  add column if not exists audio_sha256         text,
  add column if not exists signataire_pubkey_hash    text,
  add column if not exists signataire_credential_id  text,
  add column if not exists signataire_pubkey_jwk     jsonb,
  add column if not exists signataire_nom            text;

-- Backfill : pour les documents existants, pdf_sha256 = sha256 (pas d'audio)
update public.documents
  set pdf_sha256 = sha256
  where pdf_sha256 is null;

-- Index utiles pour la vérification
create index if not exists idx_documents_pdf_sha256
  on public.documents(pdf_sha256);
create index if not exists idx_documents_audio_sha256
  on public.documents(audio_sha256)
  where audio_sha256 is not null;

-- ─── Reminder Storage ───────────────────────────────────────────────────────
-- À créer manuellement dans Supabase > Storage :
--   bucket "documents-audio" en public read

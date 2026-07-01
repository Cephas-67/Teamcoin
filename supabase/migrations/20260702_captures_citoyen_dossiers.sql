-- Gandehou · captures citoyen (audio + empreinte + photo piece) directement
-- sur dossiers. Le citoyen les fournit AU MOMENT DE LA SOUMISSION, avant
-- meme qu'un document n'existe. Le CQ, lors de l'attestation, copie ces
-- valeurs dans la ligne documents pour que la cascade OTS les inclue.
--
-- Idempotent : rejouable sans erreur.

-- Vendeur
alter table public.dossiers add column if not exists vendeur_audio_path text;
alter table public.dossiers add column if not exists vendeur_audio_sha256 text;
alter table public.dossiers add column if not exists vendeur_pubkey_hash text;
alter table public.dossiers add column if not exists vendeur_credential_id text;
alter table public.dossiers add column if not exists vendeur_pubkey_jwk jsonb;
alter table public.dossiers add column if not exists vendeur_signataire_nom text;
alter table public.dossiers add column if not exists vendeur_piece_id_path text;
alter table public.dossiers add column if not exists vendeur_piece_id_sha256 text;
alter table public.dossiers add column if not exists vendeur_piece_id_mime text;

-- Acheteur
alter table public.dossiers add column if not exists acheteur_audio_path text;
alter table public.dossiers add column if not exists acheteur_audio_sha256 text;
alter table public.dossiers add column if not exists acheteur_pubkey_hash text;
alter table public.dossiers add column if not exists acheteur_credential_id text;
alter table public.dossiers add column if not exists acheteur_pubkey_jwk jsonb;
alter table public.dossiers add column if not exists acheteur_signataire_nom text;
alter table public.dossiers add column if not exists acheteur_piece_id_path text;
alter table public.dossiers add column if not exists acheteur_piece_id_sha256 text;
alter table public.dossiers add column if not exists acheteur_piece_id_mime text;

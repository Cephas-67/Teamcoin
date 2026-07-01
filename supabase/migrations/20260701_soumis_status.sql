-- Gandehou · ajoute le statut 'soumis' entre brouillon et atteste_cq
-- Flux nouveau :
--   brouillon (jamais utilise depuis l'UI, garde par compat)
--   -> soumis      (citoyen a envoye le dossier, en attente CQ)
--   -> atteste_cq  (CQ a atteste = signature simple, PDF genere)
--   -> valide_mairie
--   -> litige
--
-- Idempotent : peut etre rejoue.

do $$
begin
  -- Supprime l'ancienne contrainte
  if exists (
    select 1 from information_schema.constraint_column_usage
    where table_schema = 'public' and table_name = 'dossiers'
      and constraint_name like '%statut%'
  ) then
    alter table public.dossiers drop constraint if exists dossiers_statut_check;
  end if;
end $$;

alter table public.dossiers
  add constraint dossiers_statut_check
  check (statut in ('brouillon','soumis','atteste_cq','valide_mairie','litige'));

-- Index pour la file d'attente CQ (dossiers soumis, plus recents en premier)
create index if not exists idx_dossiers_soumis_created
  on public.dossiers(created_at desc)
  where statut = 'soumis';

-- Index sur les telephones pour le lookup citoyen
create index if not exists idx_dossiers_vendeur_phone
  on public.dossiers(vendeur_phone) where vendeur_phone is not null;

create index if not exists idx_dossiers_acheteur_phone
  on public.dossiers(acheteur_phone) where acheteur_phone is not null;

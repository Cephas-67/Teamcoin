-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Migration Gandehou · ajout du statut "soumis"                            ║
-- ║                                                                          ║
-- ║ Workflow bipartite :                                                     ║
-- ║   brouillon (legacy) -> soumis -> atteste_cq -> valide_mairie            ║
-- ║   litige : branche indépendante                                          ║
-- ║                                                                          ║
-- ║ "soumis" = le dossier a ete rempli et soumis par le citoyen (chef),      ║
-- ║ audio + biometrie captures, en attente d'attestation par le CQ officiel. ║
-- ║ L'ancrage Bitcoin se lance a ce moment-la (preuve d'anteriorite).        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Supprime l'ancien CHECK et le recree avec 'soumis'
alter table public.dossiers drop constraint if exists dossiers_statut_check;

alter table public.dossiers add constraint dossiers_statut_check
  check (statut in ('brouillon','soumis','atteste_cq','valide_mairie','litige'));

-- Verification :
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.dossiers'::regclass and contype = 'c';

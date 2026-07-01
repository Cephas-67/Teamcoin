-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Rollback · restaurer les noms d'origine vendeur_cip / acheteur_cip       ║
-- ║                                                                          ║
-- ║ La migration 2026_07_bipartite_id_audio_sig.sql avait rename ces         ║
-- ║ colonnes en *_id_value. Le front en prod attend toujours les noms        ║
-- ║ d'origine, on rollback proprement.                                       ║
-- ║                                                                          ║
-- ║ Les colonnes *_id_type introduites en parallèle sont CONSERVÉES.        ║
-- ║ À exécuter dans Supabase > SQL Editor.                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

do $$
begin
  -- Restauration vendeur_cip
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'dossiers'
             and column_name = 'vendeur_id_value')
  and not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'dossiers'
                  and column_name = 'vendeur_cip')
  then
    alter table public.dossiers rename column vendeur_id_value to vendeur_cip;
  end if;

  -- Restauration acheteur_cip
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'dossiers'
             and column_name = 'acheteur_id_value')
  and not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'dossiers'
                  and column_name = 'acheteur_cip')
  then
    alter table public.dossiers rename column acheteur_id_value to acheteur_cip;
  end if;
end $$;

-- Vérification :
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='dossiers'
--   and (column_name like '%cip%' or column_name like '%id_type%' or column_name like '%id_value%')
--   order by column_name;
--
-- Attendu : acheteur_cip, acheteur_id_type, vendeur_cip, vendeur_id_type

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ pg_cron · planification de l'upgrade OpenTimestamps                      ║
-- ║                                                                          ║
-- ║ À exécuter dans Supabase > SQL Editor après avoir :                      ║
-- ║   1. Activé l'extension pg_cron : Database > Extensions > pg_cron        ║
-- ║   2. Activé l'extension pg_net  : Database > Extensions > pg_net         ║
-- ║   3. Déployé la fonction upgrade-ots :                                   ║
-- ║        supabase functions deploy upgrade-ots                             ║
-- ║                                                                          ║
-- ║ Remplace <PROJECT_REF> par ta référence projet Supabase (ex: abcdxyz12)  ║
-- ║ Remplace <SERVICE_ROLE_KEY> par la clé service_role du projet.           ║
-- ║                                                                          ║
-- ║ Mieux : stocker la clé via vault.create_secret() et la lire dynamiquement║
-- ║ pour ne pas la commiter en clair. Version "rapide" ci-dessous.           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Désinstaller un éventuel ancien job avant de recréer.
select cron.unschedule('gandehou-upgrade-ots') where exists (
  select 1 from cron.job where jobname = 'gandehou-upgrade-ots'
);

-- Planifie l'appel toutes les 30 minutes.
select cron.schedule(
  'gandehou-upgrade-ots',
  '*/30 * * * *',
  $$
    select net.http_post(
      url     := 'https://<PROJECT_REF>.functions.supabase.co/upgrade-ots',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ─── Vérification ───────────────────────────────────────────────────────────
-- select * from cron.job;                       -- liste les jobs planifiés
-- select * from cron.job_run_details order by start_time desc limit 10;

# Edge Functions Gandehou

Deux fonctions Deno qui portent le cœur Bitcoin du projet.

## 📦 Inventaire

| Function | Rôle | Déclenchement |
|---|---|---|
| `anchor-document` | Ancrer un PDF déjà uploadé sur Bitcoin via OpenTimestamps | HTTP POST depuis l'app |
| `upgrade-ots` | Faire passer les preuves `pending` à `confirmed` | `pg_cron` toutes les 30 min |

Code partagé dans `_shared/` (CORS, client admin Supabase, wrapper OTS).

---

## 🚀 Déploiement (première fois)

### 1. Prérequis locaux

```bash
# Supabase CLI
npm install -g supabase
# ou : scoop install supabase / brew install supabase/tap/supabase

supabase login
supabase link --project-ref <PROJECT_REF>
```

> `<PROJECT_REF>` se trouve dans Supabase Dashboard > Project Settings > General.

### 2. Secrets requis

Les Edge Functions ont besoin de `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`. Supabase les injecte automatiquement, **rien à faire**.

### 3. Déploiement

```bash
supabase functions deploy anchor-document
supabase functions deploy upgrade-ots
```

### 4. Test rapide

```bash
# Récupère un documentId existant dans la table documents,
# puis appelle anchor-document avec :
curl -X POST https://<PROJECT_REF>.functions.supabase.co/anchor-document \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"<DOCUMENT_UUID>"}'
```

Réponse attendue :
```json
{
  "ok": true,
  "status": "pending",
  "hash": "abc123...",
  "proofPath": "<dossier_id>/<document_id>.ots",
  "message": "Preuve soumise au calendrier OpenTimestamps. Agrégation Bitcoin dans quelques heures."
}
```

### 5. Activation du cron upgrade-ots

Dans Supabase > Database > Extensions, activer **pg_cron** et **pg_net**, puis :

```sql
-- Coller le contenu de supabase/migrations/pg_cron_upgrade_ots.sql
-- en remplaçant <PROJECT_REF> et <SERVICE_ROLE_KEY>.
```

Vérification :
```sql
select * from cron.job;
select * from cron.job_run_details order by start_time desc limit 5;
```

---

## 🧪 Test local

Si tu veux tester sans déployer :

```bash
supabase functions serve anchor-document --env-file ./supabase/.env.local
```

`./supabase/.env.local` :
```
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

> ⚠ Ne jamais commiter `.env.local`. Ajoute-le à `.gitignore`.

---

## ⚠ Risque principal documenté

`javascript-opentimestamps` interroge des serveurs de calendrier publics (Eternity Wall, BTC.com, etc.). Si ces serveurs sont indisponibles pendant la démo, `anchor-document` retournera une erreur réseau. Le dossier de cadrage (section 11) recommande explicitement de tester cette brique **dès le bloc 2 du hackathon**, jamais à la fin.

Plan de secours pour la démo : avoir un dossier pré-ancré la veille (statut `confirmed` déjà enregistré) à montrer en cas de pépin réseau live.

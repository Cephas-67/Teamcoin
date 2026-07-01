# Backend Gandehou · specs des extensions à livrer

> Complément à `BACKEND.md` (existant). Décrit uniquement ce qui **manque**
> pour brancher les nouvelles features demandées :
>
> 1. Choix P.I (CIP ↔ passeport) + upload du fichier scanné (PDF/photo)
> 2. Audio + empreinte biométrique · aligner l'Edge Function sur le schéma bipartite
> 3. Découpage territorial Bénin (départements / communes / arrondissements / quartiers)
> 4. Auto-remplissage territorial pour un CQ qui initie un dossier
> 5. Hash canonique du dossier · métadonnées PDF étendues
> 6. Convention notariée · chaînage AC + NV + signature numérique du notaire
>
> Format : pour chaque bloc → **DB** (migration SQL), **Storage** (bucket / policy),
> **Service** (signature TS à ajouter), **Edge Function** (contrat JSON), **Front**
> (comment appeler).

---

## 1 · Pièce d'Identité · type + fichier scanné

### État actuel

- `dossiers.vendeur_id_type` / `acheteur_id_type` (`cip` | `passeport`) → **OK**
- `dossiers.vendeur_id_value` / `acheteur_id_value` (numéro) → **OK**
- ❌ Pas de champ pour stocker le fichier scanné de la pièce
- ❌ Pas de bucket dédié aux pièces d'identité (sensibles → non publiques)

### DB · migration à ajouter

Fichier : `supabase/migrations/2026_07_ids_upload.sql`

```sql
-- Chemins Storage vers les fichiers PDF/photo de la pièce d'identité
alter table public.dossiers
  add column if not exists vendeur_id_path   text,
  add column if not exists vendeur_id_sha256 text,
  add column if not exists vendeur_id_mime   text,
  add column if not exists acheteur_id_path   text,
  add column if not exists acheteur_id_sha256 text,
  add column if not exists acheteur_id_mime   text;

-- Le hash est intégré au dossierCanonicalHash (§5), donc on veut pouvoir
-- retrouver un dossier depuis le hash d'une pièce (audit forensique).
create index if not exists idx_dossiers_vendeur_id_sha256
  on public.dossiers(vendeur_id_sha256) where vendeur_id_sha256 is not null;
create index if not exists idx_dossiers_acheteur_id_sha256
  on public.dossiers(acheteur_id_sha256) where acheteur_id_sha256 is not null;
```

### Storage

- Nouveau bucket **`pieces-identite`** — **NON public** (contient des données personnelles).
- Structure des chemins : `{dossier_id}/{vendeur|acheteur}-{id_type}.{ext}`
  Ex : `abc123/vendeur-cip.pdf`, `abc123/acheteur-passeport.jpg`

Policies SQL :

```sql
create policy "auth_upload_ids"
on storage.objects for insert to authenticated
with check (bucket_id = 'pieces-identite');

create policy "auth_update_ids"
on storage.objects for update to authenticated
using (bucket_id = 'pieces-identite')
with check (bucket_id = 'pieces-identite');

-- Lecture uniquement par service_role (Edge Functions) OU auth authentifiée.
-- PAS de select public — les pièces ne doivent JAMAIS fuir via /verifier.
create policy "auth_read_ids"
on storage.objects for select to authenticated
using (bucket_id = 'pieces-identite');
```

### Contraintes fichier (à valider côté service)

- MIME acceptés : `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
- Taille max : **5 MB** par fichier (une pièce d'identité tient largement)
- Refus si extension ne matche pas le MIME (défense contre le `.pdf.exe`)

### Service à créer

Fichier : `apps/web/src/services/pieces-identite.ts`

```ts
export type PartyKey = "vendeur" | "acheteur";
export type IdType = "cip" | "passeport";

export type UploadIdResult = {
  path: string;      // {dossierId}/{party}-{idType}.{ext}
  sha256: string;    // hex, servira au canonical hash du dossier
  mime: string;
  size: number;
};

/**
 * Upload la photo/PDF de la pièce d'identité d'une partie et enregistre les
 * champs {vendeur|acheteur}_id_{path,sha256,mime} sur le dossier.
 *
 * @throws si mime non autorisé, taille > 5 MB, ou dossier introuvable.
 */
export async function uploadPieceIdentite(
  dossierId: string,
  party: PartyKey,
  idType: IdType,
  file: File,
): Promise<UploadIdResult>;

/**
 * Génère une URL signée courte durée (60s) pour l'agent Mairie qui doit
 * vérifier physiquement la pièce. Bucket privé → jamais d'URL publique.
 */
export async function getPieceIdentiteSignedUrl(
  dossierId: string,
  party: PartyKey,
  ttlSeconds?: number, // défaut 60
): Promise<string>;
```

### Front · comment brancher

```tsx
import { uploadPieceIdentite } from "@/services";

// Dans le stepper de saisie (DossierForm.tsx), après le choix du type d'ID :
const onFile = async (file: File) => {
  const { sha256 } = await uploadPieceIdentite(
    dossierId, "vendeur", "cip", file,
  );
  toast.success("Pièce enregistrée · hash " + sha256.slice(0, 8));
};

<input
  type="file"
  accept="application/pdf,image/jpeg,image/png,image/webp"
  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
/>
```

---

## 2 · Audio + empreinte biométrique · aligner l'Edge Function

### Bug actuel

`supabase/functions/anchor-document/index.ts` lit encore les anciennes colonnes
`audio_storage_path`, `audio_sha256`, `signataire_pubkey_hash`. La migration
`2026_07_bipartite_id_audio_sig.sql` les a renommées en `vendeur_audio_*` /
`vendeur_pubkey_*` et ajouté leurs équivalents `acheteur_*`.

**Résultat** : ancrer un document avec audio ou signature biométrique casse
avec « colonne inconnue ».

### Correctif Edge Function · anchor-document

Contrat inchangé (`POST { documentId }`), mais la lecture doit devenir :

```ts
const { data: doc } = await supabase.from("documents").select(`
  id, dossier_id, storage_bucket, storage_path,
  sha256, pdf_sha256,
  vendeur_audio_path, vendeur_audio_sha256, vendeur_pubkey_hash,
  acheteur_audio_path, acheteur_audio_sha256, acheteur_pubkey_hash,
  ots_status, ots_proof_path
`).eq("id", documentId).maybeSingle();
```

Et le combined hash devient une cascade sur **5 sources max** (ordre canonique
figé pour rester reproductible) :

```
acc = pdf_sha256
si vendeur_audio_sha256  : acc = SHA-256(acc + "::" + vendeur_audio_sha256)
si vendeur_pubkey_hash   : acc = SHA-256(acc + "::" + vendeur_pubkey_hash)
si acheteur_audio_sha256 : acc = SHA-256(acc + "::" + acheteur_audio_sha256)
si acheteur_pubkey_hash  : acc = SHA-256(acc + "::" + acheteur_pubkey_hash)
```

Puis vérifier les hashs audio en re-téléchargeant les blobs (même logique
qu'aujourd'hui, doublée pour vendeur + acheteur).

Aligner `packages/ledger/hash.ts::combinedHash()` sur la même cascade — c'est
la source de vérité côté client, elle doit produire le même résultat que
l'Edge Function sinon 409 systématique.

### Service audio · signatures inchangées, ré-exporter juste

`services/audio.ts` a déjà `uploadAudio(dossierId, docId, blob)` — modifier
pour accepter `party: PartyKey` et écrire dans la bonne colonne (`vendeur_audio_*`
ou `acheteur_audio_*`) :

```ts
export async function uploadAudio(
  dossierId: string,
  docId: string,
  party: PartyKey,
  blob: Blob,
): Promise<{ path: string; sha256: string }>;
```

### Service signature · idem

`services/signature.ts::captureSignature()` doit prendre `party` en argument
et écrire les colonnes `{party}_pubkey_hash`, `{party}_credential_id`, etc.

---

## 3 · Découpage territorial Bénin

### Objectif

Un dropdown en cascade (département → commune → arrondissement → quartier)
qui vient d'une source unique et **cohérente entre l'onboarding CQ et le
formulaire dossier**. Aujourd'hui les CQ tapent en texte libre → risque
d'incohérence (`Cocotomey` vs `COCOTOMEY` vs `Coco-Tomey`).

### Approche recommandée · seed local

L'INSAE (Institut National de la Statistique du Bénin) publie le découpage
officiel. **Aucune API publique stable** au 2026-07-01 → on seed en base.

- Département : 12 (Alibori, Atacora, Atlantique, Borgou, Collines, Couffo,
  Donga, Littoral, Mono, Ouémé, Plateau, Zou)
- Communes : 77
- Arrondissements : ~546
- Quartiers/villages : ~5300

Une seule table hiérarchique suffit :

```sql
create table public.territoire (
  code       text primary key,           -- ex '12-01-03-005' (dept-com-arr-qt)
  parent     text references public.territoire(code) on delete cascade,
  niveau     text not null check (niveau in ('departement','commune','arrondissement','quartier')),
  nom        text not null,
  nom_normalise text generated always as (lower(unaccent(nom))) stored
);

create index idx_territoire_parent on public.territoire(parent);
create index idx_territoire_niveau on public.territoire(niveau);
create index idx_territoire_nom_norm on public.territoire(nom_normalise);

alter table public.territoire enable row level security;
create policy "territoire · lecture publique"
  on public.territoire for select using (true);
```

Le seed vient d'un fichier `supabase/seeds/territoire-benin.csv` (à demander à
l'INSAE ou dériver du portail data.gouv.bj — livrable à préparer séparément).

### Service à créer · `services/territoire.ts`

```ts
export type NiveauTerritoire = "departement" | "commune" | "arrondissement" | "quartier";

export type NoeudTerritoire = {
  code: string;
  parent: string | null;
  niveau: NiveauTerritoire;
  nom: string;
};

/** Liste les enfants directs d'un noeud (ou racines si `parent=null`). */
export async function listEnfants(parent: string | null): Promise<NoeudTerritoire[]>;

/** Résout un code en chemin complet (breadcrumb). */
export async function getChemin(code: string): Promise<NoeudTerritoire[]>;

/** Recherche fuzzy sur nom_normalise, utile pour un autocomplete unique. */
export async function chercher(q: string, niveau?: NiveauTerritoire): Promise<NoeudTerritoire[]>;
```

### Migration à ajouter côté `dossiers` et `profiles`

Passer les colonnes actuelles `departement`, `commune`, `arrondissement`,
`quartier` (texte libre) en **FK vers `territoire.code`** :

```sql
alter table public.dossiers
  add column if not exists territoire_code text
    references public.territoire(code) on delete set null;

alter table public.profiles
  add column if not exists territoire_code text
    references public.territoire(code) on delete set null;
```

Les colonnes texte actuelles restent pendant la migration (dénormalisation
pour rester lisible dans les listes) — un trigger les synchronise depuis le
code retenu.

### Front · comment brancher

```tsx
import { listEnfants, getChemin } from "@/services";

// Onboarding CQ → 4 selects en cascade
const [dept, setDept] = useState<string | null>(null);
const [com,  setCom]  = useState<string | null>(null);
// ...
const { data: departements } = useQuery(["dept"], () => listEnfants(null));
const { data: communes }     = useQuery(["com", dept], () => dept ? listEnfants(dept) : []);
```

---

## 4 · CQ initiant un dossier · auto-fill territorial

### Règle

Quand un CQ ouvre `/dossier/nouveau`, les champs département / commune /
arrondissement / quartier sont **verrouillés sur son propre territoire**
(profil). Il ne saisit QUE la parcelle et les parties.

### Service à ajouter

Fichier : `services/dossiers.ts` (rajouter une fonction)

```ts
/**
 * Pré-remplit un DossierInput vide avec le territoire du CQ connecté.
 * Renvoie null si l'utilisateur n'est pas un CQ ou n'a pas de territoire.
 */
export async function bootstrapDossierPourCq(): Promise<Partial<DossierInput> | null>;
```

Implémentation attendue :

```ts
const profile = await getCurrentOfficialProfile();
if (!profile || profile.role !== "chef_quartier" || !profile.territoire_code) return null;
const chemin = await getChemin(profile.territoire_code);
const byNiveau = Object.fromEntries(chemin.map((n) => [n.niveau, n.nom]));
return {
  departement:    byNiveau.departement    ?? null,
  commune:        byNiveau.commune        ?? "",
  arrondissement: byNiveau.arrondissement ?? null,
  quartier:       byNiveau.quartier       ?? "",
  territoire_code: profile.territoire_code,
};
```

### Contrainte serveur (garde-fou)

Le CQ ne doit pas pouvoir soumettre un dossier hors de son territoire. À
ajouter comme trigger `before insert` sur `dossiers` :

```sql
create or replace function public.enforce_cq_territory()
returns trigger as $$
declare
  v_profile record;
begin
  if new.cree_par is null then return new; end if;
  select role, territoire_code into v_profile
    from public.profiles where id = new.cree_par;
  if v_profile.role = 'chef_quartier'
     and v_profile.territoire_code is not null
     and new.territoire_code is distinct from v_profile.territoire_code then
    raise exception 'Un CQ ne peut initier un dossier que sur son propre quartier.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dossiers_cq_territory on public.dossiers;
create trigger trg_dossiers_cq_territory
  before insert on public.dossiers
  for each row execute function public.enforce_cq_territory();
```

---

## 5 · Hash canonique du dossier · métadonnées PDF

### Problème

Aujourd'hui les métadonnées du PDF ne contiennent que `KandoDossierID:<uuid>`.
La demande : y inclure **le hash de tout le contenu métier du dossier** pour
qu'un audit puisse détecter une divergence entre le PDF et la base même sans
Bitcoin.

### Fonction canonique · à ajouter à `packages/ledger/hash.ts`

```ts
/**
 * Sérialise un dossier en JSON canonique (clés triées, valeurs nulles omises,
 * pas d'espaces) puis calcule son SHA-256. Deux dossiers strictement
 * équivalents produisent le MÊME hash quel que soit l'ordre des colonnes.
 *
 * Le résultat sera stocké dans `documents.dossier_canonical_hash` (nouveau
 * champ, §5.2) ET inséré dans les métadonnées du PDF (Subject étendu).
 */
export async function dossierCanonicalHash(input: DossierCanonicalInput): Promise<string>;

export type DossierCanonicalInput = {
  id: string;
  vendeur: {
    nom: string;
    id_type: "cip" | "passeport" | null;
    id_value: string | null;
    id_sha256: string | null;   // hash du fichier de pièce d'identité
    phone: string | null;
  };
  acheteur: { /* idem */ };
  parcelle: {
    departement: string | null;
    commune: string;
    arrondissement: string | null;
    quartier: string;
    territoire_code: string | null;
    zone: "urbaine" | "rurale";
    parcelle_ref: string | null;
    superficie_m2: number | null;
    voisin_nord: string | null;
    voisin_sud: string | null;
    voisin_est: string | null;
    voisin_ouest: string | null;
    origine_droit: string | null;
    origine_reference: string | null;
    projet_mise_valeur: string | null;
  };
  cree_par: string | null;
};
```

Algorithme (déterministe, à respecter mot pour mot) :

1. Construire l'objet ci-dessus.
2. `JSON.stringify` en passant un `replacer` qui trie les clés en récursif et
   supprime les valeurs `null` / `""` / `undefined`.
3. `SHA-256` de l'UTF-8 → hex minuscule.

### DB · nouveau champ documents

```sql
alter table public.documents
  add column if not exists dossier_canonical_hash text;

create index if not exists idx_documents_canonical
  on public.documents(dossier_canonical_hash)
  where dossier_canonical_hash is not null;
```

### PDF · métadonnées étendues

Dans `lib/attestationPdf.ts` (front), remplacer le bloc `setSubject/setKeywords`
actuel par :

```ts
pdf.setSubject(`KandoDossierID:${dossier.id}`);
pdf.setKeywords([
  `KandoDossierID:${dossier.id}`,
  `DossierCanonicalHash:${canonicalHash}`,
  `AttestationNum:${attestationNum}`,
]);
// Metadata custom via /Info dictionary (pdf-lib ne l'expose pas directement,
// on passe par pdf.getInfoDict().set(PDFName.of("Gandehou"), ...) )
```

Le service `verify.ts::verifyFile()` doit alors :

1. Extraire `KandoDossierID` (déjà OK)
2. Extraire `DossierCanonicalHash` des Keywords
3. Recalculer `dossierCanonicalHash(dossier)` depuis la DB
4. Si divergent → verdict `falsifie` **même si le SHA du PDF matche**
   (protège contre : PDF non modifié mais BD modifiée après ancrage, cas
   « informaticien corrompu » du pitch)

---

## 6 · Convention notariée · chaînage AC + NV + signature notaire

### Flux cible

```
Attestation Comparution (AC, provisoire, CQ)
        └─ sha256_ac ─┐
                      ├──► Notaire construit la Convention finale (NV)
        Verdict NV ───┤    → PDF contient dans ses métadonnées :
        (accord      │       - KandoDossierID
         parties)     │       - HashAC : sha256_ac
                      │       - HashNV : sha256(contenu NV avant signature)
                      │       - SigNotaire : signature ECDSA sur (HashAC || HashNV)
                      └──► doc.hash_parent = sha256_ac
                           doc.sha256 = combinedHash(pdf, audios, sigs)
                           anchor-document
```

### DB · profil notaire + signatures

```sql
-- Rôle notaire dans les profils
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('chef_quartier','agent_mairie','notaire','admin'));

-- Clé publique notaire (ECDSA P-256, WebAuthn compatible)
alter table public.profiles
  add column if not exists notaire_pubkey_jwk jsonb,
  add column if not exists notaire_credential_id text,
  add column if not exists notaire_matricule text;

-- Signature du notaire attachée au document convention_finale
alter table public.documents
  add column if not exists notaire_id uuid references public.profiles(id) on delete set null,
  add column if not exists notaire_signature bytea,   -- signature ECDSA raw
  add column if not exists notaire_signed_at timestamptz;
```

### Edge Function · `notarize-convention` (nouvelle)

Contrat :

```
POST /functions/v1/notarize-convention
{
  documentId: string,           // uuid du doc convention_finale déjà uploadé
  notaireId: string,            // uuid profil notaire
  signatureBase64: string       // signature ECDSA du (hashAC || hashNV) faite côté client via WebAuthn
}

200 {
  ok: true,
  hashAC: string,
  hashNV: string,
  combinedForSig: string,       // ce qui a été signé
  verified: boolean             // signature vérifiée contre la pubkey notaire ?
}
```

Étapes attendues :

1. Charger le document → récupérer `hash_parent` (= hashAC de l'attestation
   provisoire ancrée) et `pdf_sha256` (= hashNV brut).
2. Reconstruire `signedData = SHA-256(hashAC || "::" || hashNV)`
3. Charger le notaire → `notaire_pubkey_jwk`
4. Vérifier `signatureBase64` avec `crypto.subtle.verify("ECDSA", ...)`
5. Si OK → enregistrer signature dans `documents.notaire_signature`,
   `notaire_signed_at`, `notaire_id`
6. Refuser si `hashAC` n'est pas confirmed sur Bitcoin (`ots_status =
   'confirmed'` sur l'attestation parent). Sécurité : un notaire ne signe
   jamais sur une base pas encore ancrée.

### Service front à ajouter · `services/notarize.ts`

```ts
export type NotarizeInput = {
  documentId: string;      // convention_finale déjà uploadée
  notaireId: string;
};

export type NotarizeResult = {
  ok: boolean;
  hashAC: string;
  hashNV: string;
  verified: boolean;
};

/**
 * Fait signer par le notaire via WebAuthn (Passkey) puis appelle l'Edge
 * Function pour vérifier + enregistrer. Inclut la génération de la
 * signature côté navigateur.
 */
export async function notarizeConvention(input: NotarizeInput): Promise<NotarizeResult>;
```

### PDF convention finale · métadonnées

`lib/conventionPdf.ts` (à créer sur le modèle de `attestationPdf.ts`) doit
intégrer dans les Keywords :

```
KandoDossierID:<uuid>
DossierCanonicalHash:<hash>
HashAC:<sha256_ac>
HashNV:<sha256_pdf_avant_sig>
NotaireMatricule:<matricule>
SigNotaire:<base64_signature>  // 64-128 octets, tient dans une clé PDF
```

Puis `verifyFileDeep()` doit, en plus des checks actuels :

1. Extraire `SigNotaire` + `HashAC` + `HashNV` des Keywords
2. Récupérer la `notaire_pubkey_jwk` depuis la DB via `NotaireMatricule`
3. `crypto.subtle.verify` → verdict `falsifie` si signature invalide

---

## 7 · Récapitulatif · ordre de livraison recommandé

| # | Livrable | Priorité | Dépend de |
|---|---|---|---|
| A | Fix `anchor-document` Edge Function (§2) | 🔥 P0 | rien — bug qui casse déjà l'ancrage bipartite |
| B | Bucket `pieces-identite` + migration (§1) | P0 | rien |
| C | Service `uploadPieceIdentite` (§1) | P0 | B |
| D | `dossierCanonicalHash` dans ledger (§5) | P0 | C (a besoin du id_sha256) |
| E | Métadonnées PDF étendues + verify (§5) | P1 | D |
| F | Table `territoire` + seed CSV (§3) | P1 | rien — livrable data à préparer |
| G | Cascade select + bootstrap CQ (§3, §4) | P1 | F |
| H | Trigger `enforce_cq_territory` (§4) | P2 | F, G |
| I | Rôle notaire + Edge Function notarize (§6) | P2 | E |
| J | PDF convention finale + verify signature notaire (§6) | P2 | I |

**P0** = à livrer pour le hackathon.
**P1** = démo pitch cohérente.
**P2** = post-hackathon / itération notaire.

---

## 8 · Contrat pour le front · liste des nouveaux exports `@/services`

À ajouter au barrel `services/index.ts` une fois implémenté :

```ts
export * from "./pieces-identite";  // §1
export * from "./territoire";        // §3
export * from "./notarize";          // §6
```

Rien d'autre à changer côté imports front : tout reste `import { xxx } from "@/services"`.

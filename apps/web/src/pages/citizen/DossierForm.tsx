import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Clock, Copy, FileText, MessageCircle, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PortalNav } from '@/components/PortalNav'
import Stepper, { Step } from '@/components/Stepper'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ *
 * Validation helpers
 * ------------------------------------------------------------------ */

// NPI béninois : exactement 13 chiffres.
const NPI_REGEX = /^\d{13}$/
// Passeport : 6–9 caractères alphanumériques (norme OACI).
const PASSPORT_REGEX = /^[A-Z0-9]{6,9}$/i
// Téléphone béninois : 8 ou 10 chiffres, ou +229 suivi de 8 chiffres.
const PHONE_REGEX = /^(\+229)?\d{8,10}$/
const phoneSchema = z
    .string()
    .min(1, 'Numéro requis.')
    .refine((v) => PHONE_REGEX.test(v.replace(/\s+/g, '')), 'Numéro invalide (8-10 chiffres, préfixe +229 optionnel).')
    .transform((v) => v.replace(/\s+/g, ''))
// Accepte NPI OU passeport — le champ est "CIP ou passeport".
const pieceSchema = z
    .string()
    .min(1, 'CIP ou passeport requis.')
    .refine(
        (v) => NPI_REGEX.test(v.trim()) || PASSPORT_REGEX.test(v.trim()),
        'Format invalide. NPI : 13 chiffres. Passeport : 6–9 caractères alphanumériques.',
    )

// Noms : lettres (avec accents), espaces, tirets, apostrophes. Pas de chiffres.
const NAME_REGEX = /^[\p{L}\s'\u2019-]{2,100}$/u
const nameSchema = (label: string) =>
    z
        .string()
        .min(2, `${label} requis (2 caractères minimum).`)
        .regex(NAME_REGEX, `${label} : lettres, espaces et tirets uniquement.`)
        .transform((v) => v.trim())

// Localisation : mêmes règles que les noms (noms de lieux béninois).
const locationSchema = (label: string) =>
    z
        .string()
        .min(2, `${label} requis.`)
        .regex(NAME_REGEX, `${label} : lettres, espaces et tirets uniquement.`)
        .transform((v) => v.trim())

// Nationalité : liste fermée des plus fréquentes + "Autre" avec champ libre.
const NATIONALITES = [
    'Béninoise',
    'Nigériane',
    'Togolaise',
    'Burkinabè',
    'Ghanéenne',
    'Nigérienne',
    'Ivoirienne',
    'Malienne',
    'Sénégalaise',
    'Camerounaise',
    'Française',
    'Libanaise',
    'Chinoise',
    'Indienne',
    'Autre',
] as const

const ORIGINES = [
    { value: 'titre_foncier', label: 'Titre Foncier' },
    { value: 'adc', label: 'Attestation de Détention Coutumière (ADC)' },
    { value: 'lot', label: 'Lot loti' },
    { value: 'autre', label: 'Autre' },
] as const

// Heuristic — refine with a real nationality list later.
const isForeigner = (nat?: string) => !!nat && nat !== 'Béninoise'

/* ------------------------------------------------------------------ *
 * Schema
 * ------------------------------------------------------------------ */
const schema = z
    .object({
        vendeur_nom: nameSchema('Nom du vendeur'),
        vendeur_cip: pieceSchema,
        vendeur_phone: phoneSchema,
        acheteur_nom: nameSchema("Nom de l'acheteur"),
        acheteur_nationalite: z.enum(NATIONALITES, {
            required_error: 'Nationalité requise.',
        }),
        acheteur_cip: pieceSchema,
        acheteur_phone: phoneSchema,
        departement: locationSchema('Département'),
        commune: locationSchema('Commune'),
        arrondissement: locationSchema('Arrondissement'),
        quartier: locationSchema('Quartier'),
        superficie_m2: z.coerce
            .number({ invalid_type_error: 'Superficie requise (m²).' })
            .positive('La superficie doit être positive.')
            .max(10_000_000, 'Superficie trop grande (max 10 000 000 m² / 1 000 ha).'),
        zone: z.enum(['urbaine', 'rurale'], { required_error: 'Choisissez le type de zone.' }),
        origine_droit: z.enum(['titre_foncier', 'adc', 'lot', 'autre'], {
            required_error: "Précisez l'origine du droit.",
        }),
        voisin_nord: nameSchema('Voisin Nord'),
        voisin_sud: nameSchema('Voisin Sud'),
        voisin_est: nameSchema('Voisin Est'),
        voisin_ouest: nameSchema('Voisin Ouest'),
    })
    .superRefine((v, ctx) => {
        if (v.zone === 'rurale' && isForeigner(v.acheteur_nationalite)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['zone'],
                message:
                    "En zone rurale, seuls les ressortissants béninois peuvent acquérir (art. 367 CFD).",
            })
        }
    })

type DossierValues = z.infer<typeof schema>

const STEP_FIELDS: (keyof DossierValues)[][] = [
    ['vendeur_nom', 'vendeur_cip', 'vendeur_phone'],
    ['acheteur_nom', 'acheteur_nationalite', 'acheteur_cip', 'acheteur_phone'],
    ['departement', 'commune', 'arrondissement', 'quartier'],
    ['superficie_m2', 'zone', 'origine_droit'],
    ['voisin_nord', 'voisin_sud', 'voisin_est', 'voisin_ouest'],
    [],
]
const STEP_LABELS = ['Vendeur', 'Acheteur', 'Localisation', 'Parcelle', 'Voisinage', 'Documents']

const inputCls =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition ' +
    'focus-visible:border-gandehou-green focus-visible:ring-4 focus-visible:ring-gandehou-green/20 ' +
    'aria-[invalid=true]:border-gandehou-red dark:border-white/15 dark:bg-white/5 dark:text-white'

const selectCls = inputCls + ' appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat'

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */
export default function DossierForm() {
    const [step, setStep] = useState(1)
    const [submitted, setSubmitted] = useState<{ id: string; phone: string } | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [plan, setPlan] = useState<File[]>([])
    const [pieces, setPieces] = useState<File[]>([])
    const [docError, setDocError] = useState('')

    const {
        register,
        trigger,
        getValues,
        watch,
        formState: { errors },
    } = useForm<DossierValues>({ resolver: zodResolver(schema), mode: 'onTouched' })

    // Règles ANDF non bloquantes (avertissements).
    const nat = watch('acheteur_nationalite')
    const zone = watch('zone')
    const superficie = watch('superficie_m2')
    const warnings: string[] = []
    if (zone === 'urbaine' && isForeigner(nat))
        warnings.push(
            'Acheteur étranger en zone urbaine : acquisition possible uniquement via bail emphytéotique de 50 ans non renouvelable.',
        )
    if (zone === 'rurale' && Number(superficie) > 20_000)
        warnings.push(
            'Superficie > 2 ha en zone rurale : approbation CoGeF / Conseil communal requise.',
        )

    const goToStep = (target: number) => {
        if (target < step) setStep(target)
    }
    const handleNext = async () => {
        if (await trigger(STEP_FIELDS[step - 1])) setStep((s) => s + 1)
    }
    const handleComplete = async () => {
        if (plan.length === 0) {
            setDocError('Ajoutez au moins le plan du géomètre.')
            return
        }
        const invalidFiles = [...plan, ...pieces].filter(
            (f) => !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type),
        )
        if (invalidFiles.length > 0) {
            setDocError('Formats acceptés : JPEG, PNG, WebP, PDF.')
            return
        }
        const oversized = [...plan, ...pieces].filter((f) => f.size > 10 * 1024 * 1024)
        if (oversized.length > 0) {
            setDocError('Taille maximale par fichier : 10 Mo.')
            return
        }
        setDocError('')

        const v = getValues()
        setSubmitting(true)

        // Auto-detection CIP vs passeport (13 chiffres = CIP beninois)
        const detectIdType = (val: string): 'cip' | 'passeport' =>
            /^\d{13}$/.test(val.trim()) ? 'cip' : 'passeport'
        const vendeurIdType = detectIdType(v.vendeur_cip)
        const acheteurIdType = detectIdType(v.acheteur_cip)

        try {
            const { data, error } = await supabase
                .from('dossiers')
                .insert({
                    statut: 'soumis',
                    vendeur_nom: v.vendeur_nom,
                    vendeur_id_type: vendeurIdType,      // 'cip' | 'passeport'
                    vendeur_id_value: v.vendeur_cip,     // le champ du form s'appelle _cip mais contient l'id (CIP ou passeport)
                    vendeur_phone: v.vendeur_phone,
                    acheteur_nom: v.acheteur_nom,
                    acheteur_id_type: acheteurIdType,
                    acheteur_id_value: v.acheteur_cip,
                    acheteur_phone: v.acheteur_phone,
                    acheteur_nationalite: v.acheteur_nationalite,
                    departement: v.departement,
                    commune: v.commune,
                    arrondissement: v.arrondissement,
                    quartier: v.quartier,
                    superficie_m2: v.superficie_m2,
                    zone: v.zone,
                    origine_droit: v.origine_droit,
                    voisin_nord: v.voisin_nord,
                    voisin_sud: v.voisin_sud,
                    voisin_est: v.voisin_est,
                    voisin_ouest: v.voisin_ouest,
                })
                .select('id')
                .single()

            if (error || !data) {
                toast.error(error?.message ?? 'Impossible de soumettre le dossier.')
                return
            }

            // Notifie le CQ concerne (best-effort, non-bloquant).
            supabase.functions.invoke('notify-cq-new-dossier', {
                body: { dossierId: data.id },
            }).catch(() => { /* silencieux, l'admin verra via le dashboard */ })

            // Sauvegarde le telephone localement pour la page de suivi.
            try { localStorage.setItem('gandehou:citizen_phone', v.vendeur_phone) } catch { /* privee */ }

            setSubmitted({ id: data.id, phone: v.vendeur_phone })
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erreur reseau.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
            <PortalNav backTo="/citizen-portal" />

            <main className="mx-auto w-full max-w-3xl px-6 pb-20">
                {submitted ? (
                    <DossierSuccess id={submitted.id} phone={submitted.phone} />
                ) : (
                    <>
                        <h1 className="mb-2 text-center text-3xl font-semibold xl:text-5xl">Initier un dossier</h1>
                        <p className="mx-auto mb-10 max-w-xl text-center text-neutral-900/60 dark:text-white/60">
                            Préparez votre dossier depuis votre téléphone. Vos informations restent locales
                            jusqu'à l'envoi.
                        </p>

                        <Stepper
                            currentStep={step}
                            labels={STEP_LABELS}
                            onStepClick={goToStep}
                            onBack={() => setStep((s) => s - 1)}
                            onNext={handleNext}
                            onComplete={handleComplete}
                        >
                            {/* 1 — Vendeur */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Identité du vendeur</legend>
                                    <Field label="Noms et prénoms" error={errors.vendeur_nom?.message} htmlFor="vendeur_nom">
                                        <input id="vendeur_nom" className={inputCls} aria-invalid={!!errors.vendeur_nom}
                                            placeholder="ex : Ahouandjinou Kossi" {...register('vendeur_nom')} />
                                    </Field>
                                    <Field label="NPI (13 chiffres) ou passeport" error={errors.vendeur_cip?.message} htmlFor="vendeur_cip">
                                        <input id="vendeur_cip" className={inputCls} aria-invalid={!!errors.vendeur_cip}
                                            placeholder="ex : 1234567890123" inputMode="text" maxLength={13} {...register('vendeur_cip')} />
                                        <p className="mt-1 text-xs text-neutral-900/40 dark:text-white/40">
                                            NPI : 13 chiffres · Passeport : 6–9 caractères
                                        </p>
                                    </Field>
                                    <Field label="Téléphone (WhatsApp)" error={errors.vendeur_phone?.message} htmlFor="vendeur_phone">
                                        <input id="vendeur_phone" type="tel" inputMode="tel" className={inputCls} aria-invalid={!!errors.vendeur_phone}
                                            placeholder="ex : 97000000 ou +22997000000" {...register('vendeur_phone')} />
                                    </Field>
                                </fieldset>
                            </Step>

                            {/* 2 — Acheteur */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Identité de l'acheteur</legend>
                                    <Field label="Noms et prénoms" error={errors.acheteur_nom?.message} htmlFor="acheteur_nom">
                                        <input id="acheteur_nom" className={inputCls} aria-invalid={!!errors.acheteur_nom}
                                            placeholder="ex : Dossou Amina" {...register('acheteur_nom')} />
                                    </Field>
                                    <Field label="Nationalité" error={errors.acheteur_nationalite?.message} htmlFor="acheteur_nat">
                                        <select id="acheteur_nat" className={selectCls} aria-invalid={!!errors.acheteur_nationalite}
                                            defaultValue="" {...register('acheteur_nationalite')}>
                                            <option value="" disabled>Sélectionner…</option>
                                            {NATIONALITES.map((n) => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="NPI (13 chiffres) ou passeport" error={errors.acheteur_cip?.message} htmlFor="acheteur_cip">
                                        <input id="acheteur_cip" className={inputCls} aria-invalid={!!errors.acheteur_cip}
                                            placeholder="ex : 1234567890123" inputMode="text" maxLength={13} {...register('acheteur_cip')} />
                                        <p className="mt-1 text-xs text-neutral-900/40 dark:text-white/40">
                                            NPI : 13 chiffres · Passeport : 6–9 caractères
                                        </p>
                                    </Field>
                                    <Field label="Téléphone (WhatsApp)" error={errors.acheteur_phone?.message} htmlFor="acheteur_phone">
                                        <input id="acheteur_phone" type="tel" inputMode="tel" className={inputCls} aria-invalid={!!errors.acheteur_phone}
                                            placeholder="ex : 97000000 ou +22997000000" {...register('acheteur_phone')} />
                                    </Field>
                                </fieldset>
                            </Step>

                            {/* 3 — Localisation */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Localisation</legend>
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <Field label="Département" error={errors.departement?.message} htmlFor="departement">
                                            <input id="departement" className={inputCls} aria-invalid={!!errors.departement}
                                                placeholder="ex : Littoral" {...register('departement')} />
                                        </Field>
                                        <Field label="Commune" error={errors.commune?.message} htmlFor="commune">
                                            <input id="commune" className={inputCls} aria-invalid={!!errors.commune}
                                                placeholder="ex : Cotonou" {...register('commune')} />
                                        </Field>
                                        <Field label="Arrondissement" error={errors.arrondissement?.message} htmlFor="arrondissement">
                                            <input id="arrondissement" className={inputCls} aria-invalid={!!errors.arrondissement}
                                                placeholder="ex : Akpakpa" {...register('arrondissement')} />
                                        </Field>
                                        <Field label="Quartier" error={errors.quartier?.message} htmlFor="quartier">
                                            <input id="quartier" className={inputCls} aria-invalid={!!errors.quartier}
                                                placeholder="ex : Agla" {...register('quartier')} />
                                        </Field>
                                    </div>
                                </fieldset>
                            </Step>

                            {/* 4 — Parcelle */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Détails de la parcelle</legend>
                                    <Field label="Superficie (m²)" error={errors.superficie_m2?.message} htmlFor="superficie">
                                        <input id="superficie" type="number" inputMode="numeric" min={1} max={10000000} step="0.01"
                                            className={inputCls} aria-invalid={!!errors.superficie_m2}
                                            placeholder="ex : 600" {...register('superficie_m2')} />
                                    </Field>
                                    <Field label="Type de zone" error={errors.zone?.message}>
                                        <div className="flex gap-3">
                                            {(['urbaine', 'rurale'] as const).map((z) => (
                                                <label key={z} className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-black/10 px-4 py-3 capitalize transition has-[:checked]:border-gandehou-green has-[:checked]:bg-gandehou-green/10 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gandehou-green/20 dark:border-white/15 dark:has-[:checked]:bg-gandehou-green/15">
                                                    <input type="radio" value={z} className="sr-only" {...register('zone')} />
                                                    {z}
                                                </label>
                                            ))}
                                        </div>
                                    </Field>
                                    <Field label="Origine du droit" error={errors.origine_droit?.message} htmlFor="origine">
                                        <select id="origine" className={selectCls} aria-invalid={!!errors.origine_droit} defaultValue="" {...register('origine_droit')}>
                                            <option value="" disabled>Sélectionner…</option>
                                            {ORIGINES.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    {warnings.length > 0 && (
                                        <div className="rounded-xl border border-gandehou-yellow/40 bg-gandehou-yellow/15 p-4" role="status">
                                            <p className="mb-1 text-sm font-semibold text-amber-900 dark:text-gandehou-yellow">À noter</p>
                                            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900/90 dark:text-gandehou-yellow/90">
                                                {warnings.map((w) => (<li key={w}>{w}</li>))}
                                            </ul>
                                        </div>
                                    )}
                                </fieldset>
                            </Step>

                            {/* 5 — Voisinage */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Limites de voisinage</legend>
                                    <p className="text-sm text-neutral-900/60 dark:text-white/60">
                                        Indiquez les noms des propriétaires ou occupants des parcelles adjacentes.
                                    </p>
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <Field label="Au Nord" error={errors.voisin_nord?.message} htmlFor="v_n">
                                            <input id="v_n" className={inputCls} aria-invalid={!!errors.voisin_nord}
                                                placeholder="ex : Famille Agbossou" {...register('voisin_nord')} />
                                        </Field>
                                        <Field label="Au Sud" error={errors.voisin_sud?.message} htmlFor="v_s">
                                            <input id="v_s" className={inputCls} aria-invalid={!!errors.voisin_sud}
                                                placeholder="ex : Route communale" {...register('voisin_sud')} />
                                        </Field>
                                        <Field label="À l'Est" error={errors.voisin_est?.message} htmlFor="v_e">
                                            <input id="v_e" className={inputCls} aria-invalid={!!errors.voisin_est}
                                                placeholder="ex : Terrain vide" {...register('voisin_est')} />
                                        </Field>
                                        <Field label="À l'Ouest" error={errors.voisin_ouest?.message} htmlFor="v_o">
                                            <input id="v_o" className={inputCls} aria-invalid={!!errors.voisin_ouest}
                                                placeholder="ex : Kpakpato Jean" {...register('voisin_ouest')} />
                                        </Field>
                                    </div>
                                </fieldset>
                            </Step>

                            {/* 6 — Documents */}
                            <Step>
                                <div className="space-y-5">
                                    <h2 className="text-xl font-semibold">Pièces justificatives</h2>
                                    <p className="text-sm text-neutral-900/60 dark:text-white/60">
                                        Formats acceptés : JPEG, PNG, WebP, PDF · 10 Mo max par fichier.
                                    </p>
                                    <FilePick id="plan" label="Plan du géomètre" hint="Photo ou PDF — obligatoire" accept=".jpg,.jpeg,.png,.webp,.pdf" files={plan} onFiles={setPlan} />
                                    <FilePick id="pieces" label="Pièces d'identité" hint="Photos des CIP / passeports" accept=".jpg,.jpeg,.png,.webp" multiple files={pieces} onFiles={setPieces} />
                                    {docError && <p className="text-sm text-gandehou-red" role="alert">{docError}</p>}
                                </div>
                            </Step>
                        </Stepper>
                    </>
                )}
            </main>
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * Sub-components
 * ------------------------------------------------------------------ */
function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor?: string; children: React.ReactNode }) {
    return (
        <div className="text-left">
            <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-900/80 dark:text-white/80">{label}</label>
            <div className="mt-1.5">{children}</div>
            {error && <p className="mt-1.5 text-sm text-gandehou-red" role="alert">{error}</p>}
        </div>
    )
}

function FilePick({ id, label, hint, accept, multiple = false, files, onFiles }: { id: string; label: string; hint: string; accept: string; multiple?: boolean; files: File[]; onFiles: (files: File[]) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFiles = (incoming: File[]) => {
        // Client-side guards — server should re-validate.
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        const maxSize = 10 * 1024 * 1024 // 10 MB
        const valid = incoming.filter((f) => allowed.includes(f.type) && f.size <= maxSize)
        onFiles(multiple ? [...files, ...valid] : valid.slice(0, 1))
    }

    return (
        <div className="text-left">
            <p className="mb-1.5 text-sm font-medium text-neutral-900/80 dark:text-white/80">{label}</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-8 text-center outline-none transition hover:border-gandehou-green hover:bg-gandehou-green/5 focus-visible:ring-4 focus-visible:ring-gandehou-green/20 dark:border-white/20 dark:bg-white/[0.03] dark:hover:bg-gandehou-green/10">
                <Upload className="h-6 w-6 text-gandehou-green" />
                <span className="text-sm text-neutral-900/70 dark:text-white/70">Prendre une photo ou choisir un fichier</span>
                <span className="text-xs text-neutral-900/45 dark:text-white/45">{hint}</span>
            </button>
            <input ref={inputRef} id={id} type="file" accept={accept} multiple={multiple} className="sr-only"
                onChange={(e) => handleFiles(Array.from(e.target.files ?? []))} />
            {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-3 py-2 text-sm dark:bg-white/[0.05]">
                            <FileText className="h-4 w-4 shrink-0 text-black/50 dark:text-white/50" />
                            <span className="truncate">{f.name}</span>
                            <span className="shrink-0 text-xs text-neutral-900/40 dark:text-white/40">
                                {(f.size / 1024 / 1024).toFixed(1)} Mo
                            </span>
                            <button type="button" aria-label={`Retirer ${f.name}`} onClick={() => onFiles(files.filter((_, idx) => idx !== i))} className="ml-auto rounded-md p-1 text-black/40 outline-none transition-colors hover:text-gandehou-red focus-visible:ring-2 focus-visible:ring-gandehou-red dark:text-white/40">
                                <X className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function DossierSuccess({ id, phone }: { id: string; phone: string }) {
    const [copied, setCopied] = useState(false)
    const shortId = id.slice(0, 8).toUpperCase()
    const link = `${window.location.origin}/verifier/${id}`

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(shortId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { /* clipboard indisponible */ }
    }

    return (
        <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gandehou-yellow/20">
                <Clock className="h-8 w-8 text-amber-600 dark:text-gandehou-yellow" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold">Dossier soumis</h1>
            <p className="mt-2 text-neutral-900/60 dark:text-white/60">
                Votre dossier est en attente d'attestation par votre Chef de Quartier.
                Vous serez notifié dès qu'il aura été validé.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-gandehou-yellow/15 px-5 py-4 dark:border-white/10">
                <span className="font-mono text-lg font-bold tracking-wide text-amber-700 dark:text-gandehou-yellow">{shortId}</span>
                <button type="button" onClick={copy} aria-label="Copier l'identifiant" className="rounded-lg p-2 text-amber-700 outline-none transition-colors hover:bg-black/5 focus-visible:ring-4 focus-visible:ring-gandehou-yellow/30 dark:text-gandehou-yellow">
                    <Copy className="h-5 w-5" />
                </button>
            </div>
            {copied && <p className="mt-2 text-sm text-gandehou-green">Identifiant copié</p>}

            <Link
                to={`/citizen-portal?phone=${encodeURIComponent(phone)}`}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
            >
                <CheckCircle2 className="h-6 w-6" />
                Voir mes dossiers
            </Link>

            <a
                href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, mon dossier foncier Gandehou (ID ${shortId}) est en attente d'attestation. Suivi : ${link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 px-6 py-3 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
            >
                <MessageCircle className="h-5 w-5" />
                Partager par WhatsApp
            </a>

            <p className="mt-6 text-xs leading-relaxed text-neutral-900/50 dark:text-white/50">
                Document en attente — sans valeur de titre de propriété. Gandehou sécurise la preuve
                d'antériorité et d'intégrité, en amont du circuit légal (Notaire / ANDF).
            </p>
        </div>
    )
}
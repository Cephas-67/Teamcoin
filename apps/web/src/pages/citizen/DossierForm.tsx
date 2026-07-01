import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Clock, FileText, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PortalNav } from '@/components/PortalNav'
import Stepper, { Step } from '@/components/Stepper'
import { AudioRecorder } from '@/components/AudioRecorder'
import { FingerprintCapture, type CapturedSignature } from '@/components/FingerprintCapture'
import { supabase } from '@/lib/supabase'
import { uploadCitizenAudio, uploadCitizenPiece } from '@/services/citizenCaptures'

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */
const PI_TYPES = ['carte_identite', 'passeport'] as const
type PiType = (typeof PI_TYPES)[number]

const NAME_REGEX = /^[\p{L}\s'\u2019-]{2,100}$/u

const NATIONALITES = [
    'Béninoise', 'Nigériane', 'Togolaise', 'Burkinabè', 'Ghanéenne',
    'Nigérienne', 'Ivoirienne', 'Malienne', 'Sénégalaise', 'Camerounaise',
    'Française', 'Libanaise', 'Chinoise', 'Indienne', 'Autre',
] as const

const ORIGINES = [
    { value: 'titre_foncier', label: 'Titre Foncier' },
    { value: 'adc', label: 'Attestation de Détention Coutumière (ADC)' },
    { value: 'lot', label: 'Lot loti' },
    { value: 'autre', label: 'Autre' },
] as const

const isForeigner = (nat?: string) => !!nat && nat !== 'Béninoise'

/* ------------------------------------------------------------------ *
 * Schema — no manual PI number entry; the user uploads the document.
 * ------------------------------------------------------------------ */
const nameSchema = (label: string) =>
    z.string().min(2, `${label} requis (2 car. min).`)
        .regex(NAME_REGEX, `${label} : lettres, espaces et tirets uniquement.`)
        .transform((v) => v.trim())

const locationSchema = (label: string) =>
    z.string().min(1, `${label} requis.`).transform((v) => v.trim())

const schema = z
    .object({
        vendeur_nom: nameSchema('Nom du vendeur'),
        vendeur_pi_type: z.enum(PI_TYPES, { required_error: "Choisissez le type de pièce d'identité." }),
        acheteur_nom: nameSchema("Nom de l'acheteur"),
        acheteur_nationalite: z.enum(NATIONALITES, { required_error: 'Nationalité requise.' }),
        acheteur_pi_type: z.enum(PI_TYPES, { required_error: "Choisissez le type de pièce d'identité." }),
        departement: locationSchema('Département'),
        commune: locationSchema('Commune'),
        arrondissement: locationSchema('Arrondissement'),
        quartier: locationSchema('Quartier'),
        superficie_m2: z.coerce.number({ invalid_type_error: 'Superficie requise (m²).' })
            .positive('Doit être positive.').max(10_000_000, 'Max 10 000 000 m².'),
        zone: z.enum(['urbaine', 'rurale'], { required_error: 'Choisissez le type de zone.' }),
        origine_droit: z.enum(['titre_foncier', 'adc', 'lot', 'autre'], { required_error: "Origine du droit requise." }),
        voisin_nord: nameSchema('Voisin Nord'),
        voisin_sud: nameSchema('Voisin Sud'),
        voisin_est: nameSchema('Voisin Est'),
        voisin_ouest: nameSchema('Voisin Ouest'),
    })
    .superRefine((v, ctx) => {
        // ANDF blocking rule — rural + foreigner
        if (v.zone === 'rurale' && isForeigner(v.acheteur_nationalite)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['zone'], message: 'En zone rurale, seuls les Béninois peuvent acquérir (art. 367 CFD).' })
        }
    })

type DossierValues = z.infer<typeof schema>

const STEP_FIELDS: (keyof DossierValues)[][] = [
    ['vendeur_nom', 'vendeur_pi_type'],
    ['acheteur_nom', 'acheteur_nationalite', 'acheteur_pi_type'],
    ['departement', 'commune', 'arrondissement', 'quartier'],
    ['superficie_m2', 'zone', 'origine_droit'],
    ['voisin_nord', 'voisin_sud', 'voisin_est', 'voisin_ouest'],
    [], // documents (plan + pieces)
    [], // consentements (audio + empreinte)
]
const STEP_LABELS = ['Vendeur', 'Acheteur', 'Localisation', 'Parcelle', 'Voisinage', 'Documents', 'Consentements']

const inputCls =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition ' +
    'focus-visible:border-gandehou-green focus-visible:ring-4 focus-visible:ring-gandehou-green/20 ' +
    'aria-[invalid=true]:border-gandehou-red dark:border-white/15 dark:bg-white/5 dark:text-white'

const selectCls = inputCls + ' appearance-none'

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

// Cle localStorage pour la persistance du brouillon (survit au refresh).
// Les fichiers (plan + pieces) ne sont PAS persistes : les objets File ne sont
// pas serializables et poser ce probleme depasse le scope du hackathon.
const DRAFT_KEY = 'gandehou:dossier_form_draft'

type Draft = { step: number; values: Partial<DossierValues> }

function loadDraft(): Draft | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (typeof parsed?.step === 'number' && parsed?.values) return parsed as Draft
        return null
    } catch { return null }
}

export default function DossierForm() {
    const initialDraft = loadDraft()
    const [step, setStep] = useState(initialDraft?.step ?? 1)
    const [submitted, setSubmitted] = useState<{ id: string; phone: string } | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [plan, setPlan] = useState<File[]>([])
    const [pieceVendeur, setPieceVendeur] = useState<File[]>([])
    const [pieceAcheteur, setPieceAcheteur] = useState<File[]>([])
    const [audioVendeur, setAudioVendeur] = useState<Blob | null>(null)
    const [audioAcheteur, setAudioAcheteur] = useState<Blob | null>(null)
    const [sigVendeur, setSigVendeur] = useState<CapturedSignature | null>(null)
    const [sigAcheteur, setSigAcheteur] = useState<CapturedSignature | null>(null)
    const [docError, setDocError] = useState('')
    const [draftRestored, setDraftRestored] = useState(!!initialDraft)

    const {
        register,
        trigger,
        getValues,
        watch,
        reset,
        formState: { errors },
    } = useForm<DossierValues>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
        defaultValues: (initialDraft?.values ?? {}) as Partial<DossierValues>,
    })

    // Persistance auto-save : a chaque changement du formulaire, on ecrit le
    // draft dans localStorage. Debounced via useEffect naturel (watch renvoie
    // les valeurs a chaque rerender, on ecrit une fois par batch React).
    const watchedAll = watch()
    useEffect(() => {
        if (submitted) return
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, values: watchedAll }))
        } catch { /* quota depasse · non-bloquant */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, JSON.stringify(watchedAll), submitted])

    // Bouton "recommencer" · vide le draft et le formulaire
    const discardDraft = () => {
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* prive */ }
        reset({} as DossierValues)
        setStep(1)
        setDraftRestored(false)
    }

    // Watch PI types for dynamic UI
    const vendeurPiType = watch('vendeur_pi_type')
    const acheteurPiType = watch('acheteur_pi_type')

    // Watch for ANDF warnings
    const nat = watch('acheteur_nationalite')
    const zone = watch('zone')
    const superficie = watch('superficie_m2')
    const warnings: string[] = []
    if (zone === 'urbaine' && isForeigner(nat))
        warnings.push('Acheteur étranger en zone urbaine : bail emphytéotique de 50 ans uniquement.')
    if (zone === 'rurale' && Number(superficie) > 20_000)
        warnings.push('Superficie > 2 ha en zone rurale : approbation CoGeF / Conseil communal requise.')

    // ── Territorial cascade ──────────────────────────────────────────
    useEffect(() => {
        setLoadingTerr(true)
        fetchDepartements()
            .then(setDepartements)
            .finally(() => setLoadingTerr(false))
    }, [])

    const handleDeptChange = (idStr: string) => {
        const id = Number(idStr)
        setSelectedDeptId(id)
        setSelectedCommuneId(null)
        setSelectedArrondId(null)
        setCommunes([]); setArrondissements([]); setQuartiers([])
        setValue('departement', departements.find((d) => d.id === id)?.label ?? '')
        setValue('commune', ''); setValue('arrondissement', ''); setValue('quartier', '')
        setLoadingTerr(true)
        fetchCommunes(id).then(setCommunes).finally(() => setLoadingTerr(false))
    }

    const handleCommuneChange = (idStr: string) => {
        const id = Number(idStr)
        setSelectedCommuneId(id)
        setSelectedArrondId(null)
        setArrondissements([]); setQuartiers([])
        setValue('commune', communes.find((c) => c.id === id)?.label ?? '')
        setValue('arrondissement', ''); setValue('quartier', '')
        if (selectedDeptId) {
            setLoadingTerr(true)
            fetchArrondissements(selectedDeptId, id).then(setArrondissements).finally(() => setLoadingTerr(false))
        }
    }

    const handleArrondChange = (idStr: string) => {
        const id = Number(idStr)
        setSelectedArrondId(id)
        setQuartiers([])
        setValue('arrondissement', arrondissements.find((a) => a.id === id)?.label ?? '')
        setValue('quartier', '')
        if (selectedDeptId && selectedCommuneId) {
            setLoadingTerr(true)
            fetchQuartiers(selectedDeptId, selectedCommuneId, id).then(setQuartiers).finally(() => setLoadingTerr(false))
        }
    }

    const handleQuartierChange = (idStr: string) => {
        const id = Number(idStr)
        setValue('quartier', quartiers.find((q) => q.id === id)?.label ?? '')
    }

    // ── Navigation ───────────────────────────────────────────────────
    const goToStep = (target: number) => { if (target < step) setStep(target) }
    const handleNext = async () => { if (await trigger(STEP_FIELDS[step - 1])) setStep((s) => s + 1) }

    const handleComplete = async () => {
        // Etape 6 obligatoire : plan + 2 pieces d'identite (vendeur + acheteur)
        if (plan.length === 0) return setDocError('Ajoutez le plan du géomètre.')
        if (pieceVendeur.length === 0) return setDocError("Ajoutez la pièce d'identité du vendeur.")
        if (pieceAcheteur.length === 0) return setDocError("Ajoutez la pièce d'identité de l'acheteur.")

        setDocError('')

        const v = getValues()
        setSubmitting(true)

        const detectIdType = (val: string): 'cip' | 'passeport' =>
            /^\d{13}$/.test(val.trim()) ? 'cip' : 'passeport'
        const vendeurIdType = detectIdType(v.vendeur_cip)
        const acheteurIdType = detectIdType(v.acheteur_cip)

        // Genere l'UUID cote client pour pouvoir uploader AVANT d'inserer.
        const dossierId = crypto.randomUUID()

        try {
            // 1. Upload en parallele des pieces d'identite (bucket prive)
            const [vp, ap] = await Promise.all([
                uploadCitizenPiece(dossierId, 'vendeur', pieceVendeur[0]),
                uploadCitizenPiece(dossierId, 'acheteur', pieceAcheteur[0]),
            ])

            // 2. Upload en parallele des audios (facultatifs)
            const [va, aa] = await Promise.all([
                audioVendeur ? uploadCitizenAudio(dossierId, 'vendeur', audioVendeur) : Promise.resolve(null),
                audioAcheteur ? uploadCitizenAudio(dossierId, 'acheteur', audioAcheteur) : Promise.resolve(null),
            ])

            // 3. INSERT dossier avec tous les paths / hashes
            const { data, error } = await supabase
                .from('dossiers')
                .insert({
                    id: dossierId,
                    statut: 'soumis',
                    vendeur_nom: v.vendeur_nom,
                    vendeur_id_type: vendeurIdType,
                    vendeur_id_value: v.vendeur_cip,
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
                    // Captures citoyen · seront copiees dans documents au moment CQ
                    vendeur_piece_id_path: vp.path,
                    vendeur_piece_id_sha256: vp.sha256,
                    vendeur_piece_id_mime: vp.mime,
                    acheteur_piece_id_path: ap.path,
                    acheteur_piece_id_sha256: ap.sha256,
                    acheteur_piece_id_mime: ap.mime,
                    vendeur_audio_path: va?.path ?? null,
                    vendeur_audio_sha256: va?.sha256 ?? null,
                    acheteur_audio_path: aa?.path ?? null,
                    acheteur_audio_sha256: aa?.sha256 ?? null,
                    vendeur_pubkey_hash: sigVendeur?.publicKeyHash ?? null,
                    vendeur_credential_id: sigVendeur?.credentialId ?? null,
                    vendeur_signataire_nom: sigVendeur?.signataireNom ?? null,
                    acheteur_pubkey_hash: sigAcheteur?.publicKeyHash ?? null,
                    acheteur_credential_id: sigAcheteur?.credentialId ?? null,
                    acheteur_signataire_nom: sigAcheteur?.signataireNom ?? null,
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
            // Efface le brouillon persiste
            try { localStorage.removeItem(DRAFT_KEY) } catch { /* prive */ }

            setSubmitted({ id: data.id, phone: v.vendeur_phone })
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erreur reseau.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
            <PortalNav backTo={isCQ ? '/cq/dashboard' : '/citizen-portal'} />

            <main className="mx-auto w-full max-w-3xl px-6 pb-20">
                {submitted ? (
                    <DossierSuccess num={submitted} />
                ) : (
                    <>
                        <h1 className="mb-2 text-center text-3xl font-semibold xl:text-5xl">Initier un dossier</h1>
                        <p className="mx-auto mb-6 max-w-xl text-center text-neutral-900/60 dark:text-white/60">
                            Préparez votre dossier depuis votre téléphone. Vos informations restent locales
                            jusqu'à l'envoi.
                        </p>

                        {draftRestored && (
                            <div
                                role="status"
                                className="mx-auto mb-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-gandehou-green/30 bg-gandehou-green/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                                <span className="text-neutral-900/80 dark:text-white/80">
                                    Brouillon restauré · vous continuez à l'étape {step}.
                                </span>
                                <button
                                    type="button"
                                    onClick={discardDraft}
                                    className="shrink-0 text-xs font-medium text-gandehou-green underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-gandehou-green"
                                >
                                    Recommencer à zéro
                                </button>
                            </div>
                        )}

                        <Stepper
                            currentStep={step}
                            labels={STEP_LABELS}
                            onStepClick={goToStep}
                            onBack={() => setStep((s) => s - 1)}
                            onNext={handleNext}
                            onComplete={handleComplete}
                        >
                            {/* ── Step 1: Vendeur ──────────────────────────────────── */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Identité du vendeur</legend>
                                    <Field label="Noms et prénoms" error={errors.vendeur_nom?.message} htmlFor="vendeur_nom">
                                        <input id="vendeur_nom" className={inputCls} aria-invalid={!!errors.vendeur_nom}
                                            placeholder="ex : Ahouandjinou Kossi" {...register('vendeur_nom')} />
                                    </Field>

                                    <PiTypeSelector
                                        name="vendeur_pi_type"
                                        register={register}
                                        current={vendeurPiType}
                                    />

                                    <FilePick
                                        id="vendeur_id_doc"
                                        label={vendeurPiType === 'carte_identite'
                                            ? "Photo de la Carte d'identité (CIP) du vendeur"
                                            : "Photo du passeport du vendeur"}
                                        hint="PDF ou image (JPEG, PNG, WebP) — 5 Mo max"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        files={vendeurIdDoc}
                                        onFiles={setVendeurIdDoc}
                                        required
                                    />

                                    <AudioRecorder
                                        onRecorded={setVendeurAudio}
                                        maxDuration={60}
                                    />
                                    {vendeurAudio && (
                                        <p className="text-xs text-gandehou-green">✓ Consentement vocal du vendeur enregistré</p>
                                    )}
                                </fieldset>
                            </Step>

                            {/* ── Step 2: Acheteur ─────────────────────────────────── */}
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
                                            {NATIONALITES.map((n) => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </Field>

                                    <PiTypeSelector
                                        name="acheteur_pi_type"
                                        register={register}
                                        current={acheteurPiType}
                                    />

                                    <FilePick
                                        id="acheteur_id_doc"
                                        label={acheteurPiType === 'carte_identite'
                                            ? "Photo de la Carte d'identité (CIP) de l'acheteur"
                                            : "Photo du passeport de l'acheteur"}
                                        hint="PDF ou image (JPEG, PNG, WebP) — 5 Mo max"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        files={acheteurIdDoc}
                                        onFiles={setAcheteurIdDoc}
                                        required
                                    />

                                    <AudioRecorder
                                        onRecorded={setAcheteurAudio}
                                        maxDuration={60}
                                    />
                                    {acheteurAudio && (
                                        <p className="text-xs text-gandehou-green">✓ Consentement vocal de l'acheteur enregistré</p>
                                    )}
                                </fieldset>
                            </Step>

                            {/* ── Step 3: Localisation (cascading selects via API) ──── */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Localisation</legend>
                                    {loadingTerr && departements.length === 0 && (
                                        <div className="flex items-center gap-2 rounded-xl bg-gandehou-yellow/15 px-4 py-3 text-sm text-amber-900 dark:text-gandehou-yellow">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Chargement des divisions territoriales…
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <Field label="Département" error={errors.departement?.message} htmlFor="departement">
                                            <select
                                                id="departement"
                                                className={selectCls}
                                                aria-invalid={!!errors.departement}
                                                value={selectedDeptId ?? ''}
                                                onChange={(e) => handleDeptChange(e.target.value)}
                                            >
                                                <option value="" disabled>Sélectionner…</option>
                                                {departements.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                                            </select>
                                            {/* Hidden input for react-hook-form validation */}
                                            <input type="hidden" {...register('departement')} />
                                        </Field>

                                        <Field label="Commune" error={errors.commune?.message} htmlFor="commune">
                                            <select
                                                id="commune"
                                                className={selectCls}
                                                aria-invalid={!!errors.commune}
                                                value={selectedCommuneId ?? ''}
                                                onChange={(e) => handleCommuneChange(e.target.value)}
                                                disabled={communes.length === 0}
                                            >
                                                <option value="" disabled>{loadingTerr && selectedDeptId ? 'Chargement…' : 'Sélectionner…'}</option>
                                                {communes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                            <input type="hidden" {...register('commune')} />
                                        </Field>

                                        <Field label="Arrondissement" error={errors.arrondissement?.message} htmlFor="arrondissement">
                                            <select
                                                id="arrondissement"
                                                className={selectCls}
                                                aria-invalid={!!errors.arrondissement}
                                                value={selectedArrondId ?? ''}
                                                onChange={(e) => handleArrondChange(e.target.value)}
                                                disabled={arrondissements.length === 0}
                                            >
                                                <option value="" disabled>{loadingTerr && selectedCommuneId ? 'Chargement…' : 'Sélectionner…'}</option>
                                                {arrondissements.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                                            </select>
                                            <input type="hidden" {...register('arrondissement')} />
                                        </Field>

                                        <Field label="Quartier / Village" error={errors.quartier?.message} htmlFor="quartier">
                                            <select
                                                id="quartier"
                                                className={selectCls}
                                                aria-invalid={!!errors.quartier}
                                                value=""
                                                onChange={(e) => handleQuartierChange(e.target.value)}
                                                disabled={quartiers.length === 0}
                                            >
                                                <option value="" disabled>{loadingTerr && selectedArrondId ? 'Chargement…' : 'Sélectionner…'}</option>
                                                {quartiers.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
                                            </select>
                                            <input type="hidden" {...register('quartier')} />
                                        </Field>
                                    </div>
                                </fieldset>
                            </Step>

                            {/* ── Step 4: Parcelle ─────────────────────────────────── */}
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
                                            {ORIGINES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </Field>
                                    {warnings.length > 0 && (
                                        <div className="rounded-xl border border-gandehou-yellow/40 bg-gandehou-yellow/15 p-4" role="status">
                                            <p className="mb-1 text-sm font-semibold text-amber-900 dark:text-gandehou-yellow">À noter</p>
                                            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900/90 dark:text-gandehou-yellow/90">
                                                {warnings.map((w) => <li key={w}>{w}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </fieldset>
                            </Step>

                            {/* ── Step 5: Voisinage ────────────────────────────────── */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Limites de voisinage</legend>
                                    <p className="text-sm text-neutral-900/60 dark:text-white/60">
                                        Noms des propriétaires ou occupants des parcelles adjacentes.
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

                            {/* 6 — Documents (plan + photos pieces d'identite par partie) */}
                            <Step>
                                <div className="space-y-5">
                                    <h2 className="text-xl font-semibold">Pièces justificatives</h2>
                                    <p className="text-sm text-neutral-900/60 dark:text-white/60">
                                        Chaque partie doit fournir la photo de sa pièce d'identité (visage visible).
                                        Formats : JPEG, PNG, WebP, HEIC, PDF · 5 Mo max.
                                    </p>
                                    <FilePick
                                        id="plan"
                                        label="Plan du géomètre"
                                        hint="Photo ou PDF — obligatoire"
                                        accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
                                        files={plan}
                                        onFiles={setPlan}
                                    />
                                    <FilePick
                                        id="piece_vendeur"
                                        label="Pièce d'identité du vendeur"
                                        hint="Photo de la CIP ou du passeport (visage visible)"
                                        accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
                                        files={pieceVendeur}
                                        onFiles={setPieceVendeur}
                                    />
                                    <FilePick
                                        id="piece_acheteur"
                                        label="Pièce d'identité de l'acheteur"
                                        hint="Photo de la CIP ou du passeport (visage visible)"
                                        accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
                                        files={pieceAcheteur}
                                        onFiles={setPieceAcheteur}
                                    />
                                    {docError && <p className="text-sm text-gandehou-red" role="alert">{docError}</p>}
                                </div>
                            </Step>

                            {/* 7 — Consentements (audio + empreinte par partie) */}
                            <Step>
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Consentement des parties</h2>
                                        <p className="mt-1 text-sm text-neutral-900/60 dark:text-white/60">
                                            Chaque partie enregistre un court message vocal (10-30 secondes)
                                            confirmant la transaction, puis appose son empreinte biométrique.
                                            Le tout est ancré sur Bitcoin avec le PDF.
                                        </p>
                                    </div>

                                    <fieldset className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                                        <legend className="px-2 text-sm font-semibold text-gandehou-green">
                                            Vendeur · {watch('vendeur_nom') || 'nom non renseigné'}
                                        </legend>
                                        <div className="space-y-4">
                                            <AudioRecorder onRecorded={setAudioVendeur} />
                                            <FingerprintCapture
                                                signataireNom={watch('vendeur_nom') || 'Vendeur'}
                                                onCaptured={setSigVendeur}
                                            />
                                        </div>
                                    </fieldset>

                                    <fieldset className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                                        <legend className="px-2 text-sm font-semibold text-gandehou-green">
                                            Acheteur · {watch('acheteur_nom') || 'nom non renseigné'}
                                        </legend>
                                        <div className="space-y-4">
                                            <AudioRecorder onRecorded={setAudioAcheteur} />
                                            <FingerprintCapture
                                                signataireNom={watch('acheteur_nom') || 'Acheteur'}
                                                onCaptured={setSigAcheteur}
                                            />
                                        </div>
                                    </fieldset>

                                    <p className="text-xs text-neutral-900/50 dark:text-white/50">
                                        Les consentements audio et biométrique sont recommandés mais restent facultatifs si votre appareil ne les prend pas en charge.
                                    </p>

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
function PiTypeSelector({
    name,
    register,
    current,
}: {
    name: 'vendeur_pi_type' | 'acheteur_pi_type'
    register: any
    current?: PiType
}) {
    return (
        <div>
            <p className="mb-2 block text-sm font-medium text-neutral-900/80 dark:text-white/80">
                Type de pièce d'identité
            </p>
            <div className="flex gap-3">
                {([
                    { value: 'carte_identite', label: "Carte d'identité (CIP)" },
                    { value: 'passeport', label: 'Passeport' },
                ] as const).map((opt) => (
                    <label
                        key={opt.value}
                        className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition
              ${current === opt.value
                                ? 'border-gandehou-green bg-gandehou-green/10 text-gandehou-green dark:bg-gandehou-green/15'
                                : 'border-black/10 dark:border-white/15'}
              has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gandehou-green/20`}
                    >
                        <input
                            type="radio"
                            value={opt.value}
                            className="sr-only"
                            {...register(name)}
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        </div>
    )
}

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor?: string; children: React.ReactNode }) {
    return (
        <div className="text-left">
            <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-900/80 dark:text-white/80">{label}</label>
            <div className="mt-1.5">{children}</div>
            {error && <p className="mt-1.5 text-sm text-gandehou-red" role="alert">{error}</p>}
        </div>
    )
}

function FilePick({ id, label, hint, accept, multiple = false, required = false, files, onFiles }: { id: string; label: string; hint: string; accept: string; multiple?: boolean; required?: boolean; files: File[]; onFiles: (files: File[]) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const handleFiles = (incoming: File[]) => {
        // Sur mobile iOS/Android, certains fichiers arrivent sans MIME (chaine vide).
        // On accepte aussi via l'extension du nom pour ne pas les filtrer a tort.
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
        const allowedExt = /\.(jpe?g|png|webp|heic|heif|pdf)$/i
        const maxSize = 10 * 1024 * 1024
        const valid = incoming.filter((f) => {
            const typeOk = f.type ? allowedTypes.includes(f.type) : allowedExt.test(f.name)
            return typeOk && f.size > 0 && f.size <= maxSize
        })
        onFiles(multiple ? [...files, ...valid] : valid.slice(0, 1))
    }

    // Affichage lisible : octets < Ko < Mo. Evite le "0.0 Mo" pour les petits fichiers.
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} o`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
        return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
    }

    return (
        <div className="text-left">
            <p className="mb-1.5 text-sm font-medium text-neutral-900/80 dark:text-white/80">
                {label}{required && <span className="ml-1 text-gandehou-red">*</span>}
            </p>
            <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-6 text-center outline-none transition hover:border-gandehou-green hover:bg-gandehou-green/5 focus-visible:ring-4 focus-visible:ring-gandehou-green/20 dark:border-white/20 dark:bg-white/[0.03] dark:hover:bg-gandehou-green/10">
                <Upload className="h-5 w-5 text-gandehou-green" />
                <span className="text-sm text-neutral-900/70 dark:text-white/70">Photo ou fichier</span>
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
                                {formatSize(f.size)}
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

function DossierSuccess({ id: _id, phone }: { id: string; phone: string }) {
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

            <Link
                to={`/citizen-portal?phone=${encodeURIComponent(phone)}`}
                className="mt-10 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
            >
                <CheckCircle2 className="h-6 w-6" />
                Voir mes dossiers
            </Link>

            <p className="mt-6 text-xs leading-relaxed text-neutral-900/50 dark:text-white/50">
                Document provisoire — sans valeur de titre de propriété.
            </p>
        </div>
    )
}
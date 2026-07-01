import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Copy, FileText, Loader2, MessageCircle, Upload, X } from 'lucide-react'
import { PortalNav } from '@/components/PortalNav'
import Stepper, { Step } from '@/components/Stepper'
import { AudioRecorder } from '@/components/AudioRecorder'
import { useAuth } from '@/auth/AuthProvider'
import {
    fetchDepartements,
    fetchCommunes,
    fetchArrondissements,
    fetchQuartiers,
    type TerritorialUnit,
} from '../../services/teritorial'

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
    [],
]
const STEP_LABELS = ['Vendeur', 'Acheteur', 'Localisation', 'Parcelle', 'Voisinage', 'Documents']

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
export default function DossierForm() {
    const { chef, role } = useAuth()
    const isCQ = role === 'chef_quartier'

    const [step, setStep] = useState(1)
    const [submitted, setSubmitted] = useState<string | null>(null)

    // Per-party ID document uploads
    const [vendeurIdDoc, setVendeurIdDoc] = useState<File[]>([])
    const [acheteurIdDoc, setAcheteurIdDoc] = useState<File[]>([])
    // Plan + pièces
    const [plan, setPlan] = useState<File[]>([])
    const [pieces, setPieces] = useState<File[]>([])
    const [docError, setDocError] = useState('')

    // Per-party consent audio (spec: both seller and buyer record their voice)
    const [vendeurAudio, setVendeurAudio] = useState<Blob | null>(null)
    const [acheteurAudio, setAcheteurAudio] = useState<Blob | null>(null)

    // Territorial cascading selects — track both the list data and selected IDs
    const [departements, setDepartements] = useState<TerritorialUnit[]>([])
    const [communes, setCommunes] = useState<TerritorialUnit[]>([])
    const [arrondissements, setArrondissements] = useState<TerritorialUnit[]>([])
    const [quartiers, setQuartiers] = useState<TerritorialUnit[]>([])
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
    const [selectedCommuneId, setSelectedCommuneId] = useState<number | null>(null)
    const [selectedArrondId, setSelectedArrondId] = useState<number | null>(null)
    const [loadingTerr, setLoadingTerr] = useState(false)

    const {
        register, trigger, getValues, watch, setValue,
        formState: { errors },
    } = useForm<DossierValues>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
        defaultValues: {
            vendeur_pi_type: 'carte_identite',
            acheteur_pi_type: 'carte_identite',
        },
    })

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
        if (vendeurIdDoc.length === 0) { setDocError("Ajoutez la pièce d'identité du vendeur."); return }
        if (acheteurIdDoc.length === 0) { setDocError("Ajoutez la pièce d'identité de l'acheteur."); return }
        if (plan.length === 0) { setDocError('Ajoutez le plan du géomètre.'); return }
        if (pieces.length === 0) { setDocError('Ajoutez la photo du terrain.'); return }
        const allFiles = [...vendeurIdDoc, ...acheteurIdDoc, ...plan, ...pieces]
        const bad = allFiles.filter((f) => !ALLOWED_FILE_TYPES.includes(f.type))
        if (bad.length > 0) { setDocError('Formats acceptés : JPEG, PNG, WebP, PDF.'); return }
        const big = allFiles.filter((f) => f.size > MAX_FILE_SIZE)
        if (big.length > 0) { setDocError('Taille maximale : 5 Mo par fichier.'); return }
        setDocError('')

        // TODO(api): replace with createDossier + evaluerReglesAndf + estBloque
        //   Then upload audio blobs:
        //   if (vendeurAudio) await uploadAudio(dossier.id, 'vendeur', vendeurAudio)
        //   if (acheteurAudio) await uploadAudio(dossier.id, 'acheteur', acheteurAudio)
        //   Audio hashes are included in the combined hash for Bitcoin anchoring.
        void getValues()
        setSubmitted(`GDH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`)
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
                        <p className="mx-auto mb-10 max-w-xl text-center text-neutral-900/60 dark:text-white/60">
                            {isCQ
                                ? 'Créez un dossier depuis votre espace Chef de Quartier.'
                                : 'Préparez votre dossier depuis votre téléphone. Aucun compte requis.'}
                        </p>

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

                            {/* ── Step 6: Documents ────────────────────────────────── */}
                            <Step>
                                <div className="space-y-5">
                                    <h2 className="text-xl font-semibold">Pièces justificatives</h2>
                                    <p className="text-sm text-neutral-900/60 dark:text-white/60">
                                        JPEG, PNG, WebP ou PDF · 5 Mo max par fichier.
                                    </p>
                                    <FilePick id="plan" label="Plan du géomètre" hint="Photo ou PDF — obligatoire" accept=".jpg,.jpeg,.png,.webp,.pdf" files={plan} onFiles={setPlan} required />
                                    <FilePick id="terrain" label="Photo du terrain" hint="Photo du terrain — obligatoire" accept=".jpg,.jpeg,.png,.webp" files={pieces} onFiles={setPieces} required />
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
        const valid = incoming.filter((f) => ALLOWED_FILE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE)
        onFiles(multiple ? [...files, ...valid] : valid.slice(0, 1))
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
                            <span className="shrink-0 text-xs text-neutral-900/40 dark:text-white/40">{(f.size / 1024 / 1024).toFixed(1)} Mo</span>
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

function DossierSuccess({ num }: { num: string }) {
    const [copied, setCopied] = useState(false)
    const link = `${window.location.origin}/verifier/${num}`
    const message = `Bonjour, voici mon dossier foncier Gandehou n° ${num}. Lien : ${link}`
    const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`
    const copy = async () => {
        try { await navigator.clipboard.writeText(num); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { }
    }
    return (
        <div className="mx-auto max-w-md text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-gandehou-green" />
            <h1 className="mt-6 text-3xl font-semibold">Dossier créé</h1>
            <p className="mt-2 text-neutral-900/60 dark:text-white/60">Transmettez ce numéro à votre Chef de Quartier.</p>
            <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-gandehou-green/10 px-5 py-4 dark:border-white/10">
                <span className="text-xl font-bold tracking-wide text-gandehou-green">{num}</span>
                <button type="button" onClick={copy} aria-label="Copier" className="rounded-lg p-2 text-gandehou-green outline-none transition-colors hover:bg-gandehou-green/10 focus-visible:ring-4 focus-visible:ring-gandehou-green/30">
                    <Copy className="h-5 w-5" />
                </button>
            </div>
            {copied && <p className="mt-2 text-sm text-gandehou-green">Numéro copié</p>}
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40">
                <MessageCircle className="h-6 w-6" />
                Partager par WhatsApp
            </a>
            <p className="mt-6 text-xs leading-relaxed text-neutral-900/50 dark:text-white/50">
                Document provisoire — sans valeur de titre de propriété.
            </p>
        </div>
    )
}
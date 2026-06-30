import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Copy, FileText, MessageCircle, Upload, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import logo from '../assets/logo.svg'
import Stepper, { Step } from './Stepper'
import { PortalNav } from '@/components/PortalNav'

/* ------------------------------------------------------------------ *
 * Schema — drafted from the spec. Confirm field names + rules.
 * ------------------------------------------------------------------ */
const schema = z.object({
    vendeurNom: z.string().min(2, 'Indiquez le nom du vendeur.'),
    vendeurPiece: z.string().min(3, 'CIP ou numéro de passeport requis.'),
    acheteurNom: z.string().min(2, "Indiquez le nom de l'acheteur."),
    acheteurNationalite: z.string().min(2, 'Nationalité requise.'),
    acheteurPiece: z.string().min(3, 'CIP ou numéro de passeport requis.'),
    superficie: z.coerce
        .number({ invalid_type_error: 'Superficie requise (en m²).' })
        .positive('La superficie doit être positive.'),
    limites: z.string().min(3, 'Précisez les limites de voisinage.'),
    zone: z.enum(['urbaine', 'rurale'], { required_error: 'Choisissez le type de zone.' }),
})

type DossierValues = z.infer<typeof schema>

// Which fields belong to which step — drives per-step validation.
const STEP_FIELDS: (keyof DossierValues)[][] = [
    ['vendeurNom', 'vendeurPiece'],
    ['acheteurNom', 'acheteurNationalite', 'acheteurPiece'],
    ['superficie', 'limites', 'zone'],
    [], // step 4 = documents, validated manually
]

const STEP_LABELS = ['Vendeur', 'Acheteur', 'Parcelle', 'Documents']

const inputCls =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition ' +
    'focus-visible:border-green-600 focus-visible:ring-4 focus-visible:ring-green-600/20 ' +
    'aria-[invalid=true]:border-red-500 dark:border-white/15 dark:bg-white/5 dark:text-white'

export default function DossierForm() {
    const [step, setStep] = useState(1)
    const [submitted, setSubmitted] = useState<string | null>(null) // holds dossier № once done

    // Files live outside RHF; presence-only validation here, real checks server-side.
    const [plan, setPlan] = useState<File[]>([])
    const [pieces, setPieces] = useState<File[]>([])
    const [docError, setDocError] = useState('')

    const {
        register,
        trigger,
        getValues,
        formState: { errors },
    } = useForm<DossierValues>({ resolver: zodResolver(schema), mode: 'onTouched' })

    const goToStep = (target: number) => {
        if (target < step) setStep(target) // only backwards via indicators
    }

    const handleNext = async () => {
        const ok = await trigger(STEP_FIELDS[step - 1])
        if (ok) setStep((s) => s + 1)
    }

    const handleComplete = async () => {
        if (plan.length === 0) {
            setDocError('Ajoutez au moins le plan du géomètre.')
            return
        }
        setDocError('')
        // TODO(api): POST the dossier + files, receive the real number from the server.
        const values = getValues()
        void values
        const num = `GDH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
        setSubmitted(num)
    }

    return (
        <div className="min-h-screen w-full bg-white text-black dark:bg-neutral-950 dark:text-white">

            <PortalNav />
            <main className="mx-auto w-full max-w-3xl px-6 pb-20">
                {submitted ? (
                    <DossierSuccess num={submitted} />
                ) : (
                    <>
                        <h1 className="mb-2 text-center text-3xl font-semibold xl:text-5xl">
                            Initier un dossier
                        </h1>
                        <p className="mx-auto mb-10 max-w-xl text-center text-black/60 dark:text-white/60">
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
                            {/* Step 1 — Vendeur */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Identité du vendeur</legend>
                                    <Field label="Noms et prénoms" error={errors.vendeurNom?.message} htmlFor="vendeurNom">
                                        <input id="vendeurNom" className={inputCls} aria-invalid={!!errors.vendeurNom}
                                            {...register('vendeurNom')} />
                                    </Field>
                                    <Field label="CIP ou passeport" error={errors.vendeurPiece?.message} htmlFor="vendeurPiece">
                                        <input id="vendeurPiece" className={inputCls} aria-invalid={!!errors.vendeurPiece}
                                            {...register('vendeurPiece')} />
                                    </Field>
                                </fieldset>
                            </Step>

                            {/* Step 2 — Acheteur */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Identité de l'acheteur</legend>
                                    <Field label="Noms et prénoms" error={errors.acheteurNom?.message} htmlFor="acheteurNom">
                                        <input id="acheteurNom" className={inputCls} aria-invalid={!!errors.acheteurNom}
                                            {...register('acheteurNom')} />
                                    </Field>
                                    <Field label="Nationalité" error={errors.acheteurNationalite?.message} htmlFor="acheteurNat">
                                        <input id="acheteurNat" className={inputCls} aria-invalid={!!errors.acheteurNationalite}
                                            {...register('acheteurNationalite')} />
                                    </Field>
                                    <Field label="CIP ou passeport" error={errors.acheteurPiece?.message} htmlFor="acheteurPiece">
                                        <input id="acheteurPiece" className={inputCls} aria-invalid={!!errors.acheteurPiece}
                                            {...register('acheteurPiece')} />
                                    </Field>
                                </fieldset>
                            </Step>

                            {/* Step 3 — Parcelle */}
                            <Step>
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-xl font-semibold">Détails de la parcelle</legend>
                                    <Field label="Superficie (m²)" error={errors.superficie?.message} htmlFor="superficie">
                                        <input id="superficie" type="number" inputMode="numeric" min={0}
                                            className={inputCls} aria-invalid={!!errors.superficie} {...register('superficie')} />
                                    </Field>
                                    <Field label="Limites de voisinage" error={errors.limites?.message} htmlFor="limites">
                                        <textarea id="limites" rows={3} className={inputCls} aria-invalid={!!errors.limites}
                                            placeholder="Nord, Sud, Est, Ouest…" {...register('limites')} />
                                    </Field>
                                    <Field label="Type de zone" error={errors.zone?.message}>
                                        <div className="flex gap-3">
                                            {(['urbaine', 'rurale'] as const).map((z) => (
                                                <label
                                                    key={z}
                                                    className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-black/10 px-4 py-3 capitalize transition has-[:checked]:border-green-600 has-[:checked]:bg-green-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-green-600/20 dark:border-white/15 dark:has-[:checked]:bg-green-400/10"
                                                >
                                                    <input type="radio" value={z} className="sr-only" {...register('zone')} />
                                                    {z}
                                                </label>
                                            ))}
                                        </div>
                                    </Field>
                                </fieldset>
                            </Step>

                            {/* Step 4 — Documents */}
                            <Step>
                                <div className="space-y-5">
                                    <h2 className="text-xl font-semibold">Pièces justificatives</h2>
                                    <FilePick
                                        id="plan"
                                        label="Plan du géomètre"
                                        hint="Photo ou PDF — obligatoire"
                                        accept="image/*,application/pdf"
                                        files={plan}
                                        onFiles={setPlan}
                                    />
                                    <FilePick
                                        id="pieces"
                                        label="Pièces d'identité"
                                        hint="Photos des CIP / passeports"
                                        accept="image/*"
                                        multiple
                                        files={pieces}
                                        onFiles={setPieces}
                                    />
                                    {docError && <p className="text-sm text-red-600 dark:text-red-400">{docError}</p>}
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
 * Small building blocks
 * ------------------------------------------------------------------ */
function Field({
    label,
    error,
    htmlFor,
    children,
}: {
    label: string
    error?: string
    htmlFor?: string
    children: React.ReactNode
}) {
    return (
        <div className="text-left">
            <label htmlFor={htmlFor} className="block text-sm font-medium text-black/80 dark:text-white/80">
                {label}
            </label>
            <div className="mt-1.5">{children}</div>
            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}

function FilePick({
    id,
    label,
    hint,
    accept,
    multiple = false,
    files,
    onFiles,
}: {
    id: string
    label: string
    hint: string
    accept: string
    multiple?: boolean
    files: File[]
    onFiles: (files: File[]) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    return (
        <div className="text-left">
            <p className="mb-1.5 text-sm font-medium text-black/80 dark:text-white/80">{label}</p>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-8 text-center outline-none transition hover:border-green-600 hover:bg-green-50 focus-visible:ring-4 focus-visible:ring-green-600/20 dark:border-white/20 dark:bg-white/[0.03] dark:hover:bg-green-400/10"
            >
                <Upload className="h-6 w-6 text-green-700 dark:text-green-400" />
                <span className="text-sm text-black/70 dark:text-white/70">
                    Prendre une photo ou choisir un fichier
                </span>
                <span className="text-xs text-black/45 dark:text-white/45">{hint}</span>
            </button>
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                multiple={multiple}
                className="sr-only"
                onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
            />
            {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${i}`}
                            className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-3 py-2 text-sm dark:bg-white/[0.05]"
                        >
                            <FileText className="h-4 w-4 shrink-0 text-black/50 dark:text-white/50" />
                            <span className="truncate">{f.name}</span>
                            <button
                                type="button"
                                aria-label={`Retirer ${f.name}`}
                                onClick={() => onFiles(files.filter((_, idx) => idx !== i))}
                                className="ml-auto rounded-md p-1 text-black/40 outline-none transition-colors hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 dark:text-white/40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * Ephemeral success screen
 * ------------------------------------------------------------------ */
function DossierSuccess({ num }: { num: string }) {
    const [copied, setCopied] = useState(false)
    // TODO(api): the share link shape is a guess — confirm your public dossier URL.
    const link = `${window.location.origin}/dossier/${num}`
    const message = `Bonjour, voici mon dossier foncier Gandehou n° ${num}. Lien : ${link}`
    const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(num)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            /* clipboard unavailable — number is visible above anyway */
        }
    }

    return (
        <div className="mx-auto max-w-md text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
            <h1 className="mt-6 text-3xl font-semibold">Dossier créé</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
                Transmettez ce numéro à votre Chef de Quartier pour la suite.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-green-50 px-5 py-4 dark:border-white/10 dark:bg-green-400/10">
                <span className="text-xl font-bold tracking-wide text-green-900 dark:text-green-300">
                    {num}
                </span>
                <button
                    type="button"
                    onClick={copy}
                    aria-label="Copier le numéro de dossier"
                    className="rounded-lg p-2 text-green-800 outline-none transition-colors hover:bg-green-100 focus-visible:ring-4 focus-visible:ring-green-600/30 dark:text-green-300 dark:hover:bg-green-400/20"
                >
                    <Copy className="h-5 w-5" />
                </button>
            </div>
            {copied && <p className="mt-2 text-sm text-green-700 dark:text-green-400">Numéro copié</p>}

            <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-green-700 focus-visible:ring-4 focus-visible:ring-green-600/40"
            >
                <MessageCircle className="h-6 w-6" />
                Partager par WhatsApp
            </a>
        </div>
    )
}
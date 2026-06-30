import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Copy, FileText, MessageCircle, Upload, X } from 'lucide-react'
import { PortalNav } from '@/components/PortalNav'
import Stepper, { Step } from '@/components/Stepper'

/* ------------------------------------------------------------------ *
 * Schema — matches the `dossiers` table (spec p.14). snake_case so the
 * form values map straight to the Supabase insert.
 * ------------------------------------------------------------------ */
const ORIGINES = [
  { value: 'titre_foncier', label: 'Titre Foncier' },
  { value: 'adc', label: 'Attestation de Détention Coutumière (ADC)' },
  { value: 'lot', label: 'Lot loti' },
  { value: 'autre', label: 'Autre' },
] as const

// Heuristic only — refine with a real nationality list / ID parsing later.
const isForeigner = (nat?: string) => !!nat && !/b[ée]nin/i.test(nat.trim())

const schema = z
  .object({
    vendeur_nom: z.string().min(2, 'Indiquez le nom du vendeur.'),
    vendeur_cip: z.string().min(3, 'CIP ou passeport requis.'),
    acheteur_nom: z.string().min(2, "Indiquez le nom de l'acheteur."),
    acheteur_nationalite: z.string().min(2, 'Nationalité requise.'),
    acheteur_cip: z.string().min(3, 'CIP ou passeport requis.'),
    departement: z.string().min(2, 'Département requis.'),
    commune: z.string().min(2, 'Commune requise.'),
    arrondissement: z.string().min(2, 'Arrondissement requis.'),
    quartier: z.string().min(2, 'Quartier requis.'),
    superficie_m2: z.coerce
      .number({ invalid_type_error: 'Superficie requise (m²).' })
      .positive('La superficie doit être positive.'),
    zone: z.enum(['urbaine', 'rurale'], { required_error: 'Choisissez le type de zone.' }),
    origine_droit: z.enum(['titre_foncier', 'adc', 'lot', 'autre'], {
      required_error: "Précisez l'origine du droit.",
    }),
    voisin_nord: z.string().min(1, 'Requis.'),
    voisin_sud: z.string().min(1, 'Requis.'),
    voisin_est: z.string().min(1, 'Requis.'),
    voisin_ouest: z.string().min(1, 'Requis.'),
  })
  // Moteur de règles ANDF — règle bloquante (spec p.15).
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
  ['vendeur_nom', 'vendeur_cip'],
  ['acheteur_nom', 'acheteur_nationalite', 'acheteur_cip'],
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

export default function DossierForm() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState<string | null>(null)
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

  // Règles ANDF non bloquantes (avertissements) — affichées à l'étape Parcelle.
  const nat = watch('acheteur_nationalite')
  const zone = watch('zone')
  const superficie = watch('superficie_m2')
  const warnings: string[] = []
  if (zone === 'urbaine' && isForeigner(nat))
    warnings.push(
      'Acheteur étranger en zone urbaine : acquisition possible uniquement via bail emphytéotique de 50 ans non renouvelable (pas de pleine propriété).',
    )
  if (zone === 'rurale' && Number(superficie) > 20000)
    warnings.push(
      'Superficie supérieure à 2 ha en zone rurale : une approbation (CoGeF / Conseil communal) sera requise.',
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
    setDocError('')
    // TODO(api): insert into `dossiers` (statut 'brouillon') + upload files, then
    // use the row id as the unique number.
    void getValues()
    setSubmitted(`GDH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`)
  }

  return (
    <div className="min-h-screen w-full bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <PortalNav backTo="/citizen-portal" />

      <main className="mx-auto w-full max-w-3xl px-6 pb-20">
        {submitted ? (
          <DossierSuccess num={submitted} />
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
                    <input id="vendeur_nom" className={inputCls} aria-invalid={!!errors.vendeur_nom} {...register('vendeur_nom')} />
                  </Field>
                  <Field label="CIP ou passeport" error={errors.vendeur_cip?.message} htmlFor="vendeur_cip">
                    <input id="vendeur_cip" className={inputCls} aria-invalid={!!errors.vendeur_cip} {...register('vendeur_cip')} />
                  </Field>
                </fieldset>
              </Step>

              {/* 2 — Acheteur */}
              <Step>
                <fieldset className="space-y-5">
                  <legend className="mb-4 text-xl font-semibold">Identité de l'acheteur</legend>
                  <Field label="Noms et prénoms" error={errors.acheteur_nom?.message} htmlFor="acheteur_nom">
                    <input id="acheteur_nom" className={inputCls} aria-invalid={!!errors.acheteur_nom} {...register('acheteur_nom')} />
                  </Field>
                  <Field label="Nationalité" error={errors.acheteur_nationalite?.message} htmlFor="acheteur_nat">
                    <input id="acheteur_nat" className={inputCls} aria-invalid={!!errors.acheteur_nationalite} placeholder="Béninoise" {...register('acheteur_nationalite')} />
                  </Field>
                  <Field label="CIP ou passeport" error={errors.acheteur_cip?.message} htmlFor="acheteur_cip">
                    <input id="acheteur_cip" className={inputCls} aria-invalid={!!errors.acheteur_cip} {...register('acheteur_cip')} />
                  </Field>
                </fieldset>
              </Step>

              {/* 3 — Localisation */}
              <Step>
                <fieldset className="space-y-5">
                  <legend className="mb-4 text-xl font-semibold">Localisation</legend>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Département" error={errors.departement?.message} htmlFor="departement">
                      <input id="departement" className={inputCls} aria-invalid={!!errors.departement} {...register('departement')} />
                    </Field>
                    <Field label="Commune" error={errors.commune?.message} htmlFor="commune">
                      <input id="commune" className={inputCls} aria-invalid={!!errors.commune} {...register('commune')} />
                    </Field>
                    <Field label="Arrondissement" error={errors.arrondissement?.message} htmlFor="arrondissement">
                      <input id="arrondissement" className={inputCls} aria-invalid={!!errors.arrondissement} {...register('arrondissement')} />
                    </Field>
                    <Field label="Quartier" error={errors.quartier?.message} htmlFor="quartier">
                      <input id="quartier" className={inputCls} aria-invalid={!!errors.quartier} {...register('quartier')} />
                    </Field>
                  </div>
                </fieldset>
              </Step>

              {/* 4 — Parcelle (+ règles ANDF) */}
              <Step>
                <fieldset className="space-y-5">
                  <legend className="mb-4 text-xl font-semibold">Détails de la parcelle</legend>
                  <Field label="Superficie (m²)" error={errors.superficie_m2?.message} htmlFor="superficie">
                    <input id="superficie" type="number" inputMode="numeric" min={0} className={inputCls} aria-invalid={!!errors.superficie_m2} {...register('superficie_m2')} />
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
                    <select id="origine" className={inputCls} aria-invalid={!!errors.origine_droit} defaultValue="" {...register('origine_droit')}>
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
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Au Nord" error={errors.voisin_nord?.message} htmlFor="v_n">
                      <input id="v_n" className={inputCls} aria-invalid={!!errors.voisin_nord} {...register('voisin_nord')} />
                    </Field>
                    <Field label="Au Sud" error={errors.voisin_sud?.message} htmlFor="v_s">
                      <input id="v_s" className={inputCls} aria-invalid={!!errors.voisin_sud} {...register('voisin_sud')} />
                    </Field>
                    <Field label="À l'Est" error={errors.voisin_est?.message} htmlFor="v_e">
                      <input id="v_e" className={inputCls} aria-invalid={!!errors.voisin_est} {...register('voisin_est')} />
                    </Field>
                    <Field label="À l'Ouest" error={errors.voisin_ouest?.message} htmlFor="v_o">
                      <input id="v_o" className={inputCls} aria-invalid={!!errors.voisin_ouest} {...register('voisin_ouest')} />
                    </Field>
                  </div>
                </fieldset>
              </Step>

              {/* 6 — Documents */}
              <Step>
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold">Pièces justificatives</h2>
                  <FilePick id="plan" label="Plan du géomètre" hint="Photo ou PDF — obligatoire" accept="image/*,application/pdf" files={plan} onFiles={setPlan} />
                  <FilePick id="pieces" label="Pièces d'identité" hint="Photos des CIP / passeports" accept="image/*" multiple files={pieces} onFiles={setPieces} />
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
  return (
    <div className="text-left">
      <p className="mb-1.5 text-sm font-medium text-neutral-900/80 dark:text-white/80">{label}</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-8 text-center outline-none transition hover:border-gandehou-green hover:bg-gandehou-green/5 focus-visible:ring-4 focus-visible:ring-gandehou-green/20 dark:border-white/20 dark:bg-white/[0.03] dark:hover:bg-gandehou-green/10">
        <Upload className="h-6 w-6 text-gandehou-green" />
        <span className="text-sm text-neutral-900/70 dark:text-white/70">Prendre une photo ou choisir un fichier</span>
        <span className="text-xs text-neutral-900/45 dark:text-white/45">{hint}</span>
      </button>
      <input ref={inputRef} id={id} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(e) => onFiles(Array.from(e.target.files ?? []))} />
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-3 py-2 text-sm dark:bg-white/[0.05]">
              <FileText className="h-4 w-4 shrink-0 text-black/50 dark:text-white/50" />
              <span className="truncate">{f.name}</span>
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
    try {
      await navigator.clipboard.writeText(num)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-gandehou-green" />
      <h1 className="mt-6 text-3xl font-semibold">Dossier créé</h1>
      <p className="mt-2 text-neutral-900/60 dark:text-white/60">
        Transmettez ce numéro à votre Chef de Quartier pour la suite.
      </p>

      <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-gandehou-green/10 px-5 py-4 dark:border-white/10">
        <span className="text-xl font-bold tracking-wide text-gandehou-green">{num}</span>
        <button type="button" onClick={copy} aria-label="Copier le numéro de dossier" className="rounded-lg p-2 text-gandehou-green outline-none transition-colors hover:bg-gandehou-green/10 focus-visible:ring-4 focus-visible:ring-gandehou-green/30">
          <Copy className="h-5 w-5" />
        </button>
      </div>
      {copied && <p className="mt-2 text-sm text-gandehou-green">Numéro copié</p>}

      <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40">
        <MessageCircle className="h-6 w-6" />
        Partager par WhatsApp
      </a>

      <p className="mt-6 text-xs leading-relaxed text-neutral-900/50 dark:text-white/50">
        Document provisoire — sans valeur de titre de propriété. Gandehou sécurise la preuve
        d'antériorité et d'intégrité, en amont du circuit légal (Notaire / ANDF).
      </p>
    </div>
  )
}
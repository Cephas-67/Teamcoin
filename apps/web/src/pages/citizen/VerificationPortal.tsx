import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ExternalLink,
  FileText,
  FileUp,
  FileWarning,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { PortalNav } from '@/components/PortalNav'
import { verifyFile, verifyFileDeep } from '@/services/verify'
import { cn } from '@/lib/cn'

// Maps to documents.ots_status : pending -> provisional, confirmed -> authentic,
// mismatch -> tampered ; introuvable/invalid -> unknown.
type Verdict = 'provisional' | 'authentic' | 'tampered' | 'unknown'
type Status = 'idle' | 'loading' | Verdict

type VerdictContext = {
  status: Verdict
  fileName: string
  dossierId?: string
  reason?: string
  blockHeight?: number
  hash?: string
}

export default function VerificationPortal() {
  const [status, setStatus] = useState<Status>('idle')
  const [context, setContext] = useState<VerdictContext | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file?: File | null) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    setError('')
    setStatus('loading')

    // 1. Lookup rapide en base
    const fast = await verifyFile(file)
    let verdict: Verdict = 'unknown'
    let reason: string | undefined
    let dossierId: string | undefined
    let blockHeight: number | undefined
    let hash: string | undefined

    switch (fast.verdict) {
      case 'authentique':
        verdict = 'authentic'
        dossierId = fast.dossier?.id
        blockHeight = fast.document.ots_block_height ?? undefined
        hash = fast.document.sha256
        break
      case 'en_attente':
        verdict = 'provisional'
        dossierId = fast.dossier?.id
        hash = fast.document.sha256
        break
      case 'falsifie':
        verdict = 'tampered'
        reason = fast.reason
        hash = fast.sha256
        break
      case 'introuvable':
        verdict = 'unknown'
        reason = fast.reason
        break
    }

    setContext({ status: verdict, fileName: file.name, dossierId, reason, blockHeight, hash })
    setStatus(verdict)

    // 2. Verification profonde en arriere-plan (crypto contre ShieldCheck)
    // Ne rebascule le verdict qu'en cas de tampering detecte tardivement.
    if (verdict !== 'unknown') {
      verifyFileDeep(file).then((deep) => {
        if (deep.verdict === 'mismatch') {
          setContext((c) => c ? { ...c, status: 'tampered', reason: deep.reason ?? 'Empreinte crypto divergente.' } : c)
          setStatus('tampered')
        } else if (deep.verdict === 'confirmed' && verdict !== 'authentic') {
          setContext((c) => c ? { ...c, status: 'authentic', blockHeight: deep.blockHeight } : c)
          setStatus('authentic')
        }
      }).catch(() => { /* Edge Function pas dispo · on garde le verdict rapide */ })
    }
  }

  const reset = () => {
    setStatus('idle')
    setContext(null)
    setError('')
  }

  return (
    <div className="min-h-screen w-full bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <PortalNav backTo="/citizen-portal" />

      <main className="mx-auto w-full max-w-2xl px-6 pb-20">
        <h1 className="text-center text-3xl font-semibold xl:text-5xl">Vérifier un document</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-neutral-900/60 dark:text-white/60">
          Glissez la convention au format PDF pour contrôler instantanément son intégrité.
        </p>

        <div className="mt-10">
          {status === 'idle' && (
            <>
              <div
                role="group"
                aria-label="Zone de dépôt du document à vérifier"
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  handleFile(e.dataTransfer.files?.[0])
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors',
                  dragOver
                    ? 'border-gandehou-green bg-gandehou-green/10'
                    : 'border-black/15 dark:border-white/15',
                )}
              >
                <FileUp className="h-12 w-12 text-gandehou-green" />
                <p className="mt-4 text-lg font-medium">Glissez le PDF de la convention ici</p>
                <p className="mt-1 text-sm text-neutral-900/55 dark:text-white/55">ou</p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 rounded-2xl bg-gandehou-green px-6 py-2.5 font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
                >
                  Parcourir mes fichiers
                </button>
                <input ref={inputRef} type="file" accept="application/pdf" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
                {error && <p role="alert" className="mt-4 text-sm text-gandehou-red">{error}</p>}
              </div>

              {/* DEV ONLY — remove once wired to the API. Reviews each verdict design. */}
              {/* <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-900/40 dark:text-white/40">
                <span>Aperçu démo :</span>
                {(['provisional', 'authentic', 'tampered'] as Verdict[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setFileName('convention-demo.pdf')
                      setStatus(v)
                    }}
                    className="rounded-md border border-black/15 px-2 py-1 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    {v === 'provisional' ? 'Provisoire' : v === 'authentic' ? 'Authentique' : 'Altéré'}
                  </button>
                ))}
              </div> */}
            </>
          )}

          {status === 'loading' && (
            <div role="status" className="flex flex-col items-center justify-center rounded-3xl border border-black/10 px-6 py-16 text-center dark:border-white/10">
              <Loader2 className="h-10 w-10 animate-spin text-gandehou-green" />
              <p className="mt-4 font-medium">Analyse en cours…</p>
              <p className="mt-1 text-sm text-neutral-900/55 dark:text-white/55">
                Recalcul du SHA-256 puis comparaison à la preuve ancrée.
              </p>
            </div>
          )}

          {context && status !== 'idle' && status !== 'loading' && (
            <VerdictPanel context={context} onReset={reset} />
          )}
        </div>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-neutral-900/45 dark:text-white/45">
          Gandehou atteste l'intégrité et l'antériorité d'un document — toute altération devient
          détectable et horodatée publiquement. Ce n'est pas un titre de propriété ; seuls le
          Notaire et l'ANDF délivrent des actes opposables aux tiers.
        </p>
      </main>
    </div>
  )
}

const VERDICTS = {
  provisional: {
    icon: FileWarning,
    panel: 'bg-gandehou-yellow/15 border-gandehou-yellow/40',
    accent: 'text-amber-500 dark:text-gandehou-yellow',
    title: 'Attestation provisoire',
    message: 'Attestation de voisinage authentique · preuve soumise à l\'ancrage, en attente de confirmation.',
    disclaimer: 'Document provisoire — sans valeur de titre de propriété.',
    live: 'polite' as const,
  },
  authentic: {
    icon: ShieldCheck,
    panel: 'bg-gandehou-green/10 border-gandehou-green/30',
    accent: 'text-gandehou-green',
    title: 'Document authentique',
    message: "L'empreinte du document correspond exactement à la version horodatée et ancrée cryptographiquement.",
    disclaimer: 'Toute altération future serait détectable et horodatée publiquement.',
    live: 'polite' as const,
  },
  tampered: {
    icon: ShieldAlert,
    panel: 'bg-gandehou-red/10 border-gandehou-red/40',
    accent: 'text-gandehou-red',
    title: 'Alerte : document modifié',
    message: "L'empreinte ne correspond pas à la version ancrée. Ce document a été altéré — ne poursuivez pas la transaction.",
    disclaimer: '',
    live: 'assertive' as const,
  },
  unknown: {
    icon: HelpCircle,
    panel: 'bg-black/[0.04] border-black/15 dark:bg-white/5 dark:border-white/15',
    accent: 'text-neutral-900/60 dark:text-white/60',
    title: 'Document inconnu',
    message: "Aucun document Gandehou ne correspond à ce fichier. Il n'a jamais été ancré, ou il a été modifié après ancrage.",
    disclaimer: '',
    live: 'polite' as const,
  },
}

function VerdictPanel({ context, onReset }: { context: VerdictContext; onReset: () => void }) {
  const reduce = useReducedMotion()
  const { status, fileName, dossierId, reason, blockHeight, hash } = context
  const v = VERDICTS[status]
  const Icon = v.icon

  return (
    <div role="status" aria-live={v.live} className={cn('rounded-3xl border p-8 text-center', v.panel)}>
      <motion.div
        className="mx-auto w-fit"
        animate={status === 'tampered' && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={status === 'tampered' && !reduce ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : undefined}
      >
        <Icon className={cn('h-16 w-16', v.accent)} />
      </motion.div>

      <h2 className="mt-6 text-2xl font-semibold">{v.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-neutral-900/70 dark:text-white/70">
        {reason ?? v.message}
      </p>

      {status === 'authentic' && (
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-gandehou-green px-4 py-2 text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4" />
          {blockHeight ? `Ancrage confirmé · bloc #${blockHeight}` : 'Intégrité ancrée'}
        </span>
      )}

      {v.disclaimer && (
        <p className={cn('mx-auto mt-4 max-w-md text-sm font-medium', status === 'provisional' ? 'text-amber-700 dark:text-gandehou-yellow' : 'text-neutral-900/60 dark:text-white/60')}>
          {v.disclaimer}
        </p>
      )}

      {fileName && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-sm dark:bg-white/10">
          <FileText className="h-4 w-4 opacity-60" />
          {fileName}
        </p>
      )}

      {hash && (
        <p className="mx-auto mt-3 max-w-md break-all font-mono text-[10px] text-neutral-900/40 dark:text-white/40">
          {hash}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        {dossierId && (
          <Link
            to={`/verifier/${dossierId}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-gandehou-green px-5 py-2.5 font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/30"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le jumeau numérique
          </Link>
        )}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/15 px-5 py-2.5 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-4 focus-visible:ring-gandehou-green/30 dark:border-white/15 dark:hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Vérifier un autre document
        </button>
      </div>
    </div>
  )
}
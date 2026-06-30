import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bitcoin,
  FileText,
  FileUp,
  FileWarning,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { PortalNav } from '@/components/PortalNav'
import { cn } from '@/lib/cn'

// Maps to documents.ots_status: pending -> provisional, confirmed -> authentic, mismatch -> tampered.
type Verdict = 'provisional' | 'authentic' | 'tampered'
type Status = 'idle' | 'loading' | Verdict

export default function VerificationPortal() {
  const [status, setStatus] = useState<Status>('idle')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file?: File | null) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    setError('')
    setFileName(file.name)
    setStatus('loading')
    // TODO(api): recompute SHA-256, compare to the anchored hash, read ots_status:
    //   pending -> 'provisional' | confirmed -> 'authentic' | mismatch -> 'tampered'
    setTimeout(() => setStatus('provisional'), 1200)
  }

  const reset = () => {
    setStatus('idle')
    setFileName('')
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
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-900/40 dark:text-white/40">
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
              </div>
            </>
          )}

          {status === 'loading' && (
            <div role="status" className="flex flex-col items-center justify-center rounded-3xl border border-black/10 px-6 py-16 text-center dark:border-white/10">
              <Loader2 className="h-10 w-10 animate-spin text-gandehou-green" />
              <p className="mt-4 font-medium">Analyse en cours…</p>
              {fileName && <p className="mt-1 text-sm text-neutral-900/55 dark:text-white/55">{fileName}</p>}
            </div>
          )}

          {(status === 'provisional' || status === 'authentic' || status === 'tampered') && (
            <VerdictPanel status={status} fileName={fileName} onReset={reset} />
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
    message: 'Attestation de voisinage authentique, en attente de la Mairie.',
    disclaimer: 'Document provisoire — sans valeur de titre de propriété.',
    live: 'polite' as const,
  },
  authentic: {
    icon: ShieldCheck,
    panel: 'bg-gandehou-green/10 border-gandehou-green/30',
    accent: 'text-gandehou-green',
    title: 'Document authentique',
    message:
      "L'empreinte du document correspond exactement à la version horodatée et ancrée sur Bitcoin.",
    disclaimer: 'Toute altération future serait détectable et horodatée publiquement.',
    live: 'polite' as const,
  },
  tampered: {
    icon: ShieldAlert,
    panel: 'bg-gandehou-red/10 border-gandehou-red/40',
    accent: 'text-gandehou-red',
    title: 'Alerte : document modifié',
    message:
      "L'empreinte ne correspond pas à la version ancrée. Ce document a été altéré — ne poursuivez pas la transaction.",
    disclaimer: '',
    live: 'assertive' as const,
  },
}

function VerdictPanel({ status, fileName, onReset }: { status: Verdict; fileName: string; onReset: () => void }) {
  const reduce = useReducedMotion()
  const v = VERDICTS[status]
  const Icon = v.icon

  return (
    <div role="status" aria-live={v.live} className={cn('rounded-3xl border p-8 text-center', v.panel)}>
      {/* Gentle pulse on alert only — never a flash. Off under reduced motion. */}
      <motion.div
        className="mx-auto w-fit"
        animate={status === 'tampered' && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={status === 'tampered' && !reduce ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : undefined}
      >
        <Icon className={cn('h-16 w-16', v.accent)} />
      </motion.div>

      <h2 className="mt-6 text-2xl font-semibold">{v.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-neutral-900/70 dark:text-white/70">{v.message}</p>

      {status === 'authentic' && (
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-gandehou-green px-4 py-2 text-sm font-semibold text-white">
          <Bitcoin className="h-4 w-4" />
          Intégrité ancrée sur Bitcoin
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

      <div>
        <button type="button" onClick={onReset} className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-black/15 px-5 py-2.5 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-4 focus-visible:ring-gandehou-green/30 dark:border-white/15 dark:hover:bg-white/10">
          <RefreshCw className="h-4 w-4" />
          Vérifier un autre document
        </button>
      </div>
    </div>
  )
}
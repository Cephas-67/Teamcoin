import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bitcoin,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
// adjust path to where you placed PortalNav
import { cn } from '@/lib/cn'
import { PortalNav } from '@/components/PortalNav'

type Verdict = 'amber' | 'green' | 'red'
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
    // TODO(api): POST `file` to the verification endpoint, then map the response:
    //   'provisional' -> 'amber' | 'certified' -> 'green' | 'tampered' -> 'red'
    setTimeout(() => setStatus('amber'), 1200) // placeholder verdict
  }

  const reset = () => {
    setStatus('idle')
    setFileName('')
    setError('')
  }

  return (
    <div className="min-h-screen w-full bg-white text-black dark:bg-neutral-950 dark:text-white">
      <PortalNav backTo="/citizen-portal" />

      <main className="mx-auto w-full max-w-2xl px-6 pb-20">
        <h1 className="text-center text-3xl font-semibold xl:text-5xl">Vérifier un document</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-black/60 dark:text-white/60">
          Glissez la convention au format PDF pour contrôler instantanément son authenticité.
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
                    ? 'border-green-600 bg-green-50 dark:bg-green-400/10'
                    : 'border-black/15 dark:border-white/15',
                )}
              >
                <UploadCloud className="h-12 w-12 text-green-700 dark:text-green-400" />
                <p className="mt-4 text-lg font-medium">Glissez le PDF de la convention ici</p>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">ou</p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 rounded-2xl bg-black px-6 py-2.5 font-medium text-white outline-none transition-colors hover:bg-green-500 focus-visible:ring-4 focus-visible:ring-green-600/40 dark:bg-white dark:text-black dark:hover:bg-green-400 dark:hover:text-white"
                >
                  Parcourir mes fichiers
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {error && (
                  <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              {/* DEV ONLY — remove once wired to the API. Lets you review each verdict design. */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-black/40 dark:text-white/40">
                <span>Aperçu démo :</span>
                {(['amber', 'green', 'red'] as Verdict[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setFileName('convention-demo.pdf')
                      setStatus(v)
                    }}
                    className="rounded-md border border-black/15 px-2 py-1 capitalize transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    {v === 'amber' ? 'Ambre' : v === 'green' ? 'Vert' : 'Rouge'}
                  </button>
                ))}
              </div>
            </>
          )}

          {status === 'loading' && (
            <div
              role="status"
              className="flex flex-col items-center justify-center rounded-3xl border border-black/10 px-6 py-16 text-center dark:border-white/10"
            >
              <Loader2 className="h-10 w-10 animate-spin text-green-600" />
              <p className="mt-4 font-medium">Analyse en cours…</p>
              {fileName && (
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">{fileName}</p>
              )}
            </div>
          )}

          {(status === 'amber' || status === 'green' || status === 'red') && (
            <VerdictPanel status={status} fileName={fileName} onReset={reset} />
          )}
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Verdict panels — three dynamic designs
 * ------------------------------------------------------------------ */
const VERDICTS = {
  amber: {
    icon: Clock,
    panel: 'bg-amber-50 border-amber-300 dark:bg-amber-400/10 dark:border-amber-400/30',
    accent: 'text-amber-600 dark:text-amber-400',
    title: 'Attestation provisoire',
    message: 'Attestation de voisinage authentique, en attente de la Mairie.',
    live: 'polite' as const,
  },
  green: {
    icon: ShieldCheck,
    panel: 'bg-green-50 border-green-300 dark:bg-green-400/10 dark:border-green-400/30',
    accent: 'text-green-600 dark:text-green-400',
    title: 'Acte authentique',
    message: 'Ce document est vérifié, définitif et certifié.',
    live: 'polite' as const,
  },
  red: {
    icon: ShieldAlert,
    panel: 'bg-red-50 border-red-400 dark:bg-red-500/10 dark:border-red-500/40',
    accent: 'text-red-600 dark:text-red-400',
    title: 'Alerte : document modifié',
    message: 'Ce document a été altéré. Ne poursuivez pas la transaction.',
    live: 'assertive' as const,
  },
}

function VerdictPanel({
  status,
  fileName,
  onReset,
}: {
  status: Verdict
  fileName: string
  onReset: () => void
}) {
  const reduce = useReducedMotion()
  const v = VERDICTS[status]
  const Icon = v.icon

  return (
    <div
      role="status"
      aria-live={v.live}
      className={cn('rounded-3xl border p-8 text-center', v.panel)}
    >
      {/* Gentle pulse on alert only — never a flash. Disabled under reduced-motion. */}
      <motion.div
        className="mx-auto w-fit"
        animate={status === 'red' && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={
          status === 'red' && !reduce
            ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
            : undefined
        }
      >
        <Icon className={cn('h-16 w-16', v.accent)} />
      </motion.div>

      <h2 className="mt-6 text-2xl font-semibold">{v.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-black/70 dark:text-white/70">{v.message}</p>

      {status === 'green' && (
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white">
          <Bitcoin className="h-4 w-4" />
          Acte Immuable et Certifié sur Bitcoin
        </span>
      )}

      {fileName && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-sm dark:bg-white/10">
          <FileText className="h-4 w-4 opacity-60" />
          {fileName}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={onReset}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-black/15 px-5 py-2.5 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-4 focus-visible:ring-green-600/30 dark:border-white/15 dark:hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Vérifier un autre document
        </button>
      </div>
    </div>
  )
}
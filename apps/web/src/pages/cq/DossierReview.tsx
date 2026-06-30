import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import QRCode from 'qrcode'
import {
  ArrowLeft, Bitcoin, Check, CheckCircle2, Loader2, MessageCircle,
  ShieldCheck, X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatusChip } from '@/components/StatusChip'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import logo from '@/assets/logo.svg'
import { cn } from '@/lib/cn'

// Full dossier row (spec p.14).
type Dossier = {
  id: string
  statut: 'brouillon' | 'atteste_cq' | 'valide_mairie'
  vendeur_nom: string
  vendeur_cip: string
  acheteur_nom: string
  acheteur_cip: string
  acheteur_nationalite: string
  departement: string | null
  commune: string | null
  arrondissement: string | null
  quartier: string | null
  superficie_m2: number | null
  zone: 'urbaine' | 'rurale' | null
  origine_droit: string | null
  voisin_nord: string | null
  voisin_sud: string | null
  voisin_est: string | null
  voisin_ouest: string | null
  created_at: string
}

// ── Demo OTP (spec p.11: "OTP simulé affiché à l'écran") ──────────────────
const DEMO_OTP = '040305'

export default function DossierReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { chef } = useAuth()

  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // OTP modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Post-confirmation attestation state
  const [confirmed, setConfirmed] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [attestationNum, setAttestationNum] = useState('')

  useEffect(() => {
    if (!id) return
    supabase
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setFetchError(error?.message ?? 'Dossier introuvable.'); setLoading(false); return }
        setDossier(data as Dossier)
        // If already confirmed, go straight to the attestation screen.
        if ((data as Dossier).statut === 'atteste_cq') buildAttestation(id)
        setLoading(false)
      })
  }, [id])

  const buildAttestation = async (dossierId: string) => {
    const num = `ATT-CQ-${dossierId.slice(0, 8).toUpperCase()}`
    const link = `${window.location.origin}/verifier/${dossierId}`
    try {
      const url = await QRCode.toDataURL(link, { width: 220, margin: 1 })
      setQrDataUrl(url)
    } catch { /* QR unavailable — still show the rest */ }
    setAttestationNum(num)
    setConfirmed(true)
  }

  const handleConfirm = async () => {
    if (otp.length < 6) return setOtpError('Entre le code à 6 chiffres.')
    if (otp !== DEMO_OTP) { setOtpError('Code incorrect. (démo : 040305)'); setOtp(''); return }
    setOtpError(''); setConfirming(true)

    // TODO(api): update dossiers.statut → 'atteste_cq', insert into
    // dossier_status_history, trigger PDF generation Edge Function.
    const { error } = await supabase
      .from('dossiers')
      .update({ statut: 'atteste_cq' })
      .eq('id', id!)

    if (error) { setOtpError(error.message); setConfirming(false); return }

    setModalOpen(false)
    await buildAttestation(id!)
    setConfirming(false)
  }

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && modalOpen) handleConfirm()
  }, [otp])

  if (loading) return <FullPageLoader />
  if (fetchError || !dossier) return <FullPageError msg={fetchError} />

  // ── Attestation share screen (post-confirmation) ─────────────────────────
  if (confirmed) {
    const shareLink = `${window.location.origin}/verifier/${dossier.id}`
    const waMsg = `Bonjour, voici l'attestation de voisinage Gandehou pour le dossier ${attestationNum}. Lien de vérification : ${shareLink}`
    return (
      <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
        <PageHeader backTo="/cq/dashboard" />
        <main className="mx-auto max-w-sm px-6 pb-20 pt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gandehou-green/15">
            <CheckCircle2 className="h-8 w-8 text-gandehou-green" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Attestation émise</h1>
          <p className="mt-2 text-sm text-neutral-900/60 dark:text-white/60">
            Le bon voisinage a été confirmé. L'attestation provisoire est prête à partager.
          </p>

          {/* Attestation card */}
          <div className="mt-8 rounded-2xl border border-gandehou-green/30 bg-gandehou-green/10 p-6">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gandehou-green">
              <ShieldCheck className="h-4 w-4" />
              {attestationNum}
            </div>
            <StatusChip status="atteste_cq" className="mx-auto mt-3" />

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code vers /verifier/${dossier.id}`}
                className="mx-auto mt-5 h-[140px] w-[140px] rounded-xl"
              />
            ) : (
              <div className="mx-auto mt-5 flex h-[140px] w-[140px] items-center justify-center rounded-xl bg-black/5 text-xs text-neutral-900/40 dark:bg-white/5 dark:text-white/40">
                QR indisponible
              </div>
            )}

            <p className="mt-3 text-xs text-neutral-900/50 dark:text-white/50">
              Document provisoire — sans valeur de titre de propriété.
            </p>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
          >
            <MessageCircle className="h-6 w-6" />
            Envoyer par WhatsApp
          </a>
          <Link
            to="/cq/dashboard"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-black/10 px-6 py-3 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
          >
            Retour au tableau de bord
          </Link>
        </main>
      </div>
    )
  }

  // ── Parcelle review screen ───────────────────────────────────────────────
  const loc = [dossier.quartier, dossier.arrondissement, dossier.commune, dossier.departement]
    .filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <PageHeader backTo="/cq/dashboard" />

      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-2">
        {/* Status + ID */}
        <div className="mb-5 flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-900/40 dark:text-white/40">
            {dossier.id.slice(0, 8).toUpperCase()}
          </span>
          <StatusChip status={dossier.statut === 'brouillon' ? 'brouillon' : 'atteste_cq'} />
        </div>

        <div className="space-y-4">
          {/* Parties */}
          <Section title="Vendeur">
            <Row label="Noms et prénoms" value={dossier.vendeur_nom} />
            <Row label="CIP / Passeport" value={dossier.vendeur_cip} />
          </Section>

          <Section title="Acheteur">
            <Row label="Noms et prénoms" value={dossier.acheteur_nom} />
            <Row label="Nationalité" value={dossier.acheteur_nationalite} />
            <Row label="CIP / Passeport" value={dossier.acheteur_cip} />
          </Section>

          {/* Parcelle */}
          <Section title="Parcelle">
            {loc && <Row label="Localisation" value={loc} />}
            {dossier.superficie_m2 && (
              <Row label="Superficie" value={`${dossier.superficie_m2.toLocaleString('fr-FR')} m²`} />
            )}
            {dossier.zone && <Row label="Zone" value={dossier.zone} className="capitalize" />}
            {dossier.origine_droit && <Row label="Origine du droit" value={dossier.origine_droit.replace(/_/g, ' ')} />}
          </Section>

          {/* Voisinage — the CQ validates this */}
          <Section title="Voisinage déclaré" accent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { dir: 'Nord', val: dossier.voisin_nord },
                { dir: 'Sud', val: dossier.voisin_sud },
                { dir: 'Est', val: dossier.voisin_est },
                { dir: 'Ouest', val: dossier.voisin_ouest },
              ].map(({ dir, val }) => (
                <div key={dir} className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-medium text-neutral-900/50 dark:text-white/50">{dir}</p>
                  <p className="mt-0.5 text-sm font-medium">{val ?? '—'}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Fixed bottom CTA ───────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-black/10 bg-gandehou-paper px-4 py-4 dark:border-white/10 dark:bg-neutral-950">
          <div className="mx-auto max-w-xl">
            <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-4 text-lg font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
                >
                  <Check className="h-5 w-5" />
                  Confirmer le bon voisinage
                </button>
              </Dialog.Trigger>

              {/* ── OTP Modal ──────────────────────────────────────────── */}
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-gandehou-paper px-6 pb-10 pt-6 shadow-xl outline-none dark:bg-neutral-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
                  <div className="mb-1 flex items-start justify-between">
                    <Dialog.Title className="text-xl font-semibold">
                      Signature OTP
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button type="button" aria-label="Fermer" className="rounded-lg p-1 text-neutral-900/50 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/50 dark:hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <Dialog.Description className="mb-6 text-sm text-neutral-900/60 dark:text-white/60">
                    Un code à 6 chiffres vous a été envoyé par SMS (MTN / Moov).
                    <span className="ml-1 font-medium text-gandehou-green">(Démo : 040305)</span>
                  </Dialog.Description>

                  <OTPInput value={otp} onChange={(v) => { setOtp(v); if (otpError) setOtpError('') }} />

                  {otpError && (
                    <p role="alert" className="mt-4 text-center text-sm text-gandehou-red">{otpError}</p>
                  )}

                  {confirming && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-900/60 dark:text-white/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement en cours…
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={otp.length < 6 || confirming}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-3 font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-50"
                  >
                    {confirming ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    Valider l'attestation
                  </button>

                  <p className="mt-4 text-center text-xs leading-relaxed text-neutral-900/45 dark:text-white/45">
                    Votre signature confirme l'exactitude des noms de voisinage déclarés.
                    L'attestation générée est provisoire — sans valeur de titre de propriété.
                  </p>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Sub-components
 * ------------------------------------------------------------------ */
function PageHeader({ backTo }: { backTo: string }) {
  return (
    <header className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
      <Link to="/" aria-label="Gandehou — Accueil">
        <img src={logo} alt="Gandehou" className="h-8 w-auto" />
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to={backTo}
          className="flex items-center gap-2 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/60 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gandehou-paper dark:bg-neutral-950">
      <Loader2 className="h-8 w-8 animate-spin text-gandehou-green" />
      <span className="sr-only">Chargement du dossier…</span>
    </div>
  )
}

function FullPageError({ msg }: { msg: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gandehou-paper px-6 text-center dark:bg-neutral-950">
      <p className="text-gandehou-red">{msg || 'Dossier introuvable.'}</p>
      <Link to="/cq/dashboard" className="text-sm text-gandehou-green underline">
        Retour au tableau de bord
      </Link>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl border p-4',
      accent
        ? 'border-gandehou-yellow/40 bg-gandehou-yellow/10 dark:bg-gandehou-yellow/5'
        : 'border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]',
    )}>
      <p className={cn('mb-3 text-xs font-semibold uppercase tracking-wider', accent ? 'text-amber-700 dark:text-gandehou-yellow' : 'text-neutral-900/50 dark:text-white/50')}>
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-neutral-900/55 dark:text-white/55">{label}</span>
      <span className={cn('text-right font-medium', className)}>{value}</span>
    </div>
  )
}

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  useEffect(() => { inputs.current[0]?.focus() }, [])

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (!/^\d*$/.test(v)) return
    const arr = value.split('')
    arr[i] = v.slice(-1)
    onChange(arr.join('').slice(0, 6))
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus()
  }
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(p)
    inputs.current[Math.min(p.length, 5)]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          aria-label={`Chiffre ${i + 1}`}
          className="h-14 w-11 rounded-xl border border-black/10 bg-white text-center text-xl font-bold text-black outline-none transition focus:border-gandehou-green focus:ring-4 focus:ring-gandehou-green/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
      ))}
    </div>
  )
}
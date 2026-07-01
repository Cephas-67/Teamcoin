import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import QRCode from 'qrcode'
import {
  ArrowLeft, Bitcoin, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Landmark, Loader2, ShieldCheck, X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatusChip } from '@/components/StatusChip'
import { FingerprintCapture, type CapturedSignature } from '@/components/FingerprintCapture'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import logo from '@/public/logo.svg'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */
type Dossier = {
  id: string
  statut: 'brouillon' | 'atteste_cq' | 'valide_mairie'
  vendeur_nom: string; vendeur_cip: string
  acheteur_nom: string; acheteur_cip: string; acheteur_nationalite: string
  departement: string | null; commune: string | null
  arrondissement: string | null; quartier: string | null
  superficie_m2: number | null
  zone: 'urbaine' | 'rurale' | null
  origine_droit: string | null
  voisin_nord: string | null; voisin_sud: string | null
  voisin_est: string | null; voisin_ouest: string | null
  created_at: string
}

type Document = {
  id: string
  type: 'attestation_provisoire' | 'convention_finale'
  sha256: string
  ots_status: 'pending' | 'confirmed' | 'mismatch'
  created_at: string
}

type HistoryRow = {
  id: string
  ancien_statut: string | null
  nouveau_statut: string
  changed_at: string
}

export default function DossierValidation() {
  const { id } = useParams<{ id: string }>()
  const { chef } = useAuth()

  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Confirmation dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [validating, setValidating] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [notaireSignature, setNotaireSignature] = useState<CapturedSignature | null>(null)

  // Post-validation state
  const [validated, setValidated] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [conventionNum, setConventionNum] = useState('')

  // Audit trail toggle
  const [historyOpen, setHistoryOpen] = useState(false)

  const load = async () => {
    if (!id) return
    const [
      { data: dos, error: dosErr },
      { data: docs },
      { data: hist },
    ] = await Promise.all([
      supabase.from('dossiers').select('*').eq('id', id).single(),
      supabase.from('documents').select('*').eq('dossier_id', id).order('created_at'),
      supabase
        .from('dossier_status_history')
        .select('id,ancien_statut,nouveau_statut,changed_at')
        .eq('dossier_id', id)
        .order('changed_at'),
    ])

    if (dosErr || !dos) {
      setFetchError(dosErr?.message ?? 'Dossier introuvable.')
      setLoading(false)
      return
    }

    setDossier(dos as Dossier)
    setDocuments((docs ?? []) as Document[])
    setHistory((hist ?? []) as HistoryRow[])

    if ((dos as Dossier).statut === 'valide_mairie') {
      await buildConvention(id, docs as Document[])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const buildConvention = async (dossierId: string, docs: Document[]) => {
    const num = `CONV-${dossierId.slice(0, 8).toUpperCase()}`
    const link = `${window.location.origin}/verifier/${dossierId}`
    try {
      const url = await QRCode.toDataURL(link, { width: 220, margin: 1 })
      setQrDataUrl(url)
    } catch { /* QR unavailable */ }
    setConventionNum(num)
    setValidated(true)
  }

  const handleValidate = async () => {
    if (!id || !dossier) return
    setValidating(true)
    setDialogError('')

    // The provisional document's SHA-256 becomes hash_parent in the
    // convention_finale row — this is the chain-of-custody link (spec p.14).
    const provisional = documents.find((d) => d.type === 'attestation_provisoire')
    const hashParent = provisional?.sha256 ?? null

    // TODO(sha256): compute real SHA-256 of the generated convention PDF.
    // For the demo, use a placeholder so the DB insert still works.
    const conventionSha256 = `demo-${crypto.randomUUID()}`

    // 1. Update dossier status.
    const { error: updateErr } = await supabase
      .from('dossiers')
      .update({ statut: 'valide_mairie' })
      .eq('id', id)

    if (updateErr) { setDialogError(updateErr.message); setValidating(false); return }

    // 2. Audit trail entry.
    await supabase.from('dossier_status_history').insert({
      dossier_id: id,
      ancien_statut: 'atteste_cq',
      nouveau_statut: 'valide_mairie',
      acteur: chef?.id ?? null,
    })

    // 3. Convention finale document row with hash chaining + notaire signature.
    const { error: docErr } = await supabase.from('documents').insert({
      dossier_id: id,
      type: 'convention_finale',
      sha256: conventionSha256,
      hash_parent: hashParent, // chains provisional → final
      ots_status: 'pending',
      // TODO(api): pass notaireSignature.publicKeyHash into the PDF metadata
      // via createChainedDocument. The combined hash formula becomes:
      //   acc = SHA-256(conventionSha256 + "::" + notaireSignature.publicKeyHash)
      // This is the hash that gets anchored on Bitcoin.
    })

    if (docErr) { setDialogError(docErr.message); setValidating(false); return }

    setDialogOpen(false)
    await buildConvention(id, documents)
    setValidating(false)
  }

  if (loading) return <FullPageLoader />
  if (fetchError || !dossier) return <FullPageError msg={fetchError} />

  /* ── Post-validation convention screen ──────────────────────────── */
  if (validated) {
    const shareLink = `${window.location.origin}/verifier/${dossier.id}`
    const waMsg = `La convention foncière Gandehou n° ${conventionNum} est validée par la Mairie. Vérifiez l'authenticité ici : ${shareLink}`
    return (
      <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
        <PageHeader backTo="/mairie/dashboard" />
        <main className="mx-auto max-w-sm px-6 pb-20 pt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gandehou-green/15">
            <Landmark className="h-8 w-8 text-gandehou-green" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Convention validée</h1>
          <p className="mt-2 text-sm text-neutral-900/60 dark:text-white/60">
            La Mairie a approuvé ce dossier. La convention finale est ancrée sur Bitcoin.
          </p>

          {/* Convention card */}
          <div className="mt-8 rounded-2xl border border-gandehou-green/30 bg-gandehou-green/10 p-6">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gandehou-green">
              <ShieldCheck className="h-4 w-4" />
              {conventionNum}
            </div>
            <StatusChip status="valide_mairie" className="mx-auto mt-3" />
            <div className="mx-auto mt-4 flex items-center justify-center gap-1.5 rounded-full bg-gandehou-green px-4 py-1.5 text-xs font-semibold text-white">
              <Bitcoin className="h-3.5 w-3.5" />
              Ancrage Bitcoin en cours
            </div>
            <StatusChip status="ots_pending" className="mx-auto mt-2" />

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
          </div>

          <a
            href={`https://wa.me/2290147799236?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
          >
            Envoyer la convention par WhatsApp
          </a>
          <Link
            to="/mairie/dashboard"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-black/10 px-6 py-3 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
          >
            Retour au tableau de bord
          </Link>
        </main>
      </div>
    )
  }

  /* ── Dossier review screen ──────────────────────────────────────── */
  const provisional = documents.find((d) => d.type === 'attestation_provisoire')
  const loc = [dossier.quartier, dossier.arrondissement, dossier.commune, dossier.departement]
    .filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <PageHeader backTo="/mairie/dashboard" />

      <main className="mx-auto w-full max-w-xl px-4 pb-32 pt-2">
        {/* Status + ID */}
        <div className="mb-5 flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-900/40 dark:text-white/40">
            {dossier.id.slice(0, 8).toUpperCase()}
          </span>
          <StatusChip status="atteste_cq" />
        </div>

        <div className="space-y-4">
          <Section title="Vendeur">
            <Row label="Noms et prénoms" value={dossier.vendeur_nom} />
            <Row label="CIP / Passeport" value={dossier.vendeur_cip} />
          </Section>

          <Section title="Acheteur">
            <Row label="Noms et prénoms" value={dossier.acheteur_nom} />
            <Row label="Nationalité" value={dossier.acheteur_nationalite} />
            <Row label="CIP / Passeport" value={dossier.acheteur_cip} />
          </Section>

          <Section title="Parcelle">
            {loc && <Row label="Localisation" value={loc} />}
            {dossier.superficie_m2 && (
              <Row label="Superficie" value={`${dossier.superficie_m2.toLocaleString('fr-FR')} m²`} />
            )}
            {dossier.zone && <Row label="Zone" value={dossier.zone} className="capitalize" />}
            {dossier.origine_droit && (
              <Row label="Origine du droit" value={dossier.origine_droit.replace(/_/g, ' ')} />
            )}
          </Section>

          <Section title="Voisinage attesté CQ" accent>
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

          {/* Provisional attestation info + chain anchor */}
          {provisional && (
            <Section title="Attestation provisoire (CQ)">
              <Row label="Statut OTS" value={provisional.ots_status === 'confirmed' ? 'Ancré sur Bitcoin' : 'En attente'} />
              <div>
                <p className="text-xs text-neutral-900/55 dark:text-white/55">SHA-256</p>
                <p className="mt-0.5 break-all font-mono text-xs text-neutral-900 dark:text-white">
                  {provisional.sha256}
                </p>
                <p className="mt-1 text-xs text-neutral-900/45 dark:text-white/45">
                  Ce hash sera inclus dans les métadonnées de la convention finale (chaînage).
                </p>
              </div>
            </Section>
          )}

          {/* Audit trail */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setHistoryOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-gandehou-green"
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-900/50 dark:text-white/50">
                  <Clock className="h-3.5 w-3.5" />
                  Piste d'audit
                </span>
                {historyOpen
                  ? <ChevronUp className="h-4 w-4 text-neutral-900/40 dark:text-white/40" />
                  : <ChevronDown className="h-4 w-4 text-neutral-900/40 dark:text-white/40" />
                }
              </button>
              {historyOpen && (
                <ul className="border-t border-black/5 px-4 pb-4 pt-2 dark:border-white/5">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-start gap-3 py-2">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gandehou-green" />
                      <div>
                        <p className="text-sm font-medium">
                          {h.ancien_statut
                            ? `${formatStatut(h.ancien_statut)} → ${formatStatut(h.nouveau_statut)}`
                            : formatStatut(h.nouveau_statut)}
                        </p>
                        <p className="text-xs text-neutral-900/50 dark:text-white/50">
                          {new Date(h.changed_at).toLocaleString('fr-FR', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Fixed bottom CTA ───────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-black/10 bg-gandehou-paper px-4 py-4 dark:border-white/10 dark:bg-neutral-950">
          <div className="mx-auto max-w-xl">
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-4 text-lg font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
                >
                  <Landmark className="h-5 w-5" />
                  Approuver et notariser
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-gandehou-paper px-6 pb-10 pt-6 shadow-xl outline-none dark:bg-neutral-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
                  <div className="mb-2 flex items-start justify-between">
                    <Dialog.Title className="text-xl font-semibold">
                      Confirmer la validation
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button type="button" aria-label="Fermer" className="rounded-lg p-1 text-neutral-900/50 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/50 dark:hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <Dialog.Description className="mb-6 text-sm text-neutral-900/60 dark:text-white/60">
                    En approuvant ce dossier, vous déclenchez la génération de la convention finale.
                    Le hash de l'attestation provisoire sera chaîné dans les métadonnées du
                    document final et ancré sur Bitcoin via OpenTimestamps.
                  </Dialog.Description>

                  {/* Summary recap */}
                  <div className="mb-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                    <p className="font-medium">{dossier.vendeur_nom} → {dossier.acheteur_nom}</p>
                    {loc && <p className="mt-0.5 text-neutral-900/60 dark:text-white/60">{loc}</p>}
                  </div>

                  {/* Notaire digital signature — required before validation */}
                  <div className="mb-4">
                    <FingerprintCapture
                      signataireNom={chef?.email?.split('@')[0] ?? 'Notaire'}
                      onCaptured={setNotaireSignature}
                    />
                  </div>

                  {dialogError && (
                    <div role="alert" className="mb-4 rounded-xl border border-gandehou-red/30 bg-gandehou-red/10 px-3 py-2 text-sm text-gandehou-red">
                      {dialogError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={validating || !notaireSignature}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-3 font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-50"
                  >
                    {validating
                      ? <><Loader2 className="h-5 w-5 animate-spin" />Enregistrement…</>
                      : <><CheckCircle2 className="h-5 w-5" />Confirmer et générer la convention</>
                    }
                  </button>
                  {!notaireSignature && (
                    <p className="mt-3 text-center text-xs text-neutral-900/45 dark:text-white/45">
                      La signature biométrique du notaire est requise pour valider.
                    </p>
                  )}
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
 * Helpers
 * ------------------------------------------------------------------ */
function formatStatut(s: string): string {
  const map: Record<string, string> = {
    brouillon: 'Brouillon',
    atteste_cq: 'Attesté CQ',
    valide_mairie: 'Validé Mairie',
  }
  return map[s] ?? s
}

function PageHeader({ backTo }: { backTo: string }) {
  return (
    <header className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
      <Link to="/" aria-label="Gandehou — Accueil">
        <img src={logo} alt="Gandehou" className="h-8 w-auto" />
      </Link>
      <div className="flex items-center gap-3">
        <Link to={backTo} className="flex items-center gap-2 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/60 dark:hover:text-white">
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
      <span className="sr-only">Chargement…</span>
    </div>
  )
}

function FullPageError({ msg }: { msg: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gandehou-paper px-6 text-center dark:bg-neutral-950">
      <p className="text-gandehou-red">{msg || 'Dossier introuvable.'}</p>
      <Link to="/mairie/dashboard" className="text-sm text-gandehou-green underline">Retour</Link>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn('rounded-2xl border p-4', accent
      ? 'border-gandehou-yellow/40 bg-gandehou-yellow/10 dark:bg-gandehou-yellow/5'
      : 'border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]')}>
      <p className={cn('mb-3 text-xs font-semibold uppercase tracking-wider', accent
        ? 'text-amber-700 dark:text-gandehou-yellow'
        : 'text-neutral-900/50 dark:text-white/50')}>
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
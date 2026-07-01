/**
 * DossierTwin — /verifier/:id
 *
 * The public "digital twin" of a dossier. Reachable by anyone with the QR code
 * or WhatsApp link — no account required. Shows the live canonical status of
 * the dossier directly from the DB, not from a file upload.
 *
 * Three verdict states driven by documents.ots_status:
 *   pending   → Amber  (provisional, awaiting Bitcoin confirmation)
 *   confirmed → Green  (anchored on Bitcoin, immutable proof)
 *   mismatch  → Red    (tampering detected — hash divergence)
 *
 * Distinct from /verifier (VerificationPortal) which lets you upload a PDF
 * and verify it against the anchored hash.
 *
 * Route (public, no RequireAuth wrapper):
 *   <Route path="/verifier/:id" element={<DossierTwin />} />
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import QRCode from 'qrcode'
import {
  Clock,
  ExternalLink,
  FileWarning,
  Landmark,
  Link2,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { StatusChip } from '@/components/StatusChip'
import { supabase } from '@/lib/supabase'
import logo from '@/public/logo.svg'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */
type OtsStatus = 'pending' | 'confirmed' | 'mismatch'
type DossierStatut = 'brouillon' | 'atteste_cq' | 'valide_mairie'

type Dossier = {
  id: string
  statut: DossierStatut
  vendeur_nom: string
  acheteur_nom: string
  acheteur_nationalite: string
  departement: string | null
  commune: string | null
  arrondissement: string | null
  quartier: string | null
  superficie_m2: number | null
  zone: 'urbaine' | 'rurale' | null
  origine_droit: string | null
  created_at: string
}

type DocumentRow = {
  id: string
  type: 'attestation_provisoire' | 'convention_finale'
  sha256: string
  hash_parent: string | null
  ots_status: OtsStatus
  qr_code_url: string | null
  created_at: string
}

/* ------------------------------------------------------------------ *
 * Verdict configuration — maps DB state to charte design
 * ------------------------------------------------------------------ */
type VerdictKey = 'provisional_cq' | 'provisional_mairie' | 'confirmed' | 'mismatch' | 'brouillon'

const VERDICT: Record<VerdictKey, {
  icon: typeof ShieldCheck
  panel: string
  accent: string
  badge: string | null
  title: string
  message: string
  disclaimer: string
  live: 'polite' | 'assertive'
}> = {
  brouillon: {
    icon: Clock,
    panel: 'border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]',
    accent: 'text-neutral-900/50 dark:text-white/50',
    badge: null,
    title: 'Dossier en cours de traitement',
    message: 'Ce dossier a été initié par le citoyen et est en attente d\'attestation par le Chef de Quartier.',
    disclaimer: 'Document brouillon — sans valeur légale.',
    live: 'polite',
  },
  provisional_cq: {
    icon: FileWarning,
    panel: 'border-gandehou-yellow/40 bg-gandehou-yellow/15 dark:bg-gandehou-yellow/5',
    accent: 'text-amber-600 dark:text-gandehou-yellow',
    badge: null,
    title: 'Attestation de voisinage provisoire',
    message: 'Le Chef de Quartier a confirmé le bon voisinage. Le dossier est en attente de validation par la Mairie.',
    disclaimer: 'Document provisoire — sans valeur de titre de propriété. Gandehou atteste l\'intégrité du document, en amont du circuit légal (Notaire / ANDF).',
    live: 'polite',
  },
  provisional_mairie: {
    icon: Landmark,
    panel: 'border-gandehou-yellow/40 bg-gandehou-yellow/15 dark:bg-gandehou-yellow/5',
    accent: 'text-amber-600 dark:text-gandehou-yellow',
    badge: null,
    title: 'Validé par la Mairie · ancrage en cours',
    message: 'La Mairie a approuvé ce dossier. L\'ancrage cryptographique est en cours de confirmation (généralement 1 h).',
    disclaimer: 'Document provisoire en attente de confirmation d\'ancrage. Toute altération devient détectable dès la prochaine vérification.',
    live: 'polite',
  },
  confirmed: {
    icon: ShieldCheck,
    panel: 'border-gandehou-green/30 bg-gandehou-green/10 dark:bg-gandehou-green/5',
    accent: 'text-gandehou-green',
    badge: 'Intégrité ancrée cryptographiquement',
    title: 'Convention authentique et certifiée',
    message: 'Ce document a été horodaté et ancré cryptographiquement. Toute altération ultérieure serait détectable et prouvable publiquement.',
    disclaimer: '',
    live: 'polite',
  },
  mismatch: {
    icon: ShieldAlert,
    panel: 'border-gandehou-red/40 bg-gandehou-red/10 dark:bg-gandehou-red/5',
    accent: 'text-gandehou-red',
    badge: null,
    title: 'Alerte : document altéré',
    message: 'L\'empreinte de ce document ne correspond pas à la version ancrée. Ce document a été modifié — ne poursuivez pas la transaction.',
    disclaimer: '',
    live: 'assertive',
  },
}

function resolveVerdict(dossier: Dossier, latestDoc: DocumentRow | null): VerdictKey {
  if (!latestDoc) return 'brouillon'
  if (latestDoc.ots_status === 'mismatch') return 'mismatch'
  if (latestDoc.ots_status === 'confirmed') return 'confirmed'
  // pending — distinguish by dossier statut
  if (dossier.statut === 'valide_mairie') return 'provisional_mairie'
  if (dossier.statut === 'atteste_cq') return 'provisional_cq'
  return 'brouillon'
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */
export default function DossierTwin() {
  const { id } = useParams<{ id: string }>()
  const reduce = useReducedMotion()

  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [latestDoc, setLatestDoc] = useState<DocumentRow | null>(null)
  const [allDocs, setAllDocs] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!id) return

    Promise.all([
      supabase
        .from('dossiers')
        .select('id,statut,vendeur_nom,acheteur_nom,acheteur_nationalite,departement,commune,arrondissement,quartier,superficie_m2,zone,origine_droit,created_at')
        .eq('id', id)
        .single(),
      supabase
        .from('documents')
        .select('*')
        .eq('dossier_id', id)
        .order('created_at', { ascending: false }),
    ]).then(async ([{ data: dos, error: dosErr }, { data: docs }]) => {
      if (dosErr || !dos) {
        setFetchError(dosErr?.message ?? 'Dossier introuvable.')
        setLoading(false)
        return
      }
      setDossier(dos as Dossier)
      const docList = (docs ?? []) as DocumentRow[]
      setAllDocs(docList)
      setLatestDoc(docList[0] ?? null)

      // Generate QR linking back to this page (useful for printing the twin).
      try {
        const url = await QRCode.toDataURL(window.location.href, { width: 160, margin: 1 })
        setQrDataUrl(url)
      } catch { /* non-blocking */ }

      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gandehou-paper dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-gandehou-green" />
        <span className="sr-only">Chargement du dossier…</span>
      </div>
    )
  }

  if (fetchError || !dossier) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gandehou-paper px-6 text-center dark:bg-neutral-950">
        <ShieldAlert className="h-12 w-12 text-gandehou-red" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Dossier introuvable</h1>
        <p className="text-sm text-neutral-900/60 dark:text-white/60">
          {fetchError || 'Ce lien est invalide ou le dossier n\'existe pas.'}
        </p>
        <Link to="/verifier" className="mt-2 text-sm font-medium text-gandehou-green underline">
          Vérifier un document par PDF
        </Link>
      </div>
    )
  }

  const verdictKey = resolveVerdict(dossier, latestDoc)
  const v = VERDICT[verdictKey]
  const Icon = v.icon
  const loc = [dossier.quartier, dossier.arrondissement, dossier.commune, dossier.departement]
    .filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      {/* ── Minimal public header — no "Retour" button ─────────────── */}
      <header className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
        <Link to="/" aria-label="Gandehou — Accueil">
          <img src={logo} alt="Gandehou" className="h-8 w-auto" />
        </Link>
        <Link
          to="/verifier"
          className="flex items-center gap-1.5 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:text-gandehou-green focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/60"
        >
          <ExternalLink className="h-4 w-4" />
          Vérifier un PDF
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-8">
        {/* ── Verdict panel ───────────────────────────────────────── */}
        <div
          role="status"
          aria-live={v.live}
          className={cn('rounded-3xl border p-7 text-center', v.panel)}
        >
          <motion.div
            className="mx-auto w-fit"
            animate={verdictKey === 'mismatch' && !reduce
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }}
            transition={verdictKey === 'mismatch' && !reduce
              ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
              : undefined}
          >
            <Icon className={cn('mx-auto h-14 w-14', v.accent)} />
          </motion.div>

          <h1 className="mt-5 text-xl font-semibold">{v.title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-900/70 dark:text-white/70">
            {v.message}
          </p>

          {/* Ancrage badge — confirmed only */}
          {v.badge && (
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-gandehou-green px-4 py-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4" />
              {v.badge}
            </span>
          )}

          {/* Status chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <StatusChip status={
              dossier.statut === 'valide_mairie' ? 'valide_mairie'
              : dossier.statut === 'atteste_cq' ? 'atteste_cq'
              : 'brouillon'
            } />
            {latestDoc && (
              <StatusChip status={
                latestDoc.ots_status === 'confirmed' ? 'ots_confirmed'
                : latestDoc.ots_status === 'mismatch' ? 'ots_mismatch'
                : 'ots_pending'
              } />
            )}
          </div>

          {v.disclaimer && (
            <p className="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-neutral-900/50 dark:text-white/50">
              {v.disclaimer}
            </p>
          )}
        </div>

        {/* ── Dossier summary ─────────────────────────────────────── */}
        <div className="mt-6 space-y-3">
          <Section title="Parties">
            <InfoRow icon={UserCheck} label="Vendeur" value={dossier.vendeur_nom} />
            <InfoRow icon={UserCheck} label="Acheteur" value={`${dossier.acheteur_nom} (${dossier.acheteur_nationalite})`} />
          </Section>

          <Section title="Parcelle">
            {loc && <InfoRow icon={MapPin} label="Localisation" value={loc} />}
            {dossier.superficie_m2 && (
              <InfoRow icon={MapPin} label="Superficie" value={`${dossier.superficie_m2.toLocaleString('fr-FR')} m²`} />
            )}
            {dossier.zone && (
              <InfoRow icon={MapPin} label="Zone" value={dossier.zone} className="capitalize" />
            )}
          </Section>

          {/* Document chain — SHA-256 hashes for manual verification */}
          {allDocs.length > 0 && (
            <Section title="Chaîne de documents">
              {allDocs.map((doc, i) => (
                <div key={doc.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-neutral-900/70 dark:text-white/70 capitalize">
                      {doc.type === 'convention_finale' ? 'Convention finale' : 'Attestation CQ'}
                    </span>
                    <StatusChip
                      status={doc.ots_status === 'confirmed' ? 'ots_confirmed' : doc.ots_status === 'mismatch' ? 'ots_mismatch' : 'ots_pending'}
                      className="text-[10px]"
                    />
                  </div>
                  <p className="break-all font-mono text-[11px] text-neutral-900/50 dark:text-white/50">
                    {doc.sha256}
                  </p>
                  {doc.hash_parent && (
                    <p className="flex items-center gap-1 text-[11px] text-neutral-900/40 dark:text-white/40">
                      <Link2 className="h-3 w-3 shrink-0" />
                      Chaîné depuis : {doc.hash_parent.slice(0, 16)}…
                    </p>
                  )}
                  {i < allDocs.length - 1 && (
                    <div className="ml-1 mt-2 h-4 w-px bg-black/10 dark:bg-white/10" />
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Dates */}
          <Section title="Horodatage">
            <InfoRow
              icon={Clock}
              label="Initié le"
              value={new Date(dossier.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            />
            {latestDoc && (
              <InfoRow
                icon={latestDoc.ots_status === 'confirmed' ? ShieldCheck : Clock}
                label={latestDoc.ots_status === 'confirmed' ? 'Ancrage confirmé le' : 'Ancrage soumis le'}
                value={new Date(latestDoc.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              />
            )}
          </Section>
        </div>

        {/* ── QR code (canonical link to this page, for printing) ── */}
        {qrDataUrl && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white py-6 dark:border-white/10 dark:bg-white/[0.03]">
            <img
              src={qrDataUrl}
              alt="QR code vers ce jumeau numérique"
              className="h-[120px] w-[120px] rounded-xl"
            />
            <p className="text-xs text-neutral-900/50 dark:text-white/50">
              Scanner pour accéder au jumeau numérique
            </p>
          </div>
        )}

        {/* ── Footer disclaimer ───────────────────────────────────── */}
        <p className="mt-8 text-center text-xs leading-relaxed text-neutral-900/40 dark:text-white/40">
          Gandehou est une couche de preuve d'antériorité et d'intégrité cryptographique.
          Ce n'est pas un titre de propriété. Seuls le Notaire et l'ANDF délivrent des actes
          opposables aux tiers (art. 18 CFD).
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <Link to="/verifier" className="text-gandehou-green underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-gandehou-green">
            Vérifier un document PDF
          </Link>
          <span className="text-neutral-900/30 dark:text-white/30">·</span>
          <Link to="/" className="text-gandehou-green underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-gandehou-green">
            Accueil Gandehou
          </Link>
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Local sub-components
 * ------------------------------------------------------------------ */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-900/50 dark:text-white/50">
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Clock
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gandehou-green" aria-hidden />
      <span className="shrink-0 text-neutral-900/55 dark:text-white/55">{label}</span>
      <span className={cn('ml-auto text-right font-medium', className)}>{value}</span>
    </div>
  )
}
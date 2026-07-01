import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, FileText, MapPin, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatusChip } from '@/components/StatusChip'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { triggerUpgradeNow } from '@/services/anchor'
import logo from '../../public/logo.svg'
import { LogoutModal } from '@/components/LogoutModal'

type DossierStatut = 'brouillon' | 'soumis' | 'atteste_cq' | 'valide_mairie' | 'litige'

type DossierRow = {
  id: string
  statut: DossierStatut
  vendeur_nom: string
  acheteur_nom: string
  quartier: string | null
  commune: string | null
  superficie_m2: number | null
  created_at: string
  isNew?: boolean
}

export default function CqDashboard() {
  const { chef } = useAuth()
  const [dossiers, setDossiers] = useState<DossierRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cqQuartier, setCqQuartier] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgradeOts = async () => {
    setUpgrading(true)
    try {
      const res = await triggerUpgradeNow()
      if (res.ok && res.stats) {
        const { scanned, upgraded, stillPending, errors } = res.stats
        if (upgraded > 0) {
          toast.success(`${upgraded}/${scanned} preuves confirmées.`)
          load()
        } else if (scanned === 0) {
          toast.info('Aucune preuve en attente.')
        } else {
          toast.info(`${stillPending}/${scanned} encore en attente d'ancrage. Reessaie plus tard.`)
        }
        if (errors && errors.length > 0) {
          console.warn('[upgrade-ots] erreurs', errors)
        }
      } else {
        toast.error(res.error ?? 'Vérification échouée.')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setUpgrading(false)
    }
  }

  const load = async () => {
    if (!chef) return
    setLoading(true)
    setError('')

    // 1. Recupere le profil du CQ pour connaitre son quartier.
    const { data: profile } = await supabase
      .from('profiles')
      .select('quartier,commune')
      .eq('id', chef.id)
      .maybeSingle()

    const quartier = profile?.quartier ?? null
    setCqQuartier(quartier)

    // 2. Liste les dossiers soumis (ou brouillon legacy) de son quartier.
    let query = supabase
      .from('dossiers')
      .select('id,statut,vendeur_nom,acheteur_nom,quartier,commune,superficie_m2,created_at')
      .in('statut', ['soumis', 'brouillon'])
      .order('created_at', { ascending: false })

    if (quartier) query = query.eq('quartier', quartier)

    const { data, error: err } = await query
    if (err) { setError(err.message); setLoading(false); return }

    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    setDossiers(
      (data ?? []).map((d) => ({
        ...(d as DossierRow),
        isNew: new Date(d.created_at).getTime() > cutoff,
      }))
    )
    setLoading(false)
  }

  useEffect(() => { load() }, [chef?.id])

  const displayName = chef?.email?.split('@')[0] ?? chef?.phone ?? 'Chef'

  return (
    <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
        <Link to="/" aria-label="Gandehou — Accueil">
          <img src={logo} alt="Gandehou" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LogoutModal />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8">
        {/* ── Greeting ────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gandehou-green">Espace Chef de Quartier</p>
          <h1 className="mt-1 text-2xl font-semibold">Bonjour, {displayName}</h1>
          <p className="mt-1 text-sm text-neutral-900/60 dark:text-white/60">
            {cqQuartier
              ? `Dossiers soumis sur le quartier ${cqQuartier}.`
              : 'Dossiers en attente de votre attestation de voisinage.'}
          </p>
        </div>

        <Link
          to="/citizen-portal"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gandehou-green px-8 py-3.5 text-lg font-medium text-white transition-colors duration-300 hover:bg-gandehou-green/90"
        >
          Lancer une transaction
        </Link>

        {/* ── Action bar ──────────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-900/60 dark:text-white/60">
            {loading ? '…' : `${dossiers.length} dossier${dossiers.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpgradeOts}
              disabled={upgrading}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-sm font-medium text-neutral-900/70 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
              title="Force le passage pending → confirmed pour les preuves déjà minées"
            >
              <ShieldCheck className={`h-4 w-4 ${upgrading ? 'animate-spin' : ''}`} />
              {upgrading ? 'Vérification…' : 'Vérifier ancrage'}
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green disabled:opacity-40 dark:text-white/60 dark:hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-gandehou-red/30 bg-gandehou-red/10 px-4 py-3 text-sm text-gandehou-red">
            {error}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!loading && !error && dossiers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-black/15 py-16 text-center dark:border-white/15">
            <FileText className="h-10 w-10 text-neutral-900/25 dark:text-white/25" />
            <p className="mt-4 font-medium text-neutral-900/60 dark:text-white/60">Aucun dossier en attente</p>
            <p className="mt-1 text-sm text-neutral-900/40 dark:text-white/40">
              Les dossiers soumis par les citoyens apparaîtront ici.
            </p>
          </div>
        )}

        {/* ── Dossier list ────────────────────────────────────────── */}
        {!error && (
          <ul className="space-y-3">
            {dossiers.map((d) => (
              <li key={d.id}>
                <Link
                  to={`/cq/dossier/${d.id}`}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 outline-none transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-gandehou-green/30 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                >
                  {/* Top row: ID + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-neutral-900/40 dark:text-white/40">
                      {d.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <StatusChip status={d.statut === 'soumis' ? 'soumis' : 'brouillon'} />
                    </div>
                  </div>

                  {/* Parties */}
                  <div>
                    <p className="text-sm font-medium">{d.vendeur_nom} → {d.acheteur_nom}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-900/50 dark:text-white/50">
                    {(d.quartier || d.commune) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[d.quartier, d.commune].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {d.superficie_m2 && (
                      <span>{d.superficie_m2.toLocaleString('fr-FR')} m²</span>
                    )}
                    <span className="ml-auto tabular-nums">
                      {new Date(d.created_at).toLocaleString('fr-FR', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Loading skeleton */}
        {loading && (
          <ul className="space-y-3" aria-busy="true" aria-label="Chargement des dossiers">
            {[1, 2, 3].map((i) => (
              <li key={i} className="h-[108px] animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, LogOut, MapPin, RefreshCw } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatusChip } from '@/components/StatusChip'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import logo from '../../public/logo.svg'
import { LogoutModal } from '@/components/LogoutModal'

type DossierRow = {
    id: string
    statut: 'brouillon' | 'atteste_cq' | 'valide_mairie'
    vendeur_nom: string
    acheteur_nom: string
    quartier: string | null
    commune: string | null
    superficie_m2: number | null
    created_at: string
}

export default function MairieDashboard() {
    const { chef, logout } = useAuth()
    const [dossiers, setDossiers] = useState<DossierRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const load = async () => {
        setLoading(true)
        setError('')
        // Mairie agents see dossiers that the CQ has attested and are now
        // awaiting final municipal validation.
        // TODO(api): add .eq('commune', chef.commune) once profiles.commune
        // is used to scope agents to their municipality.
        const { data, error: err } = await supabase
            .from('dossiers')
            .select('id,statut,vendeur_nom,acheteur_nom,quartier,commune,superficie_m2,created_at')
            .eq('statut', 'atteste_cq')
            .order('created_at', { ascending: false })

        if (err) { setError(err.message); setLoading(false); return }
        setDossiers(data ?? [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const displayName = chef?.email?.split('@')[0] ?? 'Agent'

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

            <main className="mx-auto w-full max-w-xl px-4 pb-20 pt-8">
                {/* ── Greeting ────────────────────────────────────────────── */}
                <div className="mb-6">
                    <p className="text-sm font-medium text-gandehou-green">Espace Agent Mairie / Notaire</p>
                    <h1 className="mt-1 text-2xl font-semibold">Bonjour, {displayName}</h1>
                    <p className="mt-1 text-sm text-neutral-900/60 dark:text-white/60">
                        Dossiers attestés par un Chef de Quartier, en attente de validation finale.
                    </p>
                </div>

                {/* ── Action bar ──────────────────────────────────────────── */}
                <div className="mb-5 flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900/60 dark:text-white/60">
                        {loading ? '…' : `${dossiers.length} dossier${dossiers.length !== 1 ? 's' : ''}`}
                    </span>
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
                        <p className="mt-4 font-medium text-neutral-900/60 dark:text-white/60">
                            Aucun dossier en attente de validation
                        </p>
                        <p className="mt-1 text-sm text-neutral-900/40 dark:text-white/40">
                            Les dossiers attestés par les Chefs de Quartier apparaîtront ici.
                        </p>
                    </div>
                )}

                {/* ── Dossier list ────────────────────────────────────────── */}
                {!error && (
                    <ul className="space-y-3">
                        {dossiers.map((d) => (
                            <li key={d.id}>
                                <Link
                                    to={`/mairie/dossier/${d.id}`}
                                    className="flex w-full flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 outline-none transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-gandehou-green/30 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-mono text-xs text-neutral-900/40 dark:text-white/40">
                                            {d.id.slice(0, 8).toUpperCase()}
                                        </span>
                                        <StatusChip status="atteste_cq" />
                                    </div>
                                    <p className="text-sm font-medium">{d.vendeur_nom} → {d.acheteur_nom}</p>
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
                                        <span className="ml-auto">
                                            {new Date(d.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'short',
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
                    <ul className="space-y-3" aria-busy="true">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="h-[108px] animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
                        ))}
                    </ul>
                )}
            </main>
        </div>
    )
}
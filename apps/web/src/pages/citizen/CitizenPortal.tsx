import { useEffect, useState } from 'react'
import { ArrowRight, Clock, FilePlus2, MapPin, Search, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { PortalNav } from '@/components/PortalNav'
import { StatusChip, type ChipStatus } from '@/components/StatusChip'
import { supabase } from '@/lib/supabase'

type Journey = {
  id: string
  to: string
  title: string
  description: string
  cta: string
  icon: typeof FilePlus2
}

const JOURNEYS: Journey[] = [
  {
    id: 'dossier',
    to: '/dossier/nouveau',
    title: 'Initier un dossier',
    description:
      "Préparez votre dossier de transaction foncière depuis votre téléphone, étape par étape. Aucun compte requis.",
    cta: 'Commencer le dossier',
    icon: FilePlus2,
  },
  {
    id: 'verifier',
    to: '/verifier',
    title: 'Vérifier un document',
    description:
      "Banque ou notaire ? Glissez une convention pour contrôler instantanément son authenticité et son statut.",
    cta: 'Vérifier un document',
    icon: ShieldCheck,
  },
]

type DossierRow = {
  id: string
  statut: 'brouillon' | 'soumis' | 'atteste_cq' | 'valide_mairie' | 'litige'
  vendeur_nom: string
  acheteur_nom: string
  quartier: string | null
  commune: string | null
  superficie_m2: number | null
  created_at: string
}

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}
const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function CitizenPortal() {
  const reduceMotion = useReducedMotion()
  const [params] = useSearchParams()
  const listMotion = reduceMotion
    ? {}
    : { variants: list, initial: 'hidden' as const, animate: 'show' as const }
  const cardMotion = reduceMotion ? {} : { variants: card }

  const [phone, setPhone] = useState(() => {
    const fromUrl = params.get('phone')
    if (fromUrl) return fromUrl
    try { return localStorage.getItem('gandehou:citizen_phone') ?? '' } catch { return '' }
  })
  const [searching, setSearching] = useState(false)
  const [dossiers, setDossiers] = useState<DossierRow[] | null>(null)
  const [error, setError] = useState('')

  // Format canonique en DB : +229{10 digits} (Bénin 01 XX XX XX XX)
  const normalizePhone = (p: string): string => {
    const digits = p.replace(/\D+/g, '')
    if (digits.startsWith('229') && digits.length === 13) return `+${digits}`
    if (digits.length === 10 && digits.startsWith('0')) return `+229${digits}`
    return p.startsWith('+') ? p : digits
  }

  const lookup = async (p: string) => {
    const full = normalizePhone(p)
    if (!/^\+2290\d{9}$/.test(full)) return
    setSearching(true)
    setError('')
    const { data, error: err } = await supabase
      .from('dossiers')
      .select('id,statut,vendeur_nom,acheteur_nom,quartier,commune,superficie_m2,created_at')
      .or(`vendeur_phone.eq.${full},acheteur_phone.eq.${full}`)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setDossiers((data ?? []) as DossierRow[])
    setSearching(false)
    try { localStorage.setItem('gandehou:citizen_phone', full) } catch { /* prive */ }
  }

  useEffect(() => {
    if (phone) lookup(phone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen w-full bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <PortalNav backTo="/" />

      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-6 md:pt-10">
        <h1 className="text-center text-4xl font-semibold xl:text-6xl">Espace Citoyen</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-900/60 dark:text-white/60 xl:text-xl">
          Préparez ou vérifiez un dossier foncier en toute transparence — sans inscription.
        </p>

        <motion.ul {...listMotion} className="mt-12 grid list-none grid-cols-1 gap-6 md:grid-cols-2">
          {JOURNEYS.map((j) => {
            const Icon = j.icon
            return (
              <motion.li key={j.id} {...cardMotion} className="flex">
                <Link
                  to={j.to}
                  className="group flex w-full flex-col rounded-3xl border border-black/10 bg-gandehou-green/10 p-7 no-underline outline-none transition-all hover:-translate-y-1 hover:bg-gandehou-green/20 focus-visible:ring-4 focus-visible:ring-gandehou-green focus-visible:ring-offset-2 focus-visible:ring-offset-gandehou-paper dark:border-white/10 dark:bg-gandehou-green/15 dark:hover:bg-gandehou-green/25 dark:focus-visible:ring-offset-neutral-950 md:p-9"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gandehou-green/15 text-gandehou-green">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold">{j.title}</h2>
                  <p className="mt-2 text-base leading-relaxed text-neutral-900/60 dark:text-white/60">
                    {j.description}
                  </p>
                  <span className="mt-8 flex items-center gap-2 font-medium text-gandehou-green">
                    {j.cta}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>

        {/* ── Suivi de mes dossiers · lookup par numero de telephone ─── */}
        <section className="mt-16 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03] md:p-8">
          <h2 className="text-xl font-semibold md:text-2xl">Suivre mes dossiers</h2>
          <p className="mt-1 text-sm text-neutral-900/60 dark:text-white/60">
            Entrez votre numéro de téléphone pour voir les dossiers où vous êtes vendeur ou acheteur.
          </p>

          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => { e.preventDefault(); lookup(phone) }}
          >
            <div className="flex flex-1 overflow-hidden rounded-xl border border-black/10 focus-within:border-gandehou-green focus-within:ring-4 focus-within:ring-gandehou-green/20 dark:border-white/15">
              <span className="flex items-center bg-black/5 px-3 text-sm font-medium text-neutral-900/70 dark:bg-white/10 dark:text-white/70">+229</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="01 47 79 92 36"
                value={phone.replace(/^\+229/, '').replace(/\D+/g, '').slice(0, 10)}
                onChange={(e) => setPhone(e.target.value.replace(/\D+/g, '').slice(0, 10))}
                className="w-full bg-white px-3 py-3 text-black outline-none dark:bg-white/5 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={searching || phone.replace(/\D+/g, '').length !== 10}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gandehou-green px-5 py-3 font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {searching ? 'Recherche…' : 'Rechercher'}
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-gandehou-red/30 bg-gandehou-red/10 px-4 py-3 text-sm text-gandehou-red">
              {error}
            </p>
          )}

          {dossiers && dossiers.length === 0 && !searching && (
            <p className="mt-6 rounded-xl border border-dashed border-black/15 py-8 text-center text-sm text-neutral-900/60 dark:border-white/15 dark:text-white/60">
              Aucun dossier trouvé pour ce numéro.
            </p>
          )}

          {dossiers && dossiers.length > 0 && (
            <ul className="mt-6 space-y-3">
              {dossiers.map((d) => (
                <li key={d.id}>
                  <Link
                    to={`/verifier/${d.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 outline-none transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-gandehou-green/30 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs text-neutral-900/40 dark:text-white/40">
                        {d.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusChip status={d.statut as ChipStatus} />
                    </div>
                    <p className="text-sm font-medium">{d.vendeur_nom} → {d.acheteur_nom}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-900/50 dark:text-white/50">
                      {(d.quartier || d.commune) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[d.quartier, d.commune].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {d.superficie_m2 && <span>{d.superficie_m2.toLocaleString('fr-FR')} m²</span>}
                      <span className="ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

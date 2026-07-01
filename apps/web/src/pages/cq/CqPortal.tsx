import { ArrowRight, FilePlus2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { PortalNav } from '@/components/PortalNav'

type Journey = {
  id: string
  to: string
  title: string
  description: string
  cta: string
  icon: typeof FilePlus2
}

// Routes reused from the Footer so the app stays consistent.
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

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}
const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function CqPortal() {
  const reduceMotion = useReducedMotion()
  const listMotion = reduceMotion
    ? {}
    : { variants: list, initial: 'hidden' as const, animate: 'show' as const }
  const cardMotion = reduceMotion ? {} : { variants: card }

  return (
    <div className="min-h-screen w-full bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <PortalNav backTo="/" />

      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-6 md:pt-10">
        <h1 className="text-center text-4xl font-semibold xl:text-6xl">Espace Chef Quartier</h1>
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
      </main>
    </div>
  )
}
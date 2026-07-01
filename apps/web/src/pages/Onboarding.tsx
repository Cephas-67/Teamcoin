import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import logo from '../public/logo.svg'

const ROUTES = {
  citoyenSpace: '/citizen-portal',
  auth: '/connexion',
} as const

type Role = {
  id: string
  label: string
  to: string
  authRole?: 'chef-quartier' | 'agent'
}

const ROLES: Role[] = [
  { id: 'citoyen', label: 'Citoyen', to: ROUTES.citoyenSpace },
  { id: 'chef-quartier', label: 'Chef quartier', to: ROUTES.auth, authRole: 'chef-quartier' },
  { id: 'agent', label: 'Agent Mairie / Notaire', to: ROUTES.auth, authRole: 'agent' },
]

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}
const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function Onboarding() {
  const reduceMotion = useReducedMotion()
  const listMotion = reduceMotion
    ? {}
    : { variants: list, initial: 'hidden' as const, animate: 'show' as const }
  const cardMotion = reduceMotion ? {} : { variants: card }

  return (
    <main className="min-h-screen w-full bg-gandehou-paper p-2 pt-5 dark:bg-neutral-950 lg:p-4 lg:pt-10">
      <header className="p-3 lg:p-10">
        <Link to="/" aria-label="Gandehou — Accueil">
          <img src={logo} alt="Gandehou" className="min-w-[100px] w-[8vw] max-w-[300px]" />
        </Link>
      </header>

      <h1 className="w-full p-8 text-center text-4xl font-semibold text-neutral-900 dark:text-white xl:text-6xl">
        Choisissez votre espace
      </h1>
      <p className="w-full pb-8 text-center text-lg font-normal text-neutral-900/60 dark:text-white/60 xl:text-xl">
        Votre espace vous permet de faire vos transactions en toute simplicité
      </p>

      <motion.ul
        {...listMotion}
        className="relative z-10 mx-auto flex w-full max-w-[1600px] list-none flex-col gap-4 p-4 md:flex-row md:items-center md:justify-center md:gap-6 md:p-6"
      >
        {ROLES.map((role) => (
          <motion.li
            key={role.id}
            {...cardMotion}
            className="flex flex-1 md:w-1/3 md:max-w-[500px] md:flex-none"
          >
            <Link
              to={role.to}
              state={role.authRole ? { role: role.authRole } : undefined}
              className="flex w-full flex-1 items-center justify-center rounded-3xl border border-black/10 bg-gandehou-green/10 p-6 text-center no-underline outline-none transition-all hover:-translate-y-1 hover:bg-gandehou-green/20 focus-visible:ring-4 focus-visible:ring-gandehou-green focus-visible:ring-offset-2 focus-visible:ring-offset-gandehou-paper dark:border-white/10 dark:bg-gandehou-green/15 dark:hover:bg-gandehou-green/25 dark:focus-visible:ring-offset-neutral-950 md:aspect-square md:flex-none"
            >
              <span className="text-2xl font-semibold text-gandehou-green dark:text-white md:text-3xl">
                {role.label}
              </span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </main>
  )
}
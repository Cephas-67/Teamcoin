import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import logo from "../assets/logo.svg";
import bg from "../assets/images/bg.svg"



/**
 * Onboarding — role selection.
 *
 * TODO(routes): adjust these to your real router.
 *  - Citoyen goes straight to the citizen space (no auth).
 *  - Chef quartier / Agent go to the auth page; the chosen role is passed
 *    via router `state` so the auth screen knows who is signing in.
 */
const ROUTES = {
    citoyenSpace: '/citizen-portal',
    auth: '/connexion',
} as const

type Role = {
    id: string
    label: string
    to: string
    /** When set, the card goes through auth and forwards this role. */
    authRole?: 'chef-quartier' | 'agent'
}

const ROLES: Role[] = [
    { id: 'citoyen', label: 'Citoyen', to: ROUTES.citoyenSpace },
    { id: 'chef-quartier', label: 'Chef quartier', to: ROUTES.auth, authRole: 'chef-quartier' },
    { id: 'agent', label: 'Agent Mairie / Notaire', to: ROUTES.auth, authRole: 'agent' },
]

/** Parent orchestrates the stagger; children do the actual fade-up. */
const list: Variants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
}

const card: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }, // smooth ease-out
    },
}

export default function Onboarding() {
    const reduceMotion = useReducedMotion()

    // If the user prefers reduced motion, skip the animation entirely and
    // render the cards in their final state. No translate, no flicker.
    const listMotion = reduceMotion
        ? {}
        : { variants: list, initial: 'hidden' as const, animate: 'show' as const }
    const cardMotion = reduceMotion ? {} : { variants: card }

    return (
        <main className="min-h-screen w-full bg-white p-2 lg:p-4 pt-5 lg:pt-10">
            <header className='p-3 lg:p-10'>
                <Link to={"/"}>
                    <img src={logo} alt="" className="min-w-[100px] w-[8vw] max-w-[300px]" />
                </Link>
            </header>

            {/* <div
                style={{ backgroundImage: `url('${bg}')` }}
                className="bg-cover lg:bg-contain bg-bottom w-full h-full opacity-10 dark:opacity-20 fixed top-1/3 lg:top-1/2 left-0"
            >

            </div> */}

            <h1 className="text-4xl font-semibold w-full text-center text-black p-8 xl:text-6xl">Choisissez votre espace</h1>
            <p className='text-lg font-normal w-full text-center text-black/30 pb-8 xl:text-xl'>Votre espace vous permet de faire vos transactions en toute simplicité</p>

            <motion.ul
                {...listMotion}
                className="
          mx-auto flex w-full max-w-[1600px] list-none flex-col
          gap-4 p-4
          md:flex-row md:items-center md:justify-center md:gap-6 md:p-6 relative z-10
        "
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
                            className="
                flex w-full flex-1 items-center justify-center rounded-3xl
                bg-green-50 p-6 text-center no-underline outline-none border
                transition-all hover:bg-green-200 hover:translate-y-1
                focus-visible:ring-4 focus-visible:ring-green-600 focus-visible:ring-offset-2
                md:aspect-square md:flex-none
              "
                        >
                            <span className="text-2xl font-semibold text-green-950 md:text-3xl">
                                {role.label}
                            </span>
                        </Link>
                    </motion.li>
                ))}
            </motion.ul>
        </main>
    )
}
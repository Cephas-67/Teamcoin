import { ArrowLeft } from 'lucide-react'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import logo from '../assets/logo.svg'

type PortalNavProps = {
  /** Where the Retour button goes. Defaults to home. */
  backTo?: string
  backLabel?: string
}

export function PortalNav({ backTo = '/', backLabel = 'Retour' }: PortalNavProps) {
  const navigate = useNavigate();
  return (
    <header className="flex w-full items-center justify-between p-6 md:p-10">
      <Link to="/" aria-label="Gandehou — Accueil">
        <img src={logo} alt="Gandehou" className="min-w-[100px] w-[8vw] lg:w-[10vw] max-w-[300px]" />
      </Link>
      <div className="ml-auto flex items-center gap-4 md:gap-8">
        <Link
          to={backTo || "-"}
          onClick={(e) => {
            e.preventDefault();
            backTo && navigate(-1);
          }}
          className="flex items-center gap-3 rounded-2xl bg-black px-5 py-3 text-lg text-white transition-colors duration-500 hover:bg-green-400 dark:bg-white dark:text-black dark:hover:bg-white/30 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          {backLabel}
        </Link>
        <ThemeToggle />
      </div>
    </header>

  )
}


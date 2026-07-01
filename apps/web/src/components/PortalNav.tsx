import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import logo from '../public/logo.svg'

type PortalNavProps = {
  /** Where the Retour button goes. Defaults to home. */
  backTo?: string
  backLabel?: string
}

export function PortalNav({ backTo = '/', backLabel = 'Retour' }: PortalNavProps) {
  const navigate = useNavigate()
  return (
    <header className="flex w-full items-center justify-between p-6 md:p-10">
      <Link to="/" aria-label="Gandehou — Accueil">
        <img src={logo} alt="Gandehou" className="min-w-[100px] w-[8vw] max-w-[300px]" />
      </Link>

      <div className="ml-auto flex items-center gap-4 md:gap-8">
        {/* Secondary nav action → tinted green, keeping solid gandehou-green
            reserved for true primary actions per the charte. */}

        <Link
          to={backTo || "-"}
          onClick={(e) => {
            e.preventDefault();
            backTo && navigate(-1);
          }}
          className="flex items-center gap-2 rounded-full md:rounded-2xl bg-gandehou-green/10 p-3 md:px-5 md:py-3 font-medium text-gandehou-green outline-none transition-colors hover:bg-gandehou-green/15 focus-visible:ring-4 focus-visible:ring-gandehou-green/30 dark:bg-gandehou-green/15 dark:hover:bg-gandehou-green/25"
        >
          <ArrowLeft className="h-7 w-7" />
          <span className='hidden md:flex'>{backLabel}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
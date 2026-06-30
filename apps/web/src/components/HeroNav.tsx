import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import logo from "../assets/logo.svg";
import { ArrowRight, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileMenu } from "./MobileMenu";

export default function HeroNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="z-40 fixed top-0 left-0 px-4 py-4 sm:px-6 sm:py-5 md:p-10 flex flex-row items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" aria-label="Accueil">
          <img
            src={logo}
            alt=""
            className="min-w-[80px] w-[8vw] lg:w-[10vw] max-w-[300px]"
          />
        </Link>

        {/* Nav links desktop */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden w-fit md:flex items-center gap-8 lg:gap-10 text-lg font-medium transition-colors duration-300 py-3 px-5 rounded-full backdrop-blur-xl dark:text-white/70 text-black/70">
          <a href="#fonctionnalites" className="hover:text-text transition-colors">
            Fonctionnalités
          </a>
          <a href="#how" className="hover:text-text transition-colors">
            Comment ça marche
          </a>
          <a href="#faq" className="hover:text-text transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right cluster desktop */}
        <div className="ml-auto hidden md:flex items-center gap-6">
          <ThemeToggle />
          <Link
            to="/onboarding"
            className="group px-6 py-2.5 lg:px-8 lg:py-3 bg-black dark:bg-white dark:text-black dark:hover:bg-white/30 dark:hover:text-white hover:bg-green-400 text-white transition-colors duration-500 text-base lg:text-lg rounded-2xl flex flex-row items-center gap-2 lg:gap-3"
          >
            Accéder à l'app
            <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="md:hidden grid size-11 place-items-center rounded-full ring-1 ring-text/15 text-text hover:bg-text/10 transition-colors"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

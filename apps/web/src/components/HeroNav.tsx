import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Comment ça marche", href: "#how" },
  { label: "FAQ", href: "#faq" },
];

export default function HeroNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Fixed top bar ──────────────────────────────────────────── */}
      <div className="fixed left-0 top-0 z-40 flex w-full items-center justify-between p-4 sm:p-6 md:p-10">
        {/* Logo */}
        <Link to="/" aria-label="Gandehou — Accueil">
          <img
            src={logo}
            alt="Gandehou"
            className="h-8 w-auto sm:h-auto sm:min-w-[100px] sm:w-[8vw] sm:max-w-[300px]"
          />
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 rounded-full px-5 py-3 text-[16px] xl:text-lg font-medium text-black/70 backdrop-blur-xl transition-colors duration-300 md:flex lg:gap-10 dark:text-white/70">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-black dark:hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3 sm:gap-6 md:ml-3">
          <ThemeToggle />

          {/* Desktop CTA — hidden on mobile */}
          <Link
            to="/onboarding"
            className="hidden items-center gap-3 rounded-2xl bg-gandehou-green px-6 py-3 text-lg font-medium text-white transition-colors duration-300 hover:bg-gandehou-green/90 xl:flex"
          >
            Accéder à l'app
            <ArrowRight className="h-5 w-5" />
          </Link>

          {/* Mobile hamburger — visible below sm */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 outline-none transition-colors hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-gandehou-green sm:hidden dark:bg-white/10 dark:hover:bg-white/20"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm sm:hidden"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[280px] flex-col bg-gandehou-paper p-6 shadow-xl sm:hidden dark:bg-neutral-900"
            >
              {/* Close */}
              <div className="mb-8 flex items-center justify-between">
                <Link to="/" aria-label="Gandehou — Accueil" onClick={() => setMobileOpen(false)}>
                  <img src={logo} alt="Gandehou" className="h-7 w-auto" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer le menu"
                  className="rounded-lg p-1.5 text-neutral-900/60 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/60 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links */}
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-neutral-900/80 transition-colors hover:bg-gandehou-green/10 hover:text-gandehou-green dark:text-white/80 dark:hover:bg-gandehou-green/15"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>

              {/* CTA at bottom */}
              <div className="mt-auto pt-6">
                <Link
                  to="/onboarding"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-gandehou-green/90"
                >
                  Accéder à l'app
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
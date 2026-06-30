import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import logo from "../assets/logo.svg";

// Menu mobile fullscreen · inspire de GemmaS mais en Framer Motion
// (au lieu de GSAP). Plus simple et prévisible, AnimatePresence gere
// le mount/unmount + l'animation reverse a la fermeture.

type Item = { label: string; href: string };

type Props = {
  open: boolean;
  onClose: () => void;
  items?: Item[];
  cta?: { label: string; to: string };
};

const DEFAULT_ITEMS: Item[] = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Stack", href: "#stack" },
  { label: "FAQ", href: "#faq" },
];

// Couches de couleur qui cascadent depuis la droite, avant le panneau.
const LAYERS = ["hsl(155 100% 18%)", "hsl(0 0% 0%)"];

export function MobileMenu({
  open,
  onClose,
  items = DEFAULT_ITEMS,
  cta = { label: "Commencer", to: "/onboarding" },
}: Props) {
  // Scroll-lock du body pendant l'ouverture.
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // Echap pour fermer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] overflow-hidden md:hidden">
          {/* Couches de couleur en cascade depuis la droite */}
          {LAYERS.map((color, i) => (
            <motion.div
              key={i}
              aria-hidden
              initial={{ x: "100%" }}
              animate={{ x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 } }}
              exit={{ x: "100%", transition: { duration: 0.35, ease: [0.55, 0, 0.65, 0.2], delay: (LAYERS.length - i) * 0.05 } }}
              className="absolute inset-0"
              style={{ background: color }}
            />
          ))}

          {/* Panneau principal */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: LAYERS.length * 0.08 } }}
            exit={{ x: "100%", transition: { duration: 0.4, ease: [0.55, 0, 0.65, 0.2] } }}
            className="absolute inset-0 flex h-full w-full flex-col bg-bg text-text"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6">
              <Link to="/" onClick={onClose}>
                <img src={logo} alt="Gandéhou" className="w-32" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le menu"
                className="grid size-11 place-items-center rounded-full ring-1 ring-text/15 text-text transition-colors hover:bg-text/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Items en stagger */}
            <ul className="mt-12 flex flex-col gap-2 px-6">
              {items.map((it, idx) => (
                <li key={it.href} className="overflow-hidden leading-none">
                  <motion.a
                    initial={{ y: "140%", rotate: 8 }}
                    animate={{
                      y: 0,
                      rotate: 0,
                      transition: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                        delay: LAYERS.length * 0.08 + 0.15 + idx * 0.07,
                      },
                    }}
                    exit={{
                      y: "140%",
                      rotate: 8,
                      transition: { duration: 0.3, delay: (items.length - idx) * 0.03 },
                    }}
                    href={it.href}
                    onClick={onClose}
                    className="group relative block py-2 pr-16 font-display text-[12vw] font-semibold uppercase leading-[0.95] tracking-[-0.04em] origin-bottom hover:text-accent transition-colors sm:text-[clamp(3rem,9vw,5rem)]"
                  >
                    {it.label}
                    <span
                      aria-hidden
                      className="absolute top-2 right-2 font-sans text-[0.22em] font-normal text-accent"
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </motion.a>
                </li>
              ))}
            </ul>

            {/* Footer CTA + theme */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: LAYERS.length * 0.08 + 0.4, duration: 0.45 },
              }}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
              className="mt-auto flex flex-col gap-4 px-6 pb-10 pt-8"
            >
              <Link
                to={cta.to}
                onClick={onClose}
                className="w-full text-center font-medium bg-black dark:bg-[#008850] dark:hover:bg-white dark:hover:text-black hover:bg-green-400 text-white transition-colors duration-500 text-lg rounded-2xl py-4"
              >
                {cta.label}
              </Link>
              <div className="flex items-center justify-center">
                <ThemeToggle />
              </div>
            </motion.div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

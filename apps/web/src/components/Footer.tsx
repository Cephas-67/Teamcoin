import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import { cn } from "../lib/cn";
import bg from "../assets/images/bg.svg"
import logo from "../public/logo.svg"; // TODO(path): adjust if Footer.tsx isn't one level under assets/

type FooterCol = { heading: string; links: { label: string; href: string }[] };

const FOOTER_COLS: FooterCol[] = [
  {
    heading: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/#fonctionnalites" },
      { label: "Comment ça marche", href: "/#how" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Public",
    links: [
      { label: "Vérificateur", href: "/verifier" },
      { label: "OpenTimestamps", href: "https://opentimestamps.org" },
    ],
  },
  {
    heading: "Espace Chef",
    links: [
      { label: "Connexion", href: "/connexion" },
      { label: "Mes dossiers", href: "/dashboard" },
      { label: "Nouveau dossier", href: "/dossier/nouveau" },
    ],
  },
];

const LEGAL = [
  { label: "Conditions", href: "#" },
  { label: "Confidentialité", href: "#" },
  { label: "Mentions légales", href: "#" },
];

const SOCIALS = [
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "Twitter", href: "#", icon: Twitter },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Email", href: "mailto:contact@gandehou.bj", icon: Mail },
];

// Wordmark géant Gandehou avec effet "torche".
// Deux couches superposées : la basse en opacité réduite, la haute pleine
// densité révélée par un radial-gradient qui suit le curseur.
// aria-hidden : purement décoratif — la marque accessible est le logo (col 1).
function TorchWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999, active: false });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };

  const onLeave = () => setPos((p) => ({ ...p, active: false, x: -9999, y: -9999 }));
  const mask = `radial-gradient(circle 360px at ${pos.x}px ${pos.y}px, black 0%, black 35%, transparent 85%)`;

  const wordmarkCls =
    "font-display font-black tracking-[-0.06em] leading-[0.85] " +
    "text-[clamp(4rem,18vw,16rem)] select-none whitespace-nowrap";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full overflow-hidden flex flex-col items-center justify-center"
      aria-hidden
    >
      {/* Couche basse · présence constante mais dimmée */}
      <div className={cn(wordmarkCls, "text-text opacity-[0.15] dark:opacity-[0.12]")}>
        Gandehou
      </div>

      {/* Couche haute · révélée par la torche */}
      <div
        className={cn(
          wordmarkCls,
          "absolute left-1/2 -translate-x-1/2 text-text transition-opacity duration-300",
          pos.active ? "opacity-100" : "opacity-0",
        )}
        style={{
          WebkitMaskImage: mask,
          maskImage: mask,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      >
        Gandehou
      </div>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative w-full overflow-hidden bg-bg text-text/80"
    >
      <div
        style={{ backgroundImage: `url('${bg}')` }}
        className="bg-cover bg-bottom w-full h-full opacity-10 dark:opacity-20 absolute top-0 left-0"
      >

      </div>
      <div className="container px-4 sm:px-6 lg:px-10 pt-16 sm:pt-20 lg:pt-24 pb-6 relative z-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-10">
          {/* COL 1 — identité (logo) */}
          <div>
            <Link to="/" aria-label="Gandehou — Accueil" className="inline-flex items-center">
              <img src={logo} alt="Gandehou" className="h-9 w-auto" />
            </Link>
            <p className="mt-6 text-sm text-text/65">
              Notarisation foncière inclusive ancrée sur Bitcoin.
              <br />
              Cotonou · Bénin
            </p>
            <a
              href="mailto:contact@gandehou.bj"
              className="mt-2 block text-sm text-text/75 transition-colors hover:text-text"
            >
              contact@gandehou.bj
            </a>
          </div>

          {/* COL 2/3/4 · liens */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <p className="mb-5 text-[15px] font-medium text-text/55">{col.heading}</p>
              <ul className="space-y-3.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[15px] text-text transition-colors hover:text-text/60"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Barre legal */}
        <div className="mt-16 flex flex-col gap-6 border-t border-text/10 pt-6 text-[13px] text-text/55 sm:mt-20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>© {year} Gandehou</span>
            {LEGAL.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="transition-colors hover:text-text"
              >
                {l.label}
              </a>
            ))}
          </div>

          <ul className="flex items-center gap-5">
            {SOCIALS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    aria-label={s.label}
                    className="block text-text/55 transition-colors hover:text-text"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </footer>
  );
}
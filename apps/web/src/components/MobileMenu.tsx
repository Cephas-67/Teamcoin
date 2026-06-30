import { useEffect, useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import { gsap } from "gsap";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import logo from "../assets/logo.svg";
import "./MobileMenu.css";

// Menu mobile fullscreen porte depuis GemmaS.
// Une seule timeline GSAP construite au mount, jouee en avant a l'ouverture,
// en arriere a la fermeture -> miroir exact. Les couches de couleur cascadent
// derriere le panneau pour donner un effet "rideau qui tombe".

type Item = { label: string; href: string };

type Props = {
  open: boolean;
  onClose: () => void;
  items?: Item[];
  cta?: { label: string; to: string };
  layers?: [string, string];
  accent?: string;
};

const DEFAULT_ITEMS: Item[] = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Stack", href: "#stack" },
  { label: "FAQ", href: "#faq" },
];

export function MobileMenu({
  open,
  onClose,
  items = DEFAULT_ITEMS,
  cta = { label: "Commencer", to: "/onboarding" },
  // Couches : vert sombre marque + noir; accent vert clair pour numerotation.
  layers = ["hsl(155 100% 18%)", "hsl(0 0% 0%)"],
  accent = "hsl(150 70% 45%)",
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<HTMLDivElement[]>([]);
  const labelRefs = useRef<HTMLSpanElement[]>([]);
  const itemRefs = useRef<HTMLAnchorElement[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Timeline construite une seule fois, en pause a t=0 (etat initial ferme).
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    gsap.set([panel, ...layerRefs.current], { xPercent: 100 });
    if (labelRefs.current.length) {
      gsap.set(labelRefs.current, { yPercent: 140, rotate: 8 });
    }
    if (itemRefs.current.length) {
      gsap.set(itemRefs.current, { "--num-opacity": 0 });
    }
    if (footerRef.current) {
      gsap.set(footerRef.current, { opacity: 0, y: 20 });
    }

    const tl = gsap.timeline({ paused: true });

    // 1. Couches de couleur en cascade depuis la droite.
    layerRefs.current.forEach((el, i) => {
      tl.to(el, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.08);
    });
    const panelStart = layerRefs.current.length * 0.08;

    // 2. Panneau qui glisse derriere les couches.
    tl.to(panel, { xPercent: 0, duration: 0.65, ease: "power4.out" }, panelStart);

    const itemsStart = panelStart + 0.1;

    // 3. Labels qui remontent en stagger avec une legere rotation.
    if (labelRefs.current.length) {
      tl.to(
        labelRefs.current,
        { yPercent: 0, rotate: 0, duration: 0.9, ease: "power4.out", stagger: 0.08 },
        itemsStart,
      );
    }

    // 4. Numeros qui s'allument.
    if (itemRefs.current.length) {
      tl.to(
        itemRefs.current,
        { "--num-opacity": 1, duration: 0.5, ease: "power2.out", stagger: 0.07 },
        itemsStart + 0.1,
      );
    }

    // 5. Footer (CTA + theme toggle) en dernier.
    if (footerRef.current) {
      tl.to(
        footerRef.current,
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        itemsStart + 0.2,
      );
    }

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, []);

  // Play / reverse selon `open`. Fermeture un peu plus rapide pour la nervosite.
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (open) {
      tl.timeScale(1).play();
      document.documentElement.style.overflow = "hidden";
    } else {
      tl.timeScale(1.4).reverse();
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
    <div
      className="mobile-menu-wrap pointer-events-none fixed inset-0 z-[70] overflow-hidden md:hidden"
      style={{ ["--menu-accent" as string]: accent }}
      data-open={open ? "true" : undefined}
      aria-hidden={!open ? "true" : "false"}
    >
      {/* Couches de prefond qui defilent en cascade derriere le panneau */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full">
        {layers.map((c, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) layerRefs.current[i] = el;
            }}
            className="absolute inset-y-0 right-0 h-full w-full"
            style={{ background: c }}
            aria-hidden
          />
        ))}
      </div>

      {/* Panneau principal */}
      <aside
        ref={panelRef}
        className="pointer-events-auto absolute inset-y-0 right-0 flex h-full w-full flex-col bg-bg text-text"
      >
        {/* Header : logo + fermeture */}
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

        {/* Items */}
        <ul className="mobile-menu-list mt-12 flex flex-col gap-2 px-6">
          {items.map((it, idx) => (
            <li key={it.href} className="overflow-hidden leading-none">
              <a
                ref={(el) => {
                  if (el) itemRefs.current[idx] = el;
                }}
                href={it.href}
                onClick={onClose}
                data-num={String(idx + 1).padStart(2, "0")}
                className="mobile-menu-item relative block py-2 pr-16 font-display text-[13vw] font-semibold uppercase leading-[0.95] tracking-[-0.04em] sm:text-[clamp(3rem,9vw,5.5rem)]"
              >
                <span
                  ref={(el) => {
                    if (el) labelRefs.current[idx] = el;
                  }}
                  className="inline-block origin-bottom will-change-transform"
                >
                  {it.label}
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* Footer : CTA + theme */}
        <div
          ref={footerRef}
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
        </div>
      </aside>
    </div>
  );
}

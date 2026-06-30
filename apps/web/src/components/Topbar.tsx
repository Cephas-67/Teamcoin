import { Link, NavLink } from "react-router-dom";
import { ArrowRight, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LinkButton } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import logo from "../assets/logo.svg";


type Props = {
  variant: "public" | "app";
  onToggleSidebar?: () => void;
};

export function Topbar({ variant, onToggleSidebar }: Props) {
  return (
    <div className="z-40 fixed top-0 left-0 p-6 md:p-10 flex flex-row items-center justify-between w-full">

      <Link to="/" className="flex items-center gap-2">
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <img src={logo} alt="" className="min-w-[100px] w-[8vw] max-w-[300px]" />
      </Link>
      {variant === "public" ? <PublicNav /> : <AppNavRight onToggleSidebar={onToggleSidebar} />}

      {/* ── Right cluster ────────────────────────────────────────────────── */}
      <div className="ml-auto md:ml-3 flex items-center gap-8">

        {/* Dark mode toggle */}
        <ThemeToggle />
      </div>
    </div>

  );
}

function PublicNav() {
  return (

    <>



      {/* <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-muted">
        <a href="#fonctionnalites" className="hover:text-text transition-colors">Fonctionnalités</a>
        <a href="#how" className="hover:text-text transition-colors">Comment ça marche</a>
        <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
      </nav>
      <div className="ml-auto md:ml-3 flex items-center gap-2">
        <ThemeToggle />
        <LinkButton to="/verifier" variant="ghost" size="sm">
          Vérifier
        </LinkButton>
        <LinkButton to="/connexion" variant="primary" size="sm">
          <span>Espace Chef</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </LinkButton>
      </div> */}
    </>
  );
}

function AppNavRight({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ThemeToggle />
      <button
        type="button"
        className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md border border-border-strong text-text hover:bg-surface-2"
        onClick={onToggleSidebar}
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-4 h-4" />
      </button>
    </div>
  );
}

export function TopbarSlot({ children }: { children: ReactNode }) {
  return <div className="ml-auto flex items-center gap-2">{children}</div>;
}

export function useSidebarToggle() {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) };
}

export function MobileBackdrop({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <button
      type="button"
      aria-label="Fermer le menu"
      onClick={onClose}
      className="fixed inset-0 z-40 bg-black/60 lg:hidden"
    />
  );
}

export { NavLink };

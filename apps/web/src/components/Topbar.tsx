import { Link, NavLink } from "react-router-dom";
import { ArrowRight, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LinkButton } from "./Button";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  variant: "public" | "app";
  onToggleSidebar?: () => void;
};

export function Topbar({ variant, onToggleSidebar }: Props) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-bg border-b border-border flex items-center px-4 lg:px-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent" aria-hidden />
        <span className="font-black tracking-tighter text-lg">KandoFoncier</span>
      </Link>

      {variant === "public" ? <PublicNav /> : <AppNavRight onToggleSidebar={onToggleSidebar} />}
    </header>
  );
}

function PublicNav() {
  return (
    <>
      <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-muted">
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
      </div>
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

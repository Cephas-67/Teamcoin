import { Route, Routes, NavLink } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Notariser from "./pages/Notariser";
import Verifier from "./pages/Verifier";
import Explorer from "./pages/Explorer";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/notariser" element={<Notariser />} />
          <Route path="/verifier" element={<Verifier />} />
          <Route path="/explorer" element={<Explorer />} />
        </Routes>
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}

function Header() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
    }`;
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="container flex items-center justify-between h-16">
        <NavLink to="/" className="font-display text-xl font-bold tracking-tight">
          Kando<span className="text-primary">Foncier</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          <NavLink to="/notariser" className={link}>Notariser</NavLink>
          <NavLink to="/verifier" className={link}>Vérifier</NavLink>
          <NavLink to="/explorer" className={link}>Explorer</NavLink>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
      KandoFoncier · Bénin · Ancré sur Bitcoin via OpenTimestamps
    </footer>
  );
}

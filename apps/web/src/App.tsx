import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell, PublicShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NouveauDossier from "./pages/NouveauDossier";
import DossierPage from "./pages/Dossier";
import Verificateur from "./pages/Verificateur";
import Connexion from "./pages/Connexion";
import { useTheme } from "./context/ThemeContext";
import { useLenis } from "./hooks/useLenis";
import { SetupBanner } from "./components/SetupBanner";

export default function App() {
  useLenis();
  const { theme } = useTheme();
  return (
    <>
      <SetupBanner />
      <Routes>
        <Route element={<PublicShell />}>
          <Route path="/" element={<Landing />} />
        </Route>

        <Route path="/connexion" element={<Connexion />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Vue dossier · stateless · le rôle est dans ?role=chef|vendeur|acheteur.
            Non protégée pour permettre aux vendeur/acheteur sans compte d'y accéder
            via leur lien WhatsApp. Le rôle "chef" est protégé via la policy SQL
            qui empêche un non-owner de modifier les champs sensibles. */}
        <Route path="/dossier/:id" element={<DossierPage />} />

        {/* Vérificateur public */}

        <Route path="/citizen-portal" element={<CitizenPortal />} />
        <Route path="/verifier" element={<Verificateur />} />

        {/* Espace Chef · sidebar + auth requise */}
        <Route element={<ProtectedRoute>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dossier/nouveau" element={<NouveauDossier />} />
          <Route path="/agent-portal" element={<AgentPortal />} />
          <Route path="/cq-portal" element={<CQPortal />} />
        </ProtectedRoute>}>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster
        richColors
        theme={theme}
        position="top-right"
        toastOptions={{ style: { fontFamily: "Outfit, system-ui, sans-serif" } }}
      />
    </>
  );
}

import { Outlet, Link } from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import Onboarding from "./pages/Onboarding";
import CitizenPortal from "./pages/CitizenPortal";
import AgentPortal from "./pages/AgentPortal";
import CQPortal from "./pages/CQPortal";

function PublicAppShell() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="h-16 px-5 flex items-center justify-between border-b border-border">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent" />
          <span className="font-black tracking-tighter text-lg">KandoFoncier</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
            <ArrowLeft className="w-3.5 h-3.5" /> Accueil
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="container py-6 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-bg">
      <span className="text-accent text-sm font-medium mb-2">404</span>
      <h1 className="text-3xl font-bold mb-2 tracking-tight">Cette page n'existe pas.</h1>
      <p className="text-muted mb-6">Le lien est cassé ou la page a été déplacée.</p>
      <Link to="/" className="text-accent hover:underline">← Retour à l'accueil</Link>
    </div>
  );
}

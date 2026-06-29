import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell, PublicShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Notariser from "./pages/Notariser";
import Verifier from "./pages/Verifier";
import Explorer from "./pages/Explorer";
import Connexion from "./pages/Connexion";
import { useTheme } from "./context/ThemeContext";
import { useLenis } from "./hooks/useLenis";

export default function App() {
  useLenis();
  const { theme } = useTheme();
  return (
    <>
      <Routes>
        <Route element={<PublicShell />}>
          <Route path="/" element={<Landing />} />
        </Route>

        <Route path="/connexion" element={<Connexion />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notariser" element={<Notariser />} />
          <Route path="/verifier" element={<Verifier />} />
          <Route path="/explorer" element={<Explorer />} />
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

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-bg">
      <span className="text-accent text-sm font-medium mb-2">404</span>
      <h1 className="text-3xl font-bold mb-2 tracking-tight">Cette page n'existe pas.</h1>
      <p className="text-muted mb-6">Le lien est cassé ou la page a été déplacée.</p>
      <a href="/" className="text-accent hover:underline">← Retour à l'accueil</a>
    </div>
  );
}

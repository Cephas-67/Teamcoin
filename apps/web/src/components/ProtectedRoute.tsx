import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useChef } from "../hooks/useChef";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { chef, loading } = useChef();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-muted text-sm">
        Chargement…
      </div>
    );
  }

  if (!chef) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

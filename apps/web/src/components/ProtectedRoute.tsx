import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useSession } from "../hooks/useSession";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-muted text-sm">
        Chargement…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

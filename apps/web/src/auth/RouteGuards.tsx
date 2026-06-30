import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './AuthProvider'

/** Neutral, system-agnostic loading state while the session resolves. */
function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-500" />
      <span className="sr-only">Vérification de la session…</span>
    </div>
  )
}

/**
 * Wrap protected routes as a layout route:
 *
 *   <Route element={<RequireAuth />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     <Route path="/dossier/:id" element={<DossierReview />} />
 *   </Route>
 *
 * Unauthenticated users are sent to /connexion with the attempted path in
 * `state.from`, which Connexion already reads to redirect back after login.
 *
 * TODO(role): when a role source exists (Supabase profile / user metadata),
 * accept a `role` prop and also redirect chefs who lack it.
 */
export function RequireAuth() {
  const { chef, loading } = useAuth()
  const location = useLocation()

  if (loading) return <SessionLoading />
  if (!chef) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }
  return <Outlet />
}

/**
 * Inverse guard for /, /connexion: a chef who's already signed in skips the
 * onboarding / login screens and lands on their dashboard.
 *
 * NOTE: this treats "authenticated" as "is a chef heading to the dashboard".
 * A signed-in chef who wants the public verifier can still navigate there
 * directly — only the onboarding/login entry points redirect away.
 */
export function RedirectIfAuthed() {
  const { chef, loading } = useAuth()

  if (loading) return <SessionLoading />
  if (chef) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
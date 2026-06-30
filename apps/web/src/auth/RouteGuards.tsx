import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth, type Role } from './AuthProvider'

function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gandehou-paper dark:bg-neutral-950">
      <Loader2 className="h-6 w-6 animate-spin text-gandehou-green" />
      <span className="sr-only">Vérification de la session…</span>
    </div>
  )
}

/**
 * Wrap protected routes as a layout route in App.tsx:
 *
 *   // Requires any auth:
 *   <Route element={<RequireAuth />}>
 *     <Route path="/dashboard" element={<CqDashboard />} />
 *   </Route>
 *
 *   // Requires a specific role:
 *   <Route element={<RequireAuth role="chef_quartier" />}>
 *     <Route path="/cq/*" element={<CqDashboard />} />
 *   </Route>
 *   <Route element={<RequireAuth role="agent_mairie" />}>
 *     <Route path="/mairie/*" element={<MairieDashboard />} />
 *   </Route>
 *
 * Unauthenticated → /connexion (with state.from for the post-login redirect).
 * Wrong role → /unauthorized (TODO: build that page or redirect to /connexion).
 */
export function RequireAuth({ role }: { role?: Role }) {
  const { chef, role: userRole, loading } = useAuth()
  const location = useLocation()

  if (loading) return <SessionLoading />

  if (!chef) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }

  // Role check: only enforced when a role prop is provided AND the user has a
  // real Supabase session (phone-demo has no profiles row yet).
  if (role && userRole !== role) {
    // TODO(ux): build a proper /unauthorized page.
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

/**
 * Inverse guard for /, /connexion, /onboarding.
 * A signed-in chef who matches the expected role skips login and lands on
 * their dashboard. Without a `role` prop, any auth redirects to /dashboard.
 */
export function RedirectIfAuthed({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const { chef, loading } = useAuth()

  if (loading) return <SessionLoading />
  if (chef) return <Navigate to={redirectTo} replace />
  return <Outlet />
}
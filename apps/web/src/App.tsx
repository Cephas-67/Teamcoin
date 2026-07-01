/**
 * App.tsx — route tree only.
 *
 * BrowserRouter and ThemeProvider live in main.tsx (they were already there).
 * This file owns the route declarations, guards, lazy imports, and the Toaster.
 */

import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Loader2 } from 'lucide-react'

import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { RedirectIfAuthed, RequireAuth } from '@/auth/RouteGuards'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import CqPortal from './pages/cq/CqPortal'

/* ── Lazy page imports ─────────────────────────────────────────────── */
const Landing = lazy(() => import('@/pages/Landing'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Connexion = lazy(() => import('@/pages/Connexion'))
const CitizenPortal = lazy(() => import('@/pages/citizen/CitizenPortal'))
const DossierForm = lazy(() => import('@/pages/citizen/DossierForm'))
const VerificationPortal = lazy(() => import('@/pages/citizen/VerificationPortal'))
const DossierTwin = lazy(() => import('@/pages/citizen/DossierTwin'))
const CqDashboard = lazy(() => import('@/pages/cq/CqDashboard'))
const DossierReview = lazy(() => import('@/pages/cq/DossierReview'))
const MairieDashboard = lazy(() => import('@/pages/mairie/MairieDashboard'))
const DossierValidation = lazy(() => import('@/pages/mairie/DossierValidation'))

/* ── Loading fallback ──────────────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gandehou-paper dark:bg-neutral-950">
      <Loader2 className="h-7 w-7 animate-spin text-gandehou-green" />
      <span className="sr-only">Chargement…</span>
    </div>
  )
}

/* ── SmartDashboard — redirects by role ─────────────────────────────── */
function SmartDashboard() {
  const { chef, role, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!chef) return <Navigate to="/connexion" replace />
  if (role === 'chef_quartier') return <Navigate to="/cq/dashboard" replace />
  if (role === 'agent_mairie' || role === 'admin') return <Navigate to="/mairie/dashboard" replace />

  // Aucun role : renvoie sur /onboarding qui a le design 3 cartes (Citoyen,
  // Chef quartier, Notaire) — meme UX que la premiere visite.
  return <Navigate to="/onboarding" replace />
}

/* ── 404 ────────────────────────────────────────────────────────────── */
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gandehou-paper px-6 text-center dark:bg-neutral-950 dark:text-white">
      <p className="text-6xl font-black text-gandehou-green">404</p>
      <p className="text-lg font-semibold">Page introuvable</p>
      <p className="text-sm text-neutral-900/60 dark:text-white/60">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <a
        href="/"
        className="mt-2 rounded-2xl bg-gandehou-green px-6 py-2.5 font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40"
      >
        Retour à l'accueil
      </a>
    </div>
  )
}

/* ── Route tree ─────────────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing — always public */}
          <Route path="/" element={<Landing />} />

          {/* Smart dashboard redirect */}
          <Route path="/dashboard" element={<SmartDashboard />} />
          {/* <Route path="/dashboard" element={<MairieDashboard />} /> */}

          {/* Skip if already authed */}
          <Route element={<RedirectIfAuthed redirectTo="/dashboard" />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/connexion" element={<Connexion />} />
          </Route>

          {/* Always public (citizen, no account) */}
          <Route path="/citizen-portal" element={<CitizenPortal />} />
          <Route path="/dossier/nouveau" element={<DossierForm />} />
          <Route path="/verifier" element={<VerificationPortal />} />
          <Route path="/verifier/:id" element={<DossierTwin />} />

          {/* Chef de Quartier */}
          <Route element={<RequireAuth role="chef_quartier" />}>
            <Route path="/cq-portal" element={<CqPortal />} />
            <Route path="/cq/dashboard" element={<CqDashboard />} />
            <Route path="/cq/dossier/:id" element={<DossierReview />} />
          </Route>

          {/* Agent Mairie / Notaire */}
          <Route element={<RequireAuth role="agent_mairie" />}>
            <Route path="/mairie/dashboard" element={<MairieDashboard />} />
            <Route path="/mairie/dossier/:id" element={<DossierValidation />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>

      <Toaster
        position="bottom-center"
        richColors
        toastOptions={{ className: 'font-sans text-sm' }}
      />
    </AuthProvider>
  )
}
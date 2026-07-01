import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getCurrentChef, logout as authLogout, type Chef } from '@/services/auth'
import { supabase } from '@/lib/supabase'

// Role values match the profiles.role check constraint (spec p.14).
export type Role = 'chef_quartier' | 'agent_mairie' | 'admin' | null

type AuthState = {
  chef: Chef | null
  role: Role
  loading: boolean
  /** Re-read session + role. Call after loginWithPhoneDemo (no Supabase event fires). */
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchRole(userId: string): Promise<Role> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return (data?.role as Role) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [chef, setChef] = useState<Chef | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const c = await getCurrentChef()
    setChef(c)
    if (c?.source === 'email' && c.id) {
      setRole(await fetchRole(c.id))
    } else if (c?.source === 'phone-demo') {
      // Phone-demo n'a pas de profil Supabase (login purement local).
      // On lui assigne chef_quartier par defaut pour la demo, sinon
      // SmartDashboard bloque sur "Compte en attente de configuration".
      setRole('chef_quartier')
    } else {
      setRole(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  useEffect(() => {
    let active = true

    load().then(() => {
      if (active) setLoading(false)
    })

    // React to email-auth events: magic-link, sign-out, token refresh.
    // Phone-demo doesn't emit these — call refresh() after loginWithPhoneDemo.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (active) load()
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [load])

  const logout = useCallback(async () => {
    await authLogout()
    setChef(null)
    setRole(null)
  }, [])

  return (
    <AuthContext.Provider value={{ chef, role, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
  return ctx
}
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

export type Role = 'chef_quartier' | 'agent_mairie' | 'admin' | null

const DEMO_ROLE_KEY = 'gandehou-demo-role'

type AuthState = {
    chef: Chef | null
    role: Role
    loading: boolean
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

        if (c?.id) {
            // Try the real profiles table first.
            const dbRole = await fetchRole(c.id)
            if (dbRole) {
                setRole(dbRole)
            } else if (c.source === 'phone-demo') {
                // Phone-demo users have no profiles row — read the role that
                // Connexion stored in localStorage when they came from /onboarding.
                const stored = localStorage.getItem(DEMO_ROLE_KEY) as Role
                setRole(stored)
            } else {
                setRole(null)
            }
        } else {
            setRole(null)
        }
    }, [])

    const refresh = useCallback(async () => {
        await load()
    }, [load])

    useEffect(() => {
        let active = true
        load().then(() => { if (active) setLoading(false) })
        const { data: sub } = supabase.auth.onAuthStateChange(() => {
            if (active) load()
        })
        return () => { active = false; sub.subscription.unsubscribe() }
    }, [load])

    const logout = useCallback(async () => {
        await authLogout()
        localStorage.removeItem(DEMO_ROLE_KEY)
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
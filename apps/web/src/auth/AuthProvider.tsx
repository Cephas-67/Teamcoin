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

type AuthState = {
    chef: Chef | null
    loading: boolean
    /** Re-read the session. Call after a phone-demo login (no Supabase event fires for it). */
    refresh: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [chef, setChef] = useState<Chef | null>(null)
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(async () => {
        setChef(await getCurrentChef())
    }, [])

    useEffect(() => {
        let active = true

        // Initial read.
        getCurrentChef().then((c) => {
            if (active) {
                setChef(c)
                setLoading(false)
            }
        })

        // React to email-auth changes: magic-link sign-in, sign-out, token refresh.
        // NOTE: the phone-demo path lives in localStorage and does NOT emit these
        // events — the login screen must call refresh() after loginWithPhoneDemo().
        const { data: sub } = supabase.auth.onAuthStateChange(() => {
            getCurrentChef().then((c) => {
                if (active) setChef(c)
            })
        })

        return () => {
            active = false
            sub.subscription.unsubscribe()
        }
    }, [])

    const logout = useCallback(async () => {
        await authLogout()
        setChef(null)
    }, [])

    return (
        <AuthContext.Provider value={{ chef, loading, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
    return ctx
}
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, MessageSquare, Phone, ShieldCheck,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BackButton } from '@/components/BackButton'
import { PhoneInput } from '@/components/PhoneInput'
import { sendEmailOtp, verifyEmailOtp, loginWithPhoneDemo } from '@/services/auth'
import { countries, formatPhone } from '@/data/countries'
import { useAuth } from '@/auth/AuthProvider'
import logo from '../public/logo.svg'

function formatE164(e164: string): string {
  const c = countries.find((x) => e164.startsWith(x.dial))
  if (!c) return e164
  const digits = e164.slice(c.dial.length)
  return `${c.dial} ${formatPhone(c, digits)}`
}

type Method = 'email' | 'phone'
type Step = 'input' | 'otp' | 'success'
const PHONE_DEMO_OTP = '040305'

export default function Connexion() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [method, setMethod] = useState<Method>('email')
  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneOk, setPhoneOk] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Reset any bleed-over error when the user changes step or method.
  useEffect(() => { setError('') }, [step, method])

  const switchMethod = (m: Method) => {
    setMethod(m); setStep('input'); setOtp(''); setError('')
  }

  const handleSendEmail = useCallback(async () => {
    setError('')
    if (!email.trim() || !email.includes('@')) return setError('Entre une adresse email valide.')
    setLoading(true)
    try {
      await sendEmailOtp(email.trim().toLowerCase())
      setStep('otp')
      setCountdown(60)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer le code.")
    } finally {
      setLoading(false)
    }
  }, [email])

  const handleVerifyEmail = useCallback(async () => {
    if (otp.length < 6) return setError('Entre le code à 6 chiffres.')
    setLoading(true); setError('')
    try {
      await verifyEmailOtp(email.trim().toLowerCase(), otp)
      setStep('success')
      setTimeout(() => navigate(redirectTo, { replace: true }), 1100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code incorrect.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }, [email, otp, navigate, redirectTo])

  const handleSendPhone = () => {
    setError('')
    if (!phoneOk) return setError('Entre un numéro complet.')
    setStep('otp'); setCountdown(60)
  }

  const handleVerifyPhone = useCallback(async () => {
    if (otp.length < 6) return
    if (otp !== PHONE_DEMO_OTP) { setError('Code incorrect.'); setOtp(''); return }
    setError('')
    loginWithPhoneDemo(phone)
    // Phone-demo writes localStorage only — no Supabase event fires, so we
    // must nudge the context manually.
    await refresh()
    setStep('success')
    setTimeout(() => navigate(redirectTo, { replace: true }), 1100)
  }, [phone, otp, navigate, redirectTo, refresh])

  useEffect(() => {
    if (otp.length === 6 && step === 'otp') {
      if (method === 'email') handleVerifyEmail()
      else handleVerifyPhone()
    }
  }, [otp, step, method, handleVerifyEmail, handleVerifyPhone])

  const resend = () => {
    if (countdown > 0) return
    setOtp('')
    if (method === 'email') handleSendEmail()
    else handleSendPhone()
  }

  return (
    <div className="min-h-screen bg-gandehou-paper dark:bg-neutral-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-5">
        {step === 'input' ? (
          <BackButton fallback="/" />
        ) : step === 'otp' ? (
          <button
            type="button"
            onClick={() => { setStep('input'); setOtp(''); setError('') }}
            className="inline-flex items-center gap-2 text-sm text-neutral-900/60 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/60 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Modifier
          </button>
        ) : <span />}
        <ThemeToggle />
      </div>

      <div
        className="flex items-start justify-center px-4 pb-16 lg:items-center"
        style={{ minHeight: 'calc(100vh - 80px)' }}
      >
        <div className="w-full max-w-[460px]">
          {/* Logo — replaces the old text wordmark */}
          <Link to="/" aria-label="Gandehou — Accueil" className="mb-8 flex items-center justify-center">
            <img src={logo} alt="Gandehou" className="h-10 w-auto" />
          </Link>

          {step === 'input' && (
            <Card>
              <Tabs current={method} onChange={switchMethod} />

              {method === 'email' && (
                <>
                  <Icon icon={Mail} />
                  <Title>Connexion</Title>
                  <Lead>Entrez votre adresse email · vous recevrez un lien ou un code.</Lead>
                  {error && <ErrorBox>{error}</ErrorBox>}
                  <Field label="Adresse email">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-900/40 dark:text-white/40" />
                      <input
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                        placeholder="vous@exemple.com"
                        className="h-12 w-full rounded-xl border border-black/10 bg-white pl-10 pr-3 text-sm text-black outline-none transition focus:border-gandehou-green focus:ring-4 focus:ring-gandehou-green/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                  </Field>
                  <PrimaryAction onClick={handleSendEmail} loading={loading} disabled={!email.trim()}>
                    Recevoir mon lien
                    <ArrowRight className="h-4 w-4" />
                  </PrimaryAction>
                </>
              )}

              {method === 'phone' && (
                <>
                  <Icon icon={Phone} />
                  <Title>Connexion par téléphone</Title>
                  <Lead>Choisisez votre pays et entrez votre numéro · code SMS simulé pour la démo.</Lead>
                  {error && <ErrorBox>{error}</ErrorBox>}
                  <div className="mb-6">
                    <PhoneInput
                      label="Numéro de téléphone"
                      onChange={(e164, complete) => { setPhone(e164); setPhoneOk(complete); if (error) setError('') }}
                    />
                  </div>
                  <PrimaryAction onClick={handleSendPhone} loading={false} disabled={!phoneOk}>
                    <MessageSquare className="h-4 w-4" />
                    Recevoir le code SMS
                  </PrimaryAction>
                </>
              )}
              <Legal />
            </Card>
          )}

          {step === 'otp' && method === 'email' && (
            <Card>
              <Icon icon={ShieldCheck} />
              <Title>Vérification</Title>
              <Lead>Email envoyé à <span className="font-semibold text-neutral-900 dark:text-white">{email}</span></Lead>
              <div className="mb-5 rounded-xl border border-gandehou-yellow/40 bg-gandehou-yellow/15 p-3 text-xs leading-relaxed text-amber-900 dark:text-gandehou-yellow">
                <strong>2 façons de se connecter :</strong><br />
                · <strong>Clique le lien "Sign in"</strong> dans l'email · vous etes redirigé connecté.<br />
                · OU entre les <strong>6 chiffres</strong> ci-dessous (si SMTP custom configuré).
              </div>
              {error && <ErrorBox>{error}</ErrorBox>}
              <OTPInput value={otp} onChange={(v) => { setOtp(v); if (error) setError('') }} />
              {loading && <CenterLoader />}
              <ResendBar countdown={countdown} onResend={resend} />
            </Card>
          )}

          {step === 'otp' && method === 'phone' && (
            <Card>
              <Icon icon={ShieldCheck} />
              <Title>Vérification SMS</Title>
              <Lead>
                Code envoyé au{' '}
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">{formatE164(phone)}</span>
              </Lead>
              {error && <ErrorBox>{error}</ErrorBox>}
              <OTPInput value={otp} onChange={(v) => { setOtp(v); if (error) setError('') }} />
              {loading && <CenterLoader />}
              <ResendBar countdown={countdown} onResend={resend} />
            </Card>
          )}

          {step === 'success' && (
            <Card>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gandehou-green/15">
                <CheckCircle2 className="h-8 w-8 text-gandehou-green" />
              </div>
              <Title>Connexion réussie</Title>
              <Lead>Redirection en cours…</Lead>
              <div className="mt-5 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-900/40 dark:text-white/40" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Sub-components — all themed to the charte
 * ------------------------------------------------------------------ */
function Tabs({ current, onChange }: { current: Method; onChange: (m: Method) => void }) {
  return (
    <div className="mb-6 flex rounded-xl border border-black/10 bg-gandehou-paper p-1 dark:border-white/10 dark:bg-white/5">
      <TabButton active={current === 'email'} onClick={() => onChange('email')}>
        <Mail className="h-3.5 w-3.5" />Email
      </TabButton>
      <TabButton active={current === 'phone'} onClick={() => onChange('phone')}>
        <Phone className="h-3.5 w-3.5" />Téléphone
      </TabButton>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gandehou-green ${active
        ? 'bg-white text-gandehou-green shadow-sm dark:bg-white/10 dark:text-gandehou-green'
        : 'text-neutral-900/50 hover:text-neutral-900 dark:text-white/50 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
      {children}
    </div>
  )
}

function Icon({ icon: I }: { icon: typeof Mail }) {
  return (
    <div className="mb-5 flex justify-center">
      <I className="h-9 w-9 text-gandehou-green" strokeWidth={1.6} />
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-center text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{children}</h1>
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mb-7 mt-2 text-center text-sm leading-relaxed text-neutral-900/60 dark:text-white/60">{children}</p>
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mb-5 rounded-xl border border-gandehou-red/30 bg-gandehou-red/10 p-3 text-center text-sm text-gandehou-red">
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <label className="mb-2 block text-sm font-medium text-neutral-900/80 dark:text-white/80">{label}</label>
      {children}
    </div>
  )
}

function PrimaryAction({ onClick, loading, disabled, children }: { onClick: () => void; loading: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green text-sm font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  )
}

function CenterLoader() {
  return (
    <div className="mt-5 flex items-center justify-center gap-2 text-sm text-neutral-900/60 dark:text-white/60">
      <Loader2 className="h-4 w-4 animate-spin" />Vérification en cours…
    </div>
  )
}

function ResendBar({ countdown, onResend }: { countdown: number; onResend: () => void }) {
  return (
    <div className="mt-6 text-center">
      {countdown > 0 ? (
        <p className="text-sm text-neutral-900/60 dark:text-white/60">
          Renvoyer dans <span className="tabular-nums font-bold text-neutral-900 dark:text-white">{countdown}s</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={onResend}
          className="text-sm font-semibold text-gandehou-green outline-none hover:underline focus-visible:ring-2 focus-visible:ring-gandehou-green"
        >
          Renvoyer le code
        </button>
      )}
    </div>
  )
}

function Legal() {
  return (
    <p className="mt-6 text-center text-[11px] leading-relaxed text-neutral-900/50 dark:text-white/50">
      En continuant, tu acceptes nos{' '}
      <a href="#" className="underline hover:text-neutral-900 dark:hover:text-white">Conditions</a>{' '}et notre{' '}
      <a href="#" className="underline hover:text-neutral-900 dark:hover:text-white">Politique de confidentialité</a>.
    </p>
  )
}

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  useEffect(() => { inputs.current[0]?.focus() }, [])

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (!/^\d*$/.test(v)) return
    const arr = value.split('')
    arr[i] = v.slice(-1)
    onChange(arr.join('').slice(0, 6))
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          aria-label={`Chiffre ${i + 1}`}
          className="h-14 w-11 rounded-xl border border-black/10 bg-white text-center text-xl font-bold text-black outline-none transition focus:border-gandehou-green focus:ring-4 focus:ring-gandehou-green/20 dark:border-white/15 dark:bg-white/5 dark:text-white sm:w-12"
        />
      ))}
    </div>
  )
}
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { authService, setSession } from "../services/auth";

type Step = "email" | "otp" | "success";

export default function Connexion() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = useCallback(async () => {
    setError("");
    setDevOtp(null);
    if (!email.trim() || !email.includes("@")) {
      setError("Entre une adresse email valide.");
      return;
    }
    setLoading(true);
    try {
      const r = await authService.sendOtpEmail(email);
      if (r.otp_dev) setDevOtp(r.otp_dev);
      setStep("otp");
      setCountdown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length < 6) {
      setError("Entre le code à 6 chiffres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await authService.verifyOtpEmail(email, otp);
      setSession(r.token, r.user);
      setStep("success");
      setTimeout(() => navigate(redirectTo, { replace: true }), 1100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code incorrect.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }, [email, otp, navigate, redirectTo]);

  useEffect(() => {
    if (otp.length === 6 && step === "otp") handleVerifyOtp();
  }, [otp, step, handleVerifyOtp]);

  const resend = () => {
    if (countdown > 0) return;
    setOtp("");
    handleSendOtp();
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex items-center justify-between px-5 py-5">
        {step === "email" ? (
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        ) : step === "otp" ? (
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setError("");
              setDevOtp(null);
            }}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Modifier l'email
          </button>
        ) : (
          <span />
        )}
        <ThemeToggle />
      </div>

      <div className="flex items-start lg:items-center justify-center px-4 pb-16" style={{ minHeight: "calc(100vh - 80px)" }}>
        <div className="w-full max-w-[440px]">
          <Link to="/" className="flex items-center gap-2 justify-center mb-8">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent" />
            <span className="font-black tracking-tighter text-lg">KandoFoncier</span>
          </Link>

          {step === "email" && (
            <Card>
              <Icon icon={Mail} />
              <Title>Connexion</Title>
              <Lead>Entre ton adresse email. Tu recevras un code à 6 chiffres.</Lead>

              {error && <ErrorBox>{error}</ErrorBox>}

              <Field label="Adresse email">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="vous@exemple.com"
                    className="w-full h-12 pl-10 pr-3 rounded-md border border-border bg-bg text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <p className="mt-2 text-xs text-muted text-center">Aucun mot de passe nécessaire.</p>
              </Field>

              <PrimaryAction onClick={handleSendOtp} loading={loading} disabled={!email.trim()}>
                Recevoir mon code
                <ArrowRight className="w-4 h-4" />
              </PrimaryAction>

              <Legal />
            </Card>
          )}

          {step === "otp" && (
            <Card>
              <Icon icon={ShieldCheck} />
              <Title>Vérification</Title>
              <Lead>
                Code envoyé à <span className="font-semibold text-text">{email}</span>
              </Lead>

              {devOtp && (
                <div className="mb-4 p-3 rounded-md border border-warn/30 bg-warn/10 text-xs text-warn text-center font-mono">
                  Mode dev · code OTP : <strong>{devOtp}</strong>
                </div>
              )}

              {error && <ErrorBox>{error}</ErrorBox>}

              <OTPInput value={otp} onChange={(v) => { setOtp(v); if (error) setError(""); }} />

              {loading && (
                <div className="flex items-center justify-center gap-2 mt-5 text-sm text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification en cours…
                </div>
              )}

              <div className="text-center mt-6">
                {countdown > 0 ? (
                  <p className="text-sm text-muted">
                    Renvoyer dans <span className="font-bold text-text tabular-nums">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={resend}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    Renvoyer le code
                  </button>
                )}
              </div>
            </Card>
          )}

          {step === "success" && (
            <Card>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-accent/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <Title>Connexion réussie</Title>
              <Lead>Redirection en cours…</Lead>
              <div className="flex justify-center mt-5">
                <Loader2 className="w-5 h-5 animate-spin text-muted" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">{children}</div>
  );
}

function Icon({ icon: I }: { icon: typeof Mail }) {
  return (
    <div className="flex justify-center mb-5">
      <I className="w-9 h-9 text-text" strokeWidth={1.6} />
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold text-center tracking-tight">{children}</h1>;
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-muted text-center mb-7 leading-relaxed">{children}</p>;
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 p-3 rounded-md border border-danger/30 bg-danger/10 text-sm text-danger text-center">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">{label}</label>
      {children}
    </div>
  );
}

function PrimaryAction({
  onClick,
  loading,
  disabled,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-contrast text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none transition-colors"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

function Legal() {
  return (
    <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
      En continuant, tu acceptes nos{" "}
      <a href="#" className="underline hover:text-text">Conditions d'utilisation</a>{" "}
      et notre{" "}
      <a href="#" className="underline hover:text-text">Politique de confidentialité</a>.
    </p>
  );
}

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!/^\d*$/.test(v)) return;
    const arr = value.split("");
    arr[i] = v.slice(-1);
    onChange(arr.join("").slice(0, 6));
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          aria-label={`Chiffre ${i + 1}`}
          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
        />
      ))}
    </div>
  );
}

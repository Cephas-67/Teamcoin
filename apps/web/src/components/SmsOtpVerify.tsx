import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "./Button";

// Pour le hackathon : OTP SMS simulé. N'importe quel numéro reçoit "le code 040305".
// Aucun appel réseau, juste un délai cosmétique pour le feel.
const FAKE_OTP = "040305";

type Props = {
  phone: string;            // E.164 ex "+22901234567"
  onVerified: () => void;
};

export function SmsOtpVerify({ phone, onVerified }: Props) {
  const [step, setStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const send = () => {
    setError("");
    setLoading(true);
    setOtp("");
    // Délai cosmétique pour simuler un envoi réseau.
    setTimeout(() => {
      setStep("sent");
      setCountdown(60);
      setLoading(false);
    }, 700);
  };

  const verify = (code: string) => {
    if (code.length < 6) return;
    if (code === FAKE_OTP) {
      setStep("verified");
      setTimeout(onVerified, 400);
    } else {
      setError("Code incorrect. Pour la démo : 040305");
      setOtp("");
    }
  };

  if (step === "verified") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-accent/30 bg-accent/10 text-sm text-accent">
        <CheckCircle2 className="w-4 h-4" />
        Numéro vérifié · {phone}
      </div>
    );
  }

  if (step === "idle") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Nous allons envoyer un code SMS au <span className="font-mono text-text">{phone}</span>
        </p>
        <Button variant="primary" onClick={send} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          Envoyer le code SMS
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-md border border-warn/30 bg-warn/10 text-xs text-warn">
        💡 Mode démo · le code est <span className="font-mono font-bold">040305</span>
        <br />
        En prod : SMS envoyé via Twilio / Africa's Talking.
      </div>

      <p className="text-sm text-muted">
        Code envoyé au <span className="font-mono text-text">{phone}</span>
      </p>

      <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(""); verify(v); }} />

      {error && (
        <p className="text-sm text-danger text-center">{error}</p>
      )}

      <div className="flex justify-between items-center text-xs">
        <button
          type="button"
          onClick={() => setStep("idle")}
          className="text-muted hover:text-text"
        >
          Changer de numéro
        </button>
        {countdown > 0 ? (
          <span className="text-muted">Renvoyer dans {countdown}s</span>
        ) : (
          <button
            type="button"
            onClick={send}
            className="text-accent hover:underline font-medium"
          >
            Renvoyer le code
          </button>
        )}
      </div>
    </div>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

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
          ref={(el) => { inputs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
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

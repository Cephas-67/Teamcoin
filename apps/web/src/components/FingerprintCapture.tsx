import { useEffect, useState } from "react";
import { Fingerprint, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { captureSignature, isPasskeySupported, type CapturedSignature } from "../services/signature";

type Props = {
  /** Nom du signataire affiché dans le dialogue système WebAuthn */
  signataireNom: string;
  onCaptured: (signature: CapturedSignature) => void;
};

// Capture biométrique RÉELLE via WebAuthn / Passkey.
// L'utilisateur valide avec Touch ID, Face ID, Windows Hello ou empreinte Android.
export function FingerprintCapture({ signataireNom, onCaptured }: Props) {
  const [state, setState] = useState<"idle" | "scanning" | "done" | "unsupported" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    isPasskeySupported().then((ok) => {
      if (!ok) setState("unsupported");
    });
  }, []);

  const capture = async () => {
    if (!signataireNom?.trim()) {
      setErrorMsg("Saisis d'abord le nom du signataire.");
      setState("error");
      return;
    }
    setState("scanning");
    setErrorMsg("");
    try {
      const signature = await captureSignature(signataireNom);
      setState("done");
      onCaptured(signature);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  };

  if (state === "unsupported") {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md border border-danger/30 bg-danger/10 text-sm text-danger">
        <AlertTriangle className="w-4 h-4 mt-0.5" />
        <span>
          Cet appareil ne supporte pas la capture biométrique WebAuthn. Utilise un smartphone récent (iOS 16+, Android 9+) ou un ordinateur avec Touch ID / Windows Hello.
        </span>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-accent/30 bg-accent/10 text-sm text-accent">
        <CheckCircle2 className="w-4 h-4" />
        Empreinte capturée et liée au document
      </div>
    );
  }

  if (state === "scanning") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-md border border-info/30 bg-info/10 text-sm text-info">
        <div className="relative w-10 h-10 inline-flex items-center justify-center">
          <Fingerprint className="w-7 h-7 animate-pulse" />
          <Loader2 className="absolute inset-0 w-10 h-10 animate-spin opacity-40" />
        </div>
        <span>Suivi le dialogue système · pose ton doigt / regarde la caméra…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Pose ton doigt sur le capteur ou regarde la caméra. Une clé cryptographique (Passkey) est créée localement et liée au dossier.
      </p>
      {state === "error" && errorMsg && (
        <div className="text-sm text-danger flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      <Button variant="primary" onClick={capture}>
        <Fingerprint className="w-4 h-4" />
        Capturer l'empreinte
      </Button>
    </div>
  );
}

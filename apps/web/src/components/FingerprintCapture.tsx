import { useState } from "react";
import { Fingerprint, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./Button";

type Props = {
  onCaptured: (signature: string) => void;
};

// Simulation Passkey · génère une signature locale "unique" pour la démo.
// En prod : navigator.credentials.create({publicKey: {...}}) avec WebAuthn.
export function FingerprintCapture({ onCaptured }: Props) {
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");

  const capture = () => {
    setState("scanning");
    setTimeout(() => {
      const signature = crypto.randomUUID();
      setState("done");
      onCaptured(signature);
    }, 1200);
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-accent/30 bg-accent/10 text-sm text-accent">
        <CheckCircle2 className="w-4 h-4" />
        Empreinte capturée
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
        <span>Lecture en cours · maintiens le doigt…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Pose ton doigt sur l'écran du smartphone · l'empreinte débloque une clé cryptographique gérée localement.
      </p>
      <Button variant="primary" onClick={capture}>
        <Fingerprint className="w-4 h-4" />
        Poser le doigt
      </Button>
    </div>
  );
}

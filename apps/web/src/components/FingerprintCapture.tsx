import { useState } from 'react'
import { Fingerprint, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export type CapturedSignature = {
  credentialId: string
  publicKeyHash: string
  signataireNom: string
  timestamp: number
}

type FingerprintCaptureProps = {
  /** Name of the person signing — embedded in the credential metadata. */
  signataireNom: string
  onCaptured: (sig: CapturedSignature) => void
  className?: string
}

type CaptureState = 'idle' | 'capturing' | 'done' | 'unsupported' | 'error'

/**
 * Compute SHA-256 of a buffer and return hex string.
 */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Check if the browser supports WebAuthn with platform authenticator
 * (fingerprint sensor, Face ID, Windows Hello).
 */
export async function isPasskeySupported(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function FingerprintCapture({
  signataireNom,
  onCaptured,
  className,
}: FingerprintCaptureProps) {
  const [state, setState] = useState<CaptureState>('idle')
  const [error, setError] = useState('')
  const [signature, setSignature] = useState<CapturedSignature | null>(null)

  const capture = async () => {
    setState('capturing')
    setError('')

    const supported = await isPasskeySupported()
    if (!supported) {
      setState('unsupported')
      setError(
        "Votre appareil ne prend pas en charge la signature biométrique (empreinte ou Face ID). Continuez sans signature — le document sera scellé uniquement avec le hash.",
      )
      return
    }

    try {
      // Generate a challenge — in production this should come from the server.
      const challenge = crypto.getRandomValues(new Uint8Array(32))

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Gandehou',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(signataireNom),
            name: signataireNom,
            displayName: signataireNom,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // device biometric only
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none', // we only need the pubkey, not a full attestation
        },
      })) as PublicKeyCredential | null

      if (!credential) {
        setState('error')
        setError('Signature annulée.')
        return
      }

      const response = credential.response as AuthenticatorAttestationResponse
      const pubKeyHash = await sha256Hex(response.getPublicKey?.() ?? new ArrayBuffer(0))

      const sig: CapturedSignature = {
        credentialId: credential.id,
        publicKeyHash: pubKeyHash,
        signataireNom,
        timestamp: Date.now(),
      }

      setSignature(sig)
      onCaptured(sig)
      setState('done')
    } catch (e) {
      setState('error')
      setError(
        e instanceof Error
          ? e.message
          : 'Erreur lors de la capture biométrique. Réessayez.',
      )
    }
  }

  return (
    <div className={cn('rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]', className)}>
      <p className="mb-1 text-sm font-medium text-neutral-900/80 dark:text-white/80">
        Signature biométrique
      </p>
      <p className="mb-4 text-xs text-neutral-900/50 dark:text-white/50">
        Posez votre doigt sur le capteur ou utilisez Face ID. La clé cryptographique est gérée par l'enclave sécurisée de votre appareil.
      </p>

      {state === 'idle' && (
        <button
          type="button"
          onClick={capture}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/15 py-10 outline-none transition-colors hover:border-gandehou-green hover:bg-gandehou-green/5 focus-visible:ring-4 focus-visible:ring-gandehou-green/20 dark:border-white/15 dark:hover:bg-gandehou-green/10"
        >
          <Fingerprint className="h-10 w-10 text-gandehou-green" />
          <div className="text-left">
            <p className="font-medium">Capturer l'empreinte</p>
            <p className="text-xs text-neutral-900/50 dark:text-white/50">{signataireNom}</p>
          </div>
        </button>
      )}

      {state === 'capturing' && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-gandehou-green" />
          <p className="mt-3 text-sm text-neutral-900/60 dark:text-white/60">
            En attente de la biométrie…
          </p>
        </div>
      )}

      {state === 'done' && signature && (
        <div className="flex items-start gap-3 rounded-xl bg-gandehou-green/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gandehou-green" />
          <div>
            <p className="text-sm font-medium text-gandehou-green">Empreinte capturée</p>
            <p className="mt-1 text-xs text-neutral-900/50 dark:text-white/50">
              Signataire : {signature.signataireNom}
            </p>
            <p className="mt-0.5 break-all font-mono text-[10px] text-neutral-900/40 dark:text-white/40">
              Clé : {signature.publicKeyHash.slice(0, 24)}…
            </p>
          </div>
        </div>
      )}

      {(state === 'error' || state === 'unsupported') && (
        <div className="flex items-start gap-3 rounded-xl bg-gandehou-yellow/15 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-gandehou-yellow" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-gandehou-yellow">{error}</p>
            {state === 'error' && (
              <button
                type="button"
                onClick={capture}
                className="mt-2 text-xs font-semibold text-gandehou-green underline outline-none hover:no-underline"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
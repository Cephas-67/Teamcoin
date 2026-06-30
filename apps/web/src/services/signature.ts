import { sha256 } from "@gandehou/ledger";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Service signature · WebAuthn / Passkey                                   ║
// ║                                                                          ║
// ║ Capture une vraie empreinte biométrique (Touch ID, Face ID, capteur     ║
// ║ Android, etc.) via l'API navigator.credentials.                          ║
// ║                                                                          ║
// ║ Flow :                                                                   ║
// ║   1. registerSignature(nomSignataire) : crée une nouvelle Passkey,       ║
// ║      l'utilisateur valide avec son empreinte/Face ID.                    ║
// ║   2. Le navigateur renvoie une publicKey + credentialId.                 ║
// ║   3. On hash la publicKey pour stockage compact en base.                 ║
// ║   4. À l'avenir, signWithExistingPasskey() permettrait de re-signer.    ║
// ║                                                                          ║
// ║ Différence avec la version simulée : on appelle vraiment la lib WebAuthn ║
// ║ du navigateur, donc l'utilisateur DOIT poser son doigt / regarder la     ║
// ║ caméra. Si la plateforme ne supporte pas (navigateurs très anciens), on  ║
// ║ throw une erreur claire.                                                 ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type CapturedSignature = {
  /** ID Base64URL du credential WebAuthn (à conserver pour authentif future) */
  credentialId: string;
  /** Public key au format JWK (vérifiable côté serveur) */
  publicKeyJwk: JsonWebKey;
  /** Hash SHA-256 hex de la public key (champ compact pour la base + ancrage) */
  publicKeyHash: string;
  /** Nom du signataire saisi avant la capture */
  signataireNom: string;
};

/**
 * Détecte si le navigateur supporte WebAuthn avec authenticator de plateforme.
 */
export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    const fn = (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable;
    return typeof fn === "function" ? await fn() : true;
  } catch {
    return false;
  }
}

/**
 * Lance la capture biométrique réelle. Le navigateur affiche son propre
 * dialogue système (Touch ID, Windows Hello, Android Biometrics).
 *
 * Le challenge est généré localement pour le hackathon. En prod, il devrait
 * venir du serveur (Edge Function challenge-create) pour éviter les replay.
 */
export async function captureSignature(signataireNom: string): Promise<CapturedSignature> {
  if (!signataireNom?.trim()) {
    throw new Error("Nom du signataire requis avant capture biométrique.");
  }
  if (!(await isPasskeySupported())) {
    throw new Error(
      "Ce navigateur ou cet appareil ne supporte pas la capture biométrique. " +
      "Utilise un téléphone récent (iOS 16+, Android 9+) ou un ordinateur avec Touch ID / Windows Hello.",
    );
  }

  // Challenge aléatoire 32 octets (devrait venir du serveur en prod)
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Gandehou" },
      user: {
        id: encodeText(signataireNom),
        name: signataireNom,
        displayName: signataireNom,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },    // ES256
        { type: "public-key", alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",  // Touch ID / Face ID / Hello
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Capture biométrique annulée par l'utilisateur.");

  const response = credential.response as AuthenticatorAttestationResponse;
  const publicKeyBytes = response.getPublicKey?.();
  if (!publicKeyBytes) {
    throw new Error("Public key non récupérable de l'authenticator (navigateur trop ancien).");
  }

  // Hash de la public key pour stockage compact et ancrage
  const publicKeyHash = await sha256(new Uint8Array(publicKeyBytes));

  // Export au format JWK pour validation crypto future
  const publicKeyJwk = await exportPublicKeyToJwk(publicKeyBytes);

  return {
    credentialId: base64urlEncode(new Uint8Array(credential.rawId)),
    publicKeyJwk,
    publicKeyHash,
    signataireNom: signataireNom.trim(),
  };
}

// ─── Helpers internes ───────────────────────────────────────────────────────

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function base64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function exportPublicKeyToJwk(spkiBytes: ArrayBuffer): Promise<JsonWebKey> {
  // La plupart des authenticators retournent du ES256 (P-256). On essaie d'abord.
  try {
    const key = await crypto.subtle.importKey(
      "spki",
      spkiBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"],
    );
    return await crypto.subtle.exportKey("jwk", key);
  } catch {
    // Fallback : RSA
    try {
      const key = await crypto.subtle.importKey(
        "spki",
        spkiBytes,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        true,
        ["verify"],
      );
      return await crypto.subtle.exportKey("jwk", key);
    } catch {
      // Si on n'arrive pas à importer, on retourne au moins le hex de la SPKI
      return {
        kty: "raw",
        k: Array.from(new Uint8Array(spkiBytes)).map((b) => b.toString(16).padStart(2, "0")).join(""),
      } as unknown as JsonWebKey;
    }
  }
}

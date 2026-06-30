// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Wrapper OpenTimestamps pour Deno (Edge Functions Supabase)               ║
// ║                                                                          ║
// ║ Utilise @otskit/client via npm: (Deno supporte les packages npm avec    ║
// ║ shims node:crypto / node:net / node:dns natifs).                         ║
// ║                                                                          ║
// ║ Pourquoi pas réutiliser packages/ledger/opentimestamps.ts directement :  ║
// ║   les Edge Functions Supabase sont déployées séparément du monorepo,    ║
// ║   sans accès à packages/. On duplique volontairement les ~30 lignes      ║
// ║   utilisées côté serveur.                                                ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// @ts-ignore types absents en npm: import Deno
import { OpenTimestampsClient } from "npm:@otskit/client@0.5.0";

export type StampResult = {
  proofBytes: Uint8Array;
  hashHex: string;
};

export type UpgradeResult = {
  status: "pending" | "confirmed";
  proofBytes: Uint8Array;
  blockHeight: number | null;
  bitcoinTimestamp: number | null;
};

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// Singleton réutilisé entre invocations (Deno garde le module chargé)
let _client: any = null;
function getClient() {
  if (!_client) _client = new OpenTimestampsClient();
  return _client;
}

export async function stampHash(sha256Hex: string): Promise<StampResult> {
  if (!/^[0-9a-f]{64}$/i.test(sha256Hex)) {
    throw new Error("stampHash: hash invalide (64 chars hex requis)");
  }
  const client = getClient();
  const proofBytes = await client.stamp(hexToBytes(sha256Hex));
  return { proofBytes, hashHex: sha256Hex.toLowerCase() };
}

export async function upgradeProof(
  proofBytes: Uint8Array,
): Promise<UpgradeResult> {
  const client = getClient();
  try {
    const upgraded = await client.upgrade(proofBytes);
    try {
      const result = await client.verify(upgraded);
      if (result?.valid && typeof result.blockHeight === "number") {
        return {
          status: "confirmed",
          proofBytes: upgraded,
          blockHeight: result.blockHeight,
          bitcoinTimestamp: typeof result.blockTime === "number" ? result.blockTime : 0,
        };
      }
    } catch {
      // verify peut throw si la preuve n'a pas encore d'attestation Bitcoin
    }
    return { status: "pending", proofBytes: upgraded, blockHeight: null, bitcoinTimestamp: null };
  } catch {
    return { status: "pending", proofBytes, blockHeight: null, bitcoinTimestamp: null };
  }
}

// Calcul SHA-256 d'un ArrayBuffer · Web Crypto API natif Deno.
export async function sha256OfBytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Vérification cryptographique d'une preuve ──────────────────────────────
// Mode "fail-closed" : on retourne un verdict typé plutôt que de throw, pour
// que l'Edge Function puisse répondre proprement à l'utilisateur dans tous
// les cas (preuve falsifiée, preuve invalide, preuve pas encore confirmée).

export type VerifyResult =
  | { verdict: "confirmed"; blockHeight: number; bitcoinTimestamp: number }
  | { verdict: "pending"; reason: string }
  | { verdict: "mismatch"; reason: string }
  | { verdict: "invalid"; reason: string };

export async function verifyProof(
  proofBytes: Uint8Array,
  expectedHashHex: string,
): Promise<VerifyResult> {
  const client = getClient();
  try {
    const expectedBytes = hexToBytes(expectedHashHex);
    const result: any = await client.verify(proofBytes, expectedBytes);

    if (!result || result.valid === false) {
      return {
        verdict: "mismatch",
        reason: "Hash recalculé != hash ancré dans la preuve (document modifié)",
      };
    }
    if (typeof result.blockHeight === "number") {
      return {
        verdict: "confirmed",
        blockHeight: result.blockHeight,
        bitcoinTimestamp: typeof result.blockTime === "number" ? result.blockTime : 0,
      };
    }
    return {
      verdict: "pending",
      reason: "Preuve soumise, pas encore agrégée dans un bloc Bitcoin",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/not.*confirmed|pending|upgrade/i.test(msg)) {
      return { verdict: "pending", reason: msg };
    }
    if (/mismatch|digest|hash/i.test(msg)) {
      return { verdict: "mismatch", reason: msg };
    }
    return { verdict: "invalid", reason: msg };
  }
}

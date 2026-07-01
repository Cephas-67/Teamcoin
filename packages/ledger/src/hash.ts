// packages/ledger · fonctions de hachage partagees client/Edge Function.
//
// La regle du "combined hash" est LA source de verite pour l'ancrage Bitcoin :
// c'est ce hash-la qui est stampe via OpenTimestamps. Si le client et l'Edge
// Function ne calculent pas EXACTEMENT la meme cascade, tout ancrage bipartite
// echoue avec 409 "hash combine divergent".
//
// L'ordre est FIGE et documente ci-dessous. Ne pas changer sans mettre a jour
// simultanement supabase/functions/anchor-document/index.ts.

const subtle = (() => {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API indisponible (Node 20+ ou navigateur requis)");
})();

export async function sha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer =
    data instanceof Uint8Array
      ? (data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength,
        ) as ArrayBuffer)
      : data;
  const digest = await subtle.digest("SHA-256", buffer);
  return bufferToHex(digest);
}

export async function sha256OfFile(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256(buffer);
}

/**
 * Combine legacy (utilise dans le code non bipartite) · pdf + un autre element.
 * Garde pour compat retro-active. Prefer `combinedHashCascade` pour le
 * bipartite.
 */
export async function combinedHash(a: string, b: string): Promise<string> {
  const enc = new TextEncoder();
  return sha256(enc.encode(`${a}::${b}`));
}

/**
 * Cascade canonique bipartite. Ordre FIGE (doit rester aligne avec
 * supabase/functions/anchor-document/index.ts::computeCombinedHash).
 *
 *   acc = pdfHash (lowercase hex)
 *   si vendeurAudioHash  : acc = SHA-256(acc + "::" + vendeurAudio)
 *   si vendeurSigHash    : acc = SHA-256(acc + "::" + vendeurSig)
 *   si acheteurAudioHash : acc = SHA-256(acc + "::" + acheteurAudio)
 *   si acheteurSigHash   : acc = SHA-256(acc + "::" + acheteurSig)
 *
 * Toute alteration d'UN SEUL des 5 elements invalide la preuve Bitcoin.
 */
export async function combinedHashCascade(input: {
  pdf: string;
  vendeurAudio?: string | null;
  vendeurSig?: string | null;
  acheteurAudio?: string | null;
  acheteurSig?: string | null;
}): Promise<string> {
  const enc = new TextEncoder();
  let acc = input.pdf.toLowerCase();
  const ordered = [
    input.vendeurAudio,
    input.vendeurSig,
    input.acheteurAudio,
    input.acheteurSig,
  ];
  for (const h of ordered) {
    if (!h) continue;
    acc = await sha256(enc.encode(`${acc}::${h.toLowerCase()}`));
  }
  return acc;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

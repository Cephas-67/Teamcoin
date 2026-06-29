const subtle = (() => {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API indisponible (Node 20+ ou navigateur requis)");
})();

export async function sha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer : data;
  const digest = await subtle.digest("SHA-256", buffer);
  return bufferToHex(digest);
}

export async function sha256OfFile(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256(buffer);
}

export async function combinedHash(documentHash: string, audioHash: string): Promise<string> {
  const encoder = new TextEncoder();
  return sha256(encoder.encode(`${documentHash}::${audioHash}`));
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

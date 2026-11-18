export interface EncryptedEnvelope {
  ciphertext: string;
  iv: string;
  senderPublicKey: JsonWebKey;
  recipientPublicKey: JsonWebKey;
  fingerprint: string;
  algorithm: 'ECDH-P256-AES-GCM-256';
}

function getSubtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('Web Crypto SubtleCrypto API is unavailable in this environment.');
  }
  return c.subtle;
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateEcdhKeyPair(): Promise<{
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}> {
  const subtle = getSubtle();
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const publicKeyJwk = await subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await subtle.exportKey('jwk', keyPair.privateKey);
  return { publicKeyJwk, privateKeyJwk };
}

export async function computeKeyFingerprint(publicKeyJwk: JsonWebKey): Promise<string> {
  const subtle = getSubtle();
  const canonical = JSON.stringify({
    crv: publicKeyJwk.crv,
    kty: publicKeyJwk.kty,
    x: publicKeyJwk.x,
    y: publicKeyJwk.y,
  });
  const encoded = new TextEncoder().encode(canonical);
  const digest = await subtle.digest('SHA-256', encoded);
  const hex = Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

async function deriveAesGcmKey(
  ownPrivateKeyJwk: JsonWebKey,
  peerPublicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const privateKey = await subtle.importKey(
    'jwk',
    ownPrivateKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );
  const publicKey = await subtle.importKey(
    'jwk',
    peerPublicKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  return subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessageE2EE(params: {
  plaintext: string;
  senderPrivateKeyJwk: JsonWebKey;
  senderPublicKeyJwk: JsonWebKey;
  recipientPublicKeyJwk: JsonWebKey;
}): Promise<EncryptedEnvelope> {
  const subtle = getSubtle();
  const aesKey = await deriveAesGcmKey(
    params.senderPrivateKeyJwk,
    params.recipientPublicKeyJwk
  );
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(params.plaintext);
  const encryptedBuf = await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
  const fingerprint = await computeKeyFingerprint(params.senderPublicKeyJwk);

  return {
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuf)),
    iv: bytesToBase64(iv),
    senderPublicKey: params.senderPublicKeyJwk,
    recipientPublicKey: params.recipientPublicKeyJwk,
    fingerprint,
    algorithm: 'ECDH-P256-AES-GCM-256',
  };
}

export async function decryptMessageE2EE(params: {
  ciphertext: string;
  iv: string;
  ownPrivateKeyJwk: JsonWebKey;
  peerPublicKeyJwk: JsonWebKey;
}): Promise<string> {
  const subtle = getSubtle();
  const aesKey = await deriveAesGcmKey(params.ownPrivateKeyJwk, params.peerPublicKeyJwk);
  const ivBytes = base64ToBytes(params.iv);
  const cipherBytes = base64ToBytes(params.ciphertext);
  const decryptedBuf = await subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBytes) },
    aesKey,
    new Uint8Array(cipherBytes)
  );
  return new TextDecoder().decode(decryptedBuf);
}

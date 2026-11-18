import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeKeyFingerprint,
  decryptMessageE2EE,
  encryptMessageE2EE,
  generateEcdhKeyPair,
} from './crypto';

test('ECDH P-256 + AES-GCM 256-bit encrypts and decrypts end-to-end between client and advisor', async () => {
  const clientKeys = await generateEcdhKeyPair();
  const advisorKeys = await generateEcdhKeyPair();
  const thirdPartyKeys = await generateEcdhKeyPair();

  const message = 'Confidential Q1 expansion roadmap & budget ($1,800/mo retainer).';

  const envelope = await encryptMessageE2EE({
    plaintext: message,
    senderPrivateKeyJwk: clientKeys.privateKeyJwk,
    senderPublicKeyJwk: clientKeys.publicKeyJwk,
    recipientPublicKeyJwk: advisorKeys.publicKeyJwk,
  });

  // Ciphertext must not leak plaintext
  assert.ok(envelope.ciphertext.length > 0);
  assert.equal(envelope.ciphertext.includes('Confidential'), false);

  // Advisor decrypts with advisor private key + client public key
  const decryptedByAdvisor = await decryptMessageE2EE({
    ciphertext: envelope.ciphertext,
    iv: envelope.iv,
    ownPrivateKeyJwk: advisorKeys.privateKeyJwk,
    peerPublicKeyJwk: envelope.senderPublicKey,
  });
  assert.equal(decryptedByAdvisor, message);

  // Client can also decrypt their own sent message using client private key + advisor public key
  const decryptedByClient = await decryptMessageE2EE({
    ciphertext: envelope.ciphertext,
    iv: envelope.iv,
    ownPrivateKeyJwk: clientKeys.privateKeyJwk,
    peerPublicKeyJwk: advisorKeys.publicKeyJwk,
  });
  assert.equal(decryptedByClient, message);

  // Unrelated third party must fail to decrypt
  await assert.rejects(
    () =>
      decryptMessageE2EE({
        ciphertext: envelope.ciphertext,
        iv: envelope.iv,
        ownPrivateKeyJwk: thirdPartyKeys.privateKeyJwk,
        peerPublicKeyJwk: envelope.senderPublicKey,
      }),
    /unable to authenticate|operation|decrypt/i
  );

  const fp = await computeKeyFingerprint(clientKeys.publicKeyJwk);
  assert.match(fp, /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
});

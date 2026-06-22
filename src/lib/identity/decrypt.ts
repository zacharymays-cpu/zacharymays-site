import 'server-only';
import {
  buildClient,
  CommitmentPolicy,
  KmsKeyringNode,
  NodeCachingMaterialsManager,
  getLocalCryptographicMaterialsCache,
} from '@aws-crypto/client-node';
import { blindIndex, pLabel } from './blindIndex.js';

export { blindIndex, pLabel };

const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT);

// Local data-key cache. Re-decrypting the same ciphertext within MAX_AGE_MS
// reuses cached decryption materials instead of issuing another KMS Decrypt.
// The admin pages are force-dynamic and decrypt every person on each render,
// so without this a single page reload costs one KMS request per person —
// which is what pushed the account past the 20k/month KMS free tier.
const CACHE_CAPACITY = 1000;
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

let _cmm: NodeCachingMaterialsManager | null = null;
function materialsManager(): NodeCachingMaterialsManager {
  if (!_cmm) {
    const keyId = process.env.KMS_KEY_ID;
    if (!keyId) throw new Error('KMS_KEY_ID is not set');
    _cmm = new NodeCachingMaterialsManager({
      backingMaterials: new KmsKeyringNode({ keyIds: [keyId] }),
      cache: getLocalCryptographicMaterialsCache(CACHE_CAPACITY),
      maxAge: MAX_AGE_MS,
    });
  }
  return _cmm;
}

// Decrypts a Python-produced AWS-Encryption-SDK ciphertext and verifies the
// encryption context {person_id, field} matches — rejects swapped ciphertexts.
export async function decryptField(
  ciphertext: Buffer,
  personId: string,
  field: string,
): Promise<string> {
  const { plaintext, messageHeader } = await decrypt(materialsManager(), ciphertext);
  const ec = (messageHeader as { encryptionContext?: Record<string, string> }).encryptionContext || {};
  if (ec.person_id !== personId || ec.field !== field) {
    throw new Error(
      `encryption context mismatch: expected person_id=${personId} field=${field}, ` +
        `got ${ec.person_id}/${ec.field}`,
    );
  }
  return plaintext.toString('utf8');
}

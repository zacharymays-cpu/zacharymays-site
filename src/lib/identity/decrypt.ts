import 'server-only';
import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';
import { blindIndex, pLabel } from './blindIndex.js';

export { blindIndex, pLabel };

const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT);

let _keyring: KmsKeyringNode | null = null;
function keyring(): KmsKeyringNode {
  if (!_keyring) {
    const keyId = process.env.KMS_KEY_ID;
    if (!keyId) throw new Error('KMS_KEY_ID is not set');
    _keyring = new KmsKeyringNode({ keyIds: [keyId] });
  }
  return _keyring;
}

// Decrypts a Python-produced AWS-Encryption-SDK ciphertext and verifies the
// encryption context {person_id, field} matches — rejects swapped ciphertexts.
export async function decryptField(
  ciphertext: Buffer,
  personId: string,
  field: string,
): Promise<string> {
  const { plaintext, messageHeader } = await decrypt(keyring(), ciphertext);
  const ec = (messageHeader as { encryptionContext?: Record<string, string> }).encryptionContext || {};
  if (ec.person_id !== personId || ec.field !== field) {
    throw new Error(
      `encryption context mismatch: expected person_id=${personId} field=${field}, ` +
        `got ${ec.person_id}/${ec.field}`,
    );
  }
  return plaintext.toString('utf8');
}

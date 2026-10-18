import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign, verify} from 'node:crypto';
import {base58Encode, base58Decode, parsePublicKey, shortvec, memoMessage, unsignedTransaction, reviewMemo, MEMO_PROGRAM_ID} from './solana.mjs';

test('base58 matches known vectors', () => {
  assert.equal(base58Encode(new Uint8Array(32)), '11111111111111111111111111111111'); // System Program ID
  assert.equal(base58Encode(new TextEncoder().encode('hello world')), 'StV1DL6CwTryKyV');
  assert.equal(new TextDecoder().decode(base58Decode('StV1DL6CwTryKyV')), 'hello world');
  assert.equal(base58Decode(MEMO_PROGRAM_ID).length, 32);
  assert.equal(base58Encode(base58Decode(MEMO_PROGRAM_ID)), MEMO_PROGRAM_ID);
  assert.throws(() => base58Decode('0OIl'), /Invalid base58/);
});

test('rejects anything that is not a 32-byte account', () => {
  assert.throws(() => parsePublicKey('abc'), /Invalid Solana account/);
  assert.throws(() => parsePublicKey(undefined), /Invalid Solana account/);
  assert.equal(parsePublicKey(MEMO_PROGRAM_ID).length, 32);
});

test('compact-u16 encoding matches the Solana wire format', () => {
  assert.deepEqual(shortvec(0), [0]);
  assert.deepEqual(shortvec(127), [0x7f]);
  assert.deepEqual(shortvec(128), [0x80, 0x01]);
  assert.deepEqual(shortvec(16383), [0xff, 0x7f]);
  assert.deepEqual(shortvec(16384), [0x80, 0x80, 0x01]);
});

// Decodes the legacy transaction back into its parts to check every field lands where Solana expects it.
function readShortvec(bytes, offset) {
  let value = 0, shift = 0, byte;
  do { byte = bytes[offset++]; value |= (byte & 0x7f) << shift; shift += 7; } while (byte & 0x80);
  return [value, offset];
}

test('memo transaction has the correct layout and signs like a real wallet would', () => {
  const {publicKey, privateKey} = generateKeyPairSync('ed25519');
  const payer = Buffer.from(publicKey.export({format: 'jwk'}).x, 'base64url');
  const blockhash = base58Encode(Uint8Array.from({length: 32}, (_, i) => i + 1));
  const memo = reviewMemo({id: '3f1c2a9e-1b2c-4d5e-8f90-1234567890ab', hash: 'a'.repeat(64)});
  assert.ok(new TextEncoder().encode(memo).length > 127, 'memo exercises a 2-byte length prefix');

  const tx = Buffer.from(unsignedTransaction(memoMessage(payer, blockhash, memo)), 'base64');
  let [sigCount, o] = readShortvec(tx, 0);
  assert.equal(sigCount, 1);
  assert.deepEqual([...tx.subarray(o, o + 64)], Array(64).fill(0));
  const message = tx.subarray(o + 64);

  assert.deepEqual([...message.subarray(0, 3)], [1, 0, 1]);
  let [keyCount, m] = readShortvec(message, 3);
  assert.equal(keyCount, 2);
  assert.deepEqual(message.subarray(m, m + 32), payer);
  assert.equal(base58Encode(message.subarray(m + 32, m + 64)), MEMO_PROGRAM_ID);
  m += 64;
  assert.equal(base58Encode(message.subarray(m, m + 32)), blockhash);
  m += 32;
  let ixCount; [ixCount, m] = readShortvec(message, m);
  assert.equal(ixCount, 1);
  assert.equal(message[m++], 1);
  let accCount; [accCount, m] = readShortvec(message, m);
  assert.equal(accCount, 1);
  assert.equal(message[m++], 0);
  let dataLen; [dataLen, m] = readShortvec(message, m);
  assert.equal(new TextDecoder().decode(message.subarray(m, m + dataLen)), memo);
  assert.equal(m + dataLen, message.length, 'no trailing bytes');

  // A wallet signs the message bytes with ed25519; the signature must verify against the payer key.
  const signature = sign(null, message, privateKey);
  assert.ok(verify(null, message, publicKey, signature));
});

test('memo never includes patient identifiers', () => {
  const memo = reviewMemo({id: 'uuid-1', hash: 'h', patient_id: 'p100001', name: 'Patient 100001'});
  assert.ok(!memo.includes('p100001') && !memo.includes('Patient'));
});

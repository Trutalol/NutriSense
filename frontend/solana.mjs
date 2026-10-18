// Minimal, dependency-free Solana support for the NutriSense Blink (Solana Actions spec).
// Builds a legacy transaction with one SPL Memo instruction and verifies it on-chain via JSON-RPC.

export const CLUSTER = 'devnet';
// CAIP-2 chain ID for Solana devnet, sent in the X-Blockchain-Ids header.
export const BLOCKCHAIN_ID = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
export const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

// Headers every Actions endpoint must return so blink clients (dial.to, wallets) can call them cross-origin.
export const ACTION_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Encoding, Accept-Encoding, X-Accept-Action-Version, X-Accept-Blockchain-Ids',
  'Access-Control-Expose-Headers': 'X-Action-Version, X-Blockchain-Ids',
  'X-Action-Version': '2.4',
  'X-Blockchain-Ids': BLOCKCHAIN_ID,
};

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const INDEX = Object.fromEntries([...ALPHABET].map((c, i) => [c, BigInt(i)]));

export function base58Encode(bytes) {
  let n = 0n;
  for (const b of bytes) n = n * 256n + BigInt(b);
  let out = '';
  while (n > 0n) { out = ALPHABET[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b !== 0) break; out = '1' + out; }
  return out;
}

export function base58Decode(text) {
  if (typeof text !== 'string' || !text.length) throw new Error('Empty base58 string');
  let n = 0n;
  for (const c of text) {
    if (!(c in INDEX)) throw new Error('Invalid base58 character');
    n = n * 58n + INDEX[c];
  }
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n % 256n)); n /= 256n; }
  for (const c of text) { if (c !== '1') break; bytes.unshift(0); }
  return Uint8Array.from(bytes);
}

// A Solana public key is exactly 32 bytes once base58-decoded.
export function parsePublicKey(text) {
  let bytes;
  try { bytes = base58Decode(text); } catch { bytes = null; }
  if (!bytes || bytes.length !== 32) throw Object.assign(new Error('Invalid Solana account'), {status: 400});
  return bytes;
}

// Solana "compact-u16" length prefix.
export function shortvec(value) {
  const out = [];
  do {
    let byte = value & 0x7f;
    value >>= 7;
    if (value) byte |= 0x80;
    out.push(byte);
  } while (value);
  return out;
}

// Legacy message: payer (writable signer) + memo program (readonly), one memo instruction signed by the payer.
export function memoMessage(payer, blockhash, memo) {
  const program = base58Decode(MEMO_PROGRAM_ID);
  const recent = base58Decode(blockhash);
  if (payer.length !== 32 || program.length !== 32 || recent.length !== 32) throw new Error('Bad key length');
  const data = new TextEncoder().encode(memo);
  if (data.length > 566) throw new Error('Memo too long');
  return Uint8Array.from([
    1, 0, 1,                         // header: 1 signature, 0 readonly signed, 1 readonly unsigned
    ...shortvec(2), ...payer, ...program,
    ...recent,
    ...shortvec(1),                  // one instruction
    1,                               // program ID index (memo program)
    ...shortvec(1), 0,               // accounts: the payer must sign the memo
    ...shortvec(data.length), ...data,
  ]);
}

// Unsigned transaction: one empty signature slot followed by the message, base64-encoded per the Actions spec.
export function unsignedTransaction(message) {
  return Buffer.from(Uint8Array.from([...shortvec(1), ...new Uint8Array(64), ...message])).toString('base64');
}

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Object.assign(new Error(`Solana RPC unavailable (${response.status})`), {status: 502});
  const body = await response.json();
  if (body.error) throw Object.assign(new Error(`Solana RPC error: ${body.error.message}`), {status: 502});
  return body.result;
}

export async function latestBlockhash() {
  return (await rpc('getLatestBlockhash', [{commitment: 'confirmed'}])).value.blockhash;
}

// Memo text written on-chain. It carries only the prediction UUID and the snapshot hash, never patient identifiers.
export function reviewMemo(prediction) {
  return `NutriSense nutrition review v1 | prediction ${prediction.id} | sha256 ${prediction.hash}`;
}

// Polls devnet until the signature is confirmed, then checks it was signed by `account`, succeeded,
// and carries exactly the expected memo. Returns null if it never confirms in time.
export async function verifyMemoTransaction(signature, account, memo, {attempts = 15, delayMs = 2000} = {}) {
  for (let i = 0; i < attempts; i++) {
    const tx = await rpc('getTransaction', [signature, {encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0}]);
    if (tx) {
      if (tx.meta?.err) throw Object.assign(new Error('The transaction failed on-chain'), {status: 400});
      const keys = tx.transaction.message.accountKeys;
      if (!keys.some(k => k.pubkey === account && k.signer)) throw Object.assign(new Error('Transaction was not signed by this account'), {status: 400});
      const memos = tx.transaction.message.instructions.filter(ix => ix.programId === MEMO_PROGRAM_ID).map(ix => ix.parsed);
      if (!memos.includes(memo)) throw Object.assign(new Error('Transaction memo does not match this review'), {status: 400});
      return {slot: tx.slot, blockTime: tx.blockTime};
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return null;
}

export const explorerUrl = signature => `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;

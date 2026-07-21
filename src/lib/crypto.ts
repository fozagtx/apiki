import { VERIFIER_TEXT, type WorkspaceEnvelope, type WorkspaceRecord } from "./types";

export async function deriveKey(passphrase: string, saltBase64: string) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64ToBytes(saltBase64),
      iterations: 210000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(key: CryptoKey, value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return {
    iv: bytesToBase64(iv),
    cipherText: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptString(key: CryptoKey, ivBase64: string, cipherTextBase64: string) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivBase64) },
    key,
    base64ToBytes(cipherTextBase64),
  );
  return new TextDecoder().decode(decrypted);
}

export async function createWorkspace({
  workspaceName,
  ownerEmail,
  passphrase,
  records,
}: {
  workspaceName: string;
  ownerEmail: string;
  passphrase: string;
  records: WorkspaceRecord[];
}) {
  const salt = randomBase64(16);
  const key = await deriveKey(passphrase, salt);
  const verifier = await encryptString(key, VERIFIER_TEXT);
  const envelope: WorkspaceEnvelope = {
    version: 1,
    salt,
    verifier,
    meta: {
      workspaceName,
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
    records,
    monitoring: {
      rotation: true,
      docs: true,
      inactive: true,
      cost: true,
    },
  };
  return { envelope, key };
}

export async function unlockWorkspace(workspace: WorkspaceEnvelope, passphrase: string) {
  const key = await deriveKey(passphrase, workspace.salt);
  const verified = await decryptString(key, workspace.verifier.iv, workspace.verifier.cipherText);
  if (verified !== VERIFIER_TEXT) {
    throw new Error("Invalid workspace passphrase.");
  }
  return key;
}

function randomBase64(length: number) {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(length)));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

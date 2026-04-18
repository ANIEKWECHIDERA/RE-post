import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getServerEnv } from "@/lib/env/server";

const algorithm = "aes-256-gcm";

export function encryptSecret(plaintext: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(payload: string) {
  const key = getEncryptionKey();
  const [version, iv, tag, ciphertext] = payload.split(".");

  if (version !== "v1" || !iv || !tag || !ciphertext) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function getEncryptionKey() {
  const env = getServerEnv();
  const rawKey = env?.TOKEN_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required for provider token encryption.");
  }

  const key = Buffer.from(rawKey, "base64url");

  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes.");
  }

  return key;
}

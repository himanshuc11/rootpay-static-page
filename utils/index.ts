import { randomBytes } from "node:crypto";
import type { ClientData, EncrptedData, HexConverter, VerifyData } from "@/types";
import { createDecipheriv } from 'node:crypto';

const toHex: HexConverter = (arr) =>
    Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');

export function generateClientIdAndClientSecret(): ClientData {
    const clientId = randomBytes(32).toString("hex");
    const clientSecret = randomBytes(32).toString("hex");

    return {
        clientId,
        clientSecret
    }
}

export async function generateSecureToken(clientSecret: string): Promise<EncrptedData> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const key = new TextEncoder().encode(clientSecret.slice(0, 32));
  
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
  
    const encodedTimestamp = new TextEncoder().encode(Date.now().toString());
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      cryptoKey,
      encodedTimestamp
    );
  
    const encryptedArray = new Uint8Array(encrypted);
    const authTag = encryptedArray.slice(-16);
    const encryptedContent = encryptedArray.slice(0, -16);
    
    return {
      token: `${toHex(encryptedContent)}.${toHex(authTag)}`,
      iv: toHex(iv)
    };
}

export function verifyToken(verifyData: VerifyData): boolean {
    try {
        const { token, iv, clientSecret } = verifyData
        const [encrypted, authTag] = token.split('.');
        const decipher = createDecipheriv('aes-256-gcm', Buffer.from(clientSecret.slice(0, 32)), Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        decipher.update(encrypted, 'hex', 'utf8');
        decipher.final();
        return true;
    } catch {
        return false;
    }
}
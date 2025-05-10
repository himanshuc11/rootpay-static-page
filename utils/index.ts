import { randomBytes } from "node:crypto";
import type { ClientData, EncrptedData, VerifyData } from "@/types";
import { createCipheriv, createDecipheriv } from 'node:crypto';

export function generateClientIdAndClientSecret(): ClientData {
    const clientId = randomBytes(32).toString("hex");
    const clientSecret = randomBytes(32).toString("hex");

    return {
        clientId,
        clientSecret
    }
}

export function generateSecureToken(clientSecret: string): EncrptedData {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', Buffer.from(clientSecret.slice(0, 32)), iv);
    const encrypted = cipher.update(Date.now().toString(), 'utf8', 'hex');
    const final = encrypted + cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
        token: `${final}.${authTag.toString('hex')}`,
        iv: iv.toString('hex')
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
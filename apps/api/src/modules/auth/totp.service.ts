import { Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'node:crypto';

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

export interface GeneratedBackupCodes {
  rawCodes: string[];
  hashedCodes: { codeHash: string }[];
}

@Injectable()
export class TotpService {
  constructor() {}

  /**
   * Generates a new TOTP secret, otpauth URL, and Data URL QR code
   */
  async generateSecret(email: string): Promise<TotpSetupResult> {
    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'ClinicOS', label: email, secret });
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      otpauthUrl,
      qrCodeUrl,
    };
  }

  /**
   * Verifies a 6-digit TOTP token against secret
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      const res = verifySync({ token, secret });
      return typeof res === 'boolean' ? res : (res as any)?.valid === true;
    } catch {
      return false;
    }
  }

  /**
   * Hashes a backup code using SHA-256
   */
  hashBackupCode(code: string): string {
    const cleanCode = code.replace(/[\s-]/g, '').toLowerCase();
    return crypto.createHash('sha256').update(cleanCode).digest('hex');
  }

  /**
   * Generates 10 single-use random backup codes (formatted as XXXX-XXXX)
   */
  generateBackupCodes(count = 10): GeneratedBackupCodes {
    const rawCodes: string[] = [];
    const hashedCodes: { codeHash: string }[] = [];

    for (let i = 0; i < count; i++) {
      const hex = crypto.randomBytes(4).toString('hex').toLowerCase();
      const formatted = `${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
      rawCodes.push(formatted);

      const codeHash = this.hashBackupCode(formatted);
      hashedCodes.push({ codeHash });
    }

    return { rawCodes, hashedCodes };
  }
}

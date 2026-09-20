import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'node:crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const keyString =
      this.configService.get<string>('FIELD_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'default_encryption_key_32bytes!!';

    // Derive 32-byte Buffer key via SHA-256
    this.key = crypto.createHash('sha256').update(keyString).digest();
  }

  /**
   * Encrypts plaintext using AES-256-GCM
   * Returns format: `ivHex:authTagHex:ciphertextHex`
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts AES-256-GCM ciphertext in format `ivHex:authTagHex:ciphertextHex`
   */
  decrypt(encryptedPayload: string): string {
    const parts = encryptedPayload.split(':');
    const ivHex = parts[0];
    const authTagHex = parts[1];
    const ciphertextHex = parts[2];

    if (parts.length !== 3 || !ivHex || !authTagHex || !ciphertextHex) {
      throw new Error('Invalid encrypted payload format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = decipher.update(ciphertextHex, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
  }
}

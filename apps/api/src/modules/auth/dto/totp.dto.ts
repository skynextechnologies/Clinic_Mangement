import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const Enable2faSchema = z.object({
  secret: z.string().min(16, 'Invalid secret length'),
  token: z.string().length(6, 'TOTP token must be exactly 6 digits'),
});

export class Enable2faDto extends createZodDto(Enable2faSchema) {}

export const Verify2faSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().min(6, 'Code must be at least 6 characters'),
});

export class Verify2faDto extends createZodDto(Verify2faSchema) {}

export const Disable2faSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export class Disable2faDto extends createZodDto(Disable2faSchema) {}

export const RegenerateBackupCodesSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export class RegenerateBackupCodesDto extends createZodDto(RegenerateBackupCodesSchema) {}

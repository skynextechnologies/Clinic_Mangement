import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const COMMON_PASSWORDS = [
  'password1234',
  '123456789012',
  'qwerty123456',
  'admin1234567',
  'password123456',
];

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .refine(
    (pwd) => !COMMON_PASSWORDS.includes(pwd.toLowerCase()),
    'Password is too common or easily guessable',
  );

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export class LoginDto extends createZodDto(loginSchema) {}

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format'),
});

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}

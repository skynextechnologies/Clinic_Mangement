import { z } from 'zod';

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),
  PORT: z.coerce.number().int().default(4000),

  DATABASE_URL: z
    .string()
    .default('postgresql://clinicos:clinicos_dev_pass@localhost:5432/clinicos?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
    .default('dev_jwt_access_secret_change_in_prod_32chars!'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
    .default('dev_jwt_refresh_secret_change_in_prod_32chars!'),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  FIELD_ENCRYPTION_KEY: z.string().default('c3VwZXJzZWNyZXRkZXZrZXkxMjM0NTY3ODkwMTIzNDU9'),

  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('clinicos-files'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('ClinicOS <noreply@clinicos.local>'),

  SMS_PROVIDER: z.string().default('console'),
  PAYMENT_PROVIDER: z.string().default('stripe_test'),
  STRIPE_SECRET_KEY: z.string().default('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),

  DEFAULT_TIMEZONE: z.string().default('UTC'),
  DEFAULT_CURRENCY: z.string().default('USD'),
});

export type ApiConfig = z.infer<typeof configSchema>;

export function validateConfig(config: Record<string, unknown>): ApiConfig {
  const result = configSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`[Config Error] Environment configuration validation failed:\n${formatted}`);
  }
  return result.data;
}

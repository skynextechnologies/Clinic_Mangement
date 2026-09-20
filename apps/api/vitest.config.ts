import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.e2e-spec.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      DATABASE_URL: 'postgresql://clinicos:clinicos_dev_pass@localhost:5433/clinicos?schema=public',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'dev_jwt_access_secret_key_32bytes_long!!',
      JWT_REFRESH_SECRET: 'dev_jwt_refresh_secret_key_32bytes_long!',
      COOKIE_SECRET: 'dev_cookie_secret_key_32bytes_long!!',
      SMTP_HOST: 'localhost',
      SMTP_PORT: '1025',
      STORAGE_ENDPOINT: 'localhost',
      STORAGE_PORT: '9000',
      STORAGE_ACCESS_KEY: 'minioadmin',
      STORAGE_SECRET_KEY: 'minioadmin',
    },
  },
});

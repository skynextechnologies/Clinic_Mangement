import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  idSchema,
  paginationSchema,
  sortSchema,
  e164PhoneSchema,
  moneySchema,
  problemJsonSchema,
  createApiEnvelopeSchema,
} from '../schemas.js';

describe('Base Zod Schemas (100% Coverage)', () => {
  it('validates idSchema', () => {
    expect(idSchema.parse('abc-123')).toBe('abc-123');
    expect(() => idSchema.parse('')).toThrow();
  });

  it('validates paginationSchema defaults', () => {
    const parsed = paginationSchema.parse({});
    expect(parsed).toEqual({ page: 1, limit: 20 });

    const custom = paginationSchema.parse({ page: '2', limit: '50' });
    expect(custom).toEqual({ page: 2, limit: 50 });
  });

  it('validates sortSchema defaults', () => {
    const parsed = sortSchema.parse({});
    expect(parsed.sortOrder).toBe('asc');
  });

  it('validates e164PhoneSchema', () => {
    expect(e164PhoneSchema.parse('+14155552671')).toBe('+14155552671');
    expect(() => e164PhoneSchema.parse('14155552671')).toThrow();
    expect(() => e164PhoneSchema.parse('invalid')).toThrow();
  });

  it('validates moneySchema', () => {
    const parsed = moneySchema.parse({ amountMinor: 1500 });
    expect(parsed).toEqual({ amountMinor: 1500, currency: 'USD' });
    expect(() => moneySchema.parse({ amountMinor: -100 })).toThrow();
  });

  it('validates problemJsonSchema', () => {
    const problem = problemJsonSchema.parse({
      title: 'Not Found',
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
    });
    expect(problem.type).toBe('about:blank');
    expect(problem.status).toBe(404);
  });

  it('creates and validates API envelope schema', () => {
    const schema = createApiEnvelopeSchema(z.object({ name: z.string() }));
    const parsed = schema.parse({
      data: { name: 'Test' },
      meta: { page: 1, total: 100 },
    });
    expect(parsed.data.name).toBe('Test');
    expect(parsed.meta?.total).toBe(100);
  });
});

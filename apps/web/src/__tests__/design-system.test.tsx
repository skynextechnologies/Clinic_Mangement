import { describe, expect, it } from 'vitest';
import { PRODUCT_NAME } from '@clinicos/shared';

describe('Web Scaffold & Shared Integration', () => {
  it('should import PRODUCT_NAME from @clinicos/shared correctly', () => {
    expect(PRODUCT_NAME).toBe('ClinicOS');
  });
});

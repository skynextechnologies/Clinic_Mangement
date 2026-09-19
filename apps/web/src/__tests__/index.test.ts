import { describe, expect, it } from 'vitest';
import { PRODUCT_NAME } from '@clinicos/shared';

describe('Web Scaffold', () => {
  it('should import PRODUCT_NAME from shared', () => {
    expect(PRODUCT_NAME).toBe('ClinicOS');
  });
});

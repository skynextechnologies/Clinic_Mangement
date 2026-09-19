import { describe, expect, it } from 'vitest';
import { PRODUCT_NAME } from '../index.js';

describe('PRODUCT_NAME', () => {
  it('should equal ClinicOS', () => {
    expect(PRODUCT_NAME).toBe('ClinicOS');
  });
});

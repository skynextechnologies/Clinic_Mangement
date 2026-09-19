import { describe, expect, it } from 'vitest';
import {
  toMinorUnits,
  toMajorUnits,
  calculateTax,
  applyDiscount,
  allocateLargestRemainder,
  formatMoney,
} from '../money.js';

describe('Money Utilities (100% Coverage)', () => {
  it('converts major to minor units correctly', () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(0)).toBe(0);
    expect(toMinorUnits(100.5)).toBe(10050);
  });

  it('converts minor to major units correctly', () => {
    expect(toMajorUnits(1999)).toBe(19.99);
    expect(toMajorUnits(0)).toBe(0);
    expect(toMajorUnits(10050)).toBe(100.5);
  });

  it('calculates exclusive tax correctly (1000 bps = 10%)', () => {
    const result = calculateTax(10000, 1000, false); // $100.00 subtotal, 10% tax
    expect(result.netMinor).toBe(10000);
    expect(result.taxMinor).toBe(1000);
    expect(result.totalMinor).toBe(11000);
  });

  it('calculates inclusive tax correctly (1000 bps = 10%)', () => {
    const result = calculateTax(11000, 1000, true); // $110.00 total incl tax
    expect(result.totalMinor).toBe(11000);
    expect(result.netMinor).toBe(10000);
    expect(result.taxMinor).toBe(1000);
  });

  it('throws error on negative values in calculateTax', () => {
    expect(() => calculateTax(-100, 1000)).toThrow();
    expect(() => calculateTax(1000, -100)).toThrow();
  });

  it('applies percentage and fixed discounts correctly', () => {
    const pct = applyDiscount(10000, 15, true); // 15% of $100 = $15
    expect(pct.discountMinor).toBe(1500);
    expect(pct.discountedSubtotalMinor).toBe(8500);

    const fixed = applyDiscount(10000, 2500, false); // $25 off $100
    expect(fixed.discountMinor).toBe(2500);
    expect(fixed.discountedSubtotalMinor).toBe(7500);

    const capped = applyDiscount(10000, 15000, false); // discount > subtotal
    expect(capped.discountMinor).toBe(10000);
    expect(capped.discountedSubtotalMinor).toBe(0);
  });

  it('throws error on negative values in applyDiscount', () => {
    expect(() => applyDiscount(-100, 10)).toThrow();
    expect(() => applyDiscount(1000, -5)).toThrow();
  });

  it('allocates minor units using largest remainder method without losing cents', () => {
    // Distribute 100 minor units ($1.00) among 3 items equally weighted (33.33 each)
    const result = allocateLargestRemainder(100, [1, 1, 1]);
    expect(result).toEqual([34, 33, 33]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);

    // Empty weights
    expect(allocateLargestRemainder(100, [])).toEqual([]);

    // Zero weights sum
    expect(allocateLargestRemainder(100, [0, 0, 0])).toEqual([34, 33, 33]);
  });

  it('formats minor units into currency strings', () => {
    const formatted = formatMoney(1999, 'USD', 'en-US');
    expect(formatted).toContain('19.99');
  });
});

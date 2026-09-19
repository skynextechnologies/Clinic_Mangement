import { describe, expect, it } from 'vitest';
import { toUtcIsoString, isValidIsoDate, calculateBmi } from '../time.js';

describe('Time and Clinical Calculation Helpers (100% Coverage)', () => {
  it('formats UTC ISO strings correctly', () => {
    const d = new Date('2026-01-01T12:00:00Z');
    expect(toUtcIsoString(d)).toBe('2026-01-01T12:00:00.000Z');
    expect(() => toUtcIsoString('invalid-date')).toThrow();
  });

  it('validates ISO date strings', () => {
    expect(isValidIsoDate('2026-01-01T12:00:00Z')).toBe(true);
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate('invalid-date')).toBe(false);
  });

  it('calculates BMI accurately', () => {
    // Height 175cm (1.75m), Weight 70kg -> 70 / (1.75 * 1.75) = 22.857... -> 22.9
    expect(calculateBmi(175, 70)).toBe(22.9);
    expect(() => calculateBmi(0, 70)).toThrow();
    expect(() => calculateBmi(175, -5)).toThrow();
  });
});

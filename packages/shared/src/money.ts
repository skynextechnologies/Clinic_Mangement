/**
 * Integer Minor Unit Money Utilities for ClinicOS
 * Prevents floating-point rounding errors across billing, tax, and inventory calculations.
 */

export interface TaxCalculationResult {
  netMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export interface DiscountCalculationResult {
  discountMinor: number;
  discountedSubtotalMinor: number;
}

/**
 * Converts a major unit amount (e.g. 19.99) to integer minor units (e.g. 1999).
 */
export function toMinorUnits(amountMajor: number, exponent = 2): number {
  const factor = Math.pow(10, exponent);
  return Math.round(amountMajor * factor);
}

/**
 * Converts integer minor units (e.g. 1999) to major unit number (e.g. 19.99).
 */
export function toMajorUnits(minorUnits: number, exponent = 2): number {
  const factor = Math.pow(10, exponent);
  return minorUnits / factor;
}

/**
 * Calculates tax based on basis points (1 bps = 0.01%, 100 bps = 1%, 10000 bps = 100%).
 * Supports exclusive and inclusive tax calculations.
 */
export function calculateTax(
  amountMinor: number,
  rateBps: number,
  isInclusive = false,
): TaxCalculationResult {
  if (amountMinor < 0 || rateBps < 0) {
    throw new Error('Amount and rateBps must be non-negative');
  }

  if (isInclusive) {
    // totalMinor = amountMinor
    // netMinor = totalMinor / (1 + rateBps / 10000)
    // taxMinor = totalMinor - netMinor
    const totalMinor = amountMinor;
    const netMinor = Math.round((totalMinor * 10000) / (10000 + rateBps));
    const taxMinor = totalMinor - netMinor;
    return { netMinor, taxMinor, totalMinor };
  } else {
    // netMinor = amountMinor
    // taxMinor = netMinor * rateBps / 10000
    const netMinor = amountMinor;
    const taxMinor = Math.round((netMinor * rateBps) / 10000);
    const totalMinor = netMinor + taxMinor;
    return { netMinor, taxMinor, totalMinor };
  }
}

/**
 * Calculates discount as percentage (bps or %) or fixed minor amount.
 */
export function applyDiscount(
  subtotalMinor: number,
  discountValue: number,
  isPercentage = false,
): DiscountCalculationResult {
  if (subtotalMinor < 0 || discountValue < 0) {
    throw new Error('Subtotal and discountValue must be non-negative');
  }

  let discountMinor = 0;
  if (isPercentage) {
    // discountValue is percentage float (e.g. 10.5 for 10.5%)
    discountMinor = Math.min(subtotalMinor, Math.round((subtotalMinor * discountValue) / 100));
  } else {
    // discountValue is minor units
    discountMinor = Math.min(subtotalMinor, Math.round(discountValue));
  }

  const discountedSubtotalMinor = subtotalMinor - discountMinor;
  return { discountMinor, discountedSubtotalMinor };
}

/**
 * Allocates a total integer minor unit amount proportionally across weights
 * using the Hare-Niemeyer / Largest Remainder Method so that sum(allocated) === totalMinor.
 */
export function allocateLargestRemainder(totalMinor: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const sumWeights = weights.reduce((acc, w) => acc + w, 0);
  if (sumWeights === 0) {
    // Distribute equally
    const base = Math.floor(totalMinor / weights.length);
    const remainder = totalMinor - base * weights.length;
    return weights.map((_, idx) => base + (idx < remainder ? 1 : 0));
  }

  const exacts = weights.map((w) => (totalMinor * w) / sumWeights);
  const floors = exacts.map((e) => Math.floor(e));
  const remainder = totalMinor - floors.reduce((acc, f) => acc + f, 0);

  const fractionals = exacts.map((e, idx) => ({
    index: idx,
    fraction: e - floors[idx]!,
  }));

  // Sort descending by fractional part
  fractionals.sort((a, b) => b.fraction - a.fraction);

  const result = [...floors];
  for (let i = 0; i < remainder; i++) {
    const item = fractionals[i];
    if (item) {
      result[item.index] = (result[item.index] ?? 0) + 1;
    }
  }

  return result;
}

/**
 * Formats integer minor units into a localized currency string (e.g. $19.99).
 */
export function formatMoney(minorUnits: number, currency = 'USD', locale = 'en-US'): string {
  const majorUnits = toMajorUnits(minorUnits);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(majorUnits);
}

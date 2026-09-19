/**
 * Date/Time and clinical calculation helpers for ClinicOS
 */

export function toUtcIsoString(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date value');
  }
  return d.toISOString();
}

export function isValidIsoDate(str: string): boolean {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

/**
 * Calculates Body Mass Index (BMI): weight (kg) / (height (m))^2
 * Rounded to 1 decimal place.
 */
export function calculateBmi(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error('Height and weight must be positive numbers');
  }
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  return Math.round(bmi * 10) / 10;
}

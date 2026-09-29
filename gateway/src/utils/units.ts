/**
 * Unit conversion utilities for ReBIM Copilot
 * All length values normalized to millimeters at public boundary
 */

export type UnitType = 'mm' | 'cm' | 'm' | 'ft' | 'in';

const toMmFactors: Record<UnitType, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  ft: 304.8,
  in: 25.4
};

/**
 * Convert value from source unit to millimeters
 */
export function toMillimeters(value: number, fromUnit: UnitType): number {
  return value * toMmFactors[fromUnit];
}

/**
 * Convert value from millimeters to target unit
 */
export function fromMillimeters(value: number, toUnit: UnitType): number {
  return value / toMmFactors[toUnit];
}

/**
 * Normalize a value with unit to millimeters
 */
export function normalizeToMm(value: number, unit: UnitType): number {
  return toMillimeters(value, unit);
}

/**
 * Format millimeter value for display
 */
export function formatMm(value: number, precision: number = 1): string {
  return `${value.toFixed(precision)} mm`;
}

/**
 * Parse unit string to UnitType
 */
export function parseUnit(unit: string): UnitType {
  const normalized = unit.toLowerCase().trim();
  const unitMap: Record<string, UnitType> = {
    'mm': 'mm',
    'millimeter': 'mm',
    'millimeters': 'mm',
    'cm': 'cm',
    'centimeter': 'cm',
    'centimeters': 'cm',
    'm': 'm',
    'meter': 'm',
    'meters': 'm',
    'ft': 'ft',
    'foot': 'ft',
    'feet': 'ft',
    'in': 'in',
    'inch': 'in',
    'inches': 'in'
  };
  return unitMap[normalized] || 'mm';
}

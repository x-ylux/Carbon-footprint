import { describe, expect, it } from 'vitest';
import {
  cashTransactionCO2,
  digitalCO2,
  energyCO2,
  foodCO2,
  shoppingCO2,
  transportCO2,
  validateEmissionInput,
  sanitizeNumericInput,
  getCarbonIndicatorForRegion,
  getCarbonIndicator,
  calculateCarbonEmission,
  resolveEmissionSource,
  REGION_FACTORS,
  DEFAULT_REGION,
  type RegionCode,
} from '../lib/co2Formulas';

describe('CO2 formula validation', () => {
  it('calculates car transport correctly', () => {
    expect(transportCO2.car(100)).toBeCloseTo(100 * 0.12 * 12);
  });

  it('calculates electricity correctly', () => {
    // India electricity grid factor is 0.71 kg CO2/kWh
    expect(energyCO2.electricity(200)).toBeCloseTo(200 * 0.71 * 12);
  });

  it('calculates vegetarian meals correctly', () => {
    expect(foodCO2.mealsPerYear(3, 'vegetarian')).toBeCloseTo(3 * 0.5 * 365);
  });

  it('calculates non-vegetarian meals correctly', () => {
    expect(foodCO2.mealsPerYear(3, 'non-vegetarian')).toBeCloseTo(3 * 1.2 * 365);
  });

  it('calculates online deliveries correctly', () => {
    expect(shoppingCO2.online(10)).toBeCloseTo(10 * 5 * 12);
  });

  it('returns positive values for cash transaction CO2', () => {
    expect(cashTransactionCO2('food', 1000)).toBeGreaterThan(0);
  });

  it('returns zero for zero input values', () => {
    expect(transportCO2.car(0)).toBe(0);
    expect(energyCO2.electricity(0)).toBe(0);
    expect(foodCO2.mealsPerYear(0, 'vegetarian')).toBe(0);
    expect(shoppingCO2.online(0)).toBe(0);
    expect(digitalCO2.email(0)).toBe(0);
  });

  it('handles very large input values without NaN', () => {
    expect(transportCO2.car(1000000)).toBeCloseTo(1000000 * 0.12 * 12);
    expect(energyCO2.electricity(999999)).toBeCloseTo(999999 * 0.71 * 12);
  });
});

describe('Regional emission factors', () => {
  const regions: RegionCode[] = ['IN', 'US', 'EU', 'CN', 'GLOBAL'];

  it('has factors for all supported regions', () => {
    for (const region of regions) {
      const factors = REGION_FACTORS[region];
      expect(factors).toBeDefined();
      expect(factors.electricityFactorPerKwh).toBeGreaterThan(0);
      expect(factors.carFactorPerKm).toBeGreaterThan(0);
      expect(factors.perCapitaAverageKg).toBeGreaterThan(0);
      expect(factors.safeTargetKg).toBeGreaterThan(0);
    }
  });

  it('US electricity factor differs from India', () => {
    expect(REGION_FACTORS.US.electricityFactorPerKwh).not.toBe(REGION_FACTORS.IN.electricityFactorPerKwh);
  });

  it('US per-capita average is higher than India', () => {
    expect(REGION_FACTORS.US.perCapitaAverageKg).toBeGreaterThan(REGION_FACTORS.IN.perCapitaAverageKg);
  });

  it('defaults to India when DEFAULT_REGION is used', () => {
    expect(DEFAULT_REGION).toBe('IN');
  });
});

describe('Input validation', () => {
  it('accepts valid non-negative numbers', () => {
    expect(validateEmissionInput(0).isValid).toBe(true);
    expect(validateEmissionInput(100).isValid).toBe(true);
    expect(validateEmissionInput(0.5).isValid).toBe(true);
  });

  it('rejects NaN', () => {
    const result = validateEmissionInput(NaN);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects negative values', () => {
    const result = validateEmissionInput(-10);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('rejects values exceeding the maximum', () => {
    const result = validateEmissionInput(2_000_000, 1_000_000);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('maximum');
  });
});

describe('sanitizeNumericInput', () => {
  it('returns valid numbers as-is', () => {
    expect(sanitizeNumericInput(42)).toBe(42);
    expect(sanitizeNumericInput(0)).toBe(0);
    expect(sanitizeNumericInput(3.14)).toBe(3.14);
  });

  it('returns 0 for NaN, null, undefined', () => {
    expect(sanitizeNumericInput(NaN)).toBe(0);
    expect(sanitizeNumericInput(null)).toBe(0);
    expect(sanitizeNumericInput(undefined)).toBe(0);
    expect(sanitizeNumericInput('abc')).toBe(0);
  });

  it('clamps negative values to 0', () => {
    expect(sanitizeNumericInput(-5)).toBe(0);
    expect(sanitizeNumericInput(-0.1)).toBe(0);
  });

  it('returns 0 for Infinity', () => {
    expect(sanitizeNumericInput(Infinity)).toBe(0);
    expect(sanitizeNumericInput(-Infinity)).toBe(0);
  });
});

describe('getCarbonIndicatorForRegion', () => {
  it('returns eco-friendly for below regional average', () => {
    const indicator = getCarbonIndicatorForRegion(1000, 'IN');
    expect(indicator.tone).toBe('emerald');
    expect(indicator.label).toContain('Eco-Friendly');
  });

  it('returns eco-friendly for below safe target even if above regional average', () => {
    // India: safe=2000, average=1600. Since safe > average, there is no amber zone.
    // 1700 is above average(1600) but below safe(2000) -> emerald
    const indicator = getCarbonIndicatorForRegion(1700, 'IN');
    expect(indicator.tone).toBe('emerald');
  });

  it('returns high for above safe target', () => {
    const indicator = getCarbonIndicatorForRegion(5000, 'IN');
    expect(indicator.tone).toBe('rose');
    expect(indicator.label).toContain('High');
  });

  it('adapts thresholds for US region', () => {
    // US average is 15300, so 1000 is eco-friendly
    const lowUS = getCarbonIndicatorForRegion(1000, 'US');
    expect(lowUS.tone).toBe('emerald');

    // US safe target is 5000, average is 15300; 8000 is above safe but below average, so amber
    const mediumUS = getCarbonIndicatorForRegion(8000, 'US');
    expect(mediumUS.tone).toBe('amber');

    // 20000 is well above US average, so rose
    const highUS = getCarbonIndicatorForRegion(20000, 'US');
    expect(highUS.tone).toBe('rose');
  });

  it('backward-compatible getCarbonIndicator uses India thresholds', () => {
    expect(getCarbonIndicator(1000).tone).toBe('emerald');
    expect(getCarbonIndicator(5000).tone).toBe('rose');
  });

  it('includes description text referencing the safe target', () => {
    const indicator = getCarbonIndicatorForRegion(1000, 'IN');
    expect(indicator.description).toContain('2,000');
  });
});

describe('calculateCarbonEmission registry', () => {
  it('calculates car emission via registry lookup', () => {
    const result = calculateCarbonEmission({
      category: 'transportation',
      subcategory: 'car',
      value: 100,
      unit: 'km/month',
    });
    expect(result).toBeCloseTo(100 * 0.12 * 12);
  });

  it('calculates diet_type emission using unit as diet name', () => {
    const vegResult = calculateCarbonEmission({
      category: 'food',
      subcategory: 'diet_type',
      value: 3,
      unit: 'vegetarian',
    });
    expect(vegResult).toBeCloseTo(3 * 0.5 * 365);

    const nonVegResult = calculateCarbonEmission({
      category: 'food',
      subcategory: 'diet_type',
      value: 3,
      unit: 'non-vegetarian',
    });
    expect(nonVegResult).toBeCloseTo(3 * 1.2 * 365);
  });

  it('returns 0 for unknown category/subcategory', () => {
    const result = calculateCarbonEmission({
      category: 'unknown',
      subcategory: 'unknown',
      value: 100,
      unit: 'x',
    });
    expect(result).toBe(0);
  });

  it('returns null for unknown source in resolveEmissionSource', () => {
    expect(resolveEmissionSource('unknown', 'unknown')).toBeNull();
  });

  it('resolves a valid source in resolveEmissionSource', () => {
    const source = resolveEmissionSource('transportation', 'car');
    expect(source).not.toBeNull();
    expect(source?.subcategory).toBe('car');
    expect(source?.category).toBe('transportation');
  });
});

describe('Bicycle emission is always zero', () => {
  it('returns 0 for any input value', () => {
    expect(transportCO2.bike()).toBe(0);
  });
});

describe('Mixed diet factor is between vegetarian and non-vegetarian', () => {
  it('mixed diet emission is between veg and non-veg', () => {
    const veg = foodCO2.mealsPerYear(3, 'vegetarian');
    const mixed = foodCO2.mealsPerYear(3, 'mixed');
    const nonVeg = foodCO2.mealsPerYear(3, 'non-vegetarian');
    expect(mixed).toBeGreaterThan(veg);
    expect(mixed).toBeLessThan(nonVeg);
  });
});

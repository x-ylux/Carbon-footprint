import { describe, expect, it } from 'vitest';
import { cashTransactionCO2, digitalCO2, energyCO2, foodCO2, shoppingCO2, transportCO2 } from '../lib/co2Formulas';

describe('CO2 formula validation', () => {
  it('calculates car transport correctly', () => {
    expect(transportCO2.car(100)).toBeCloseTo(100 * 0.12 * 12);
  });

  it('calculates electricity correctly', () => {
    expect(energyCO2.electricity(200)).toBeCloseTo(200 * 0.8 * 12);
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
    expect(energyCO2.electricity(999999)).toBeCloseTo(999999 * 0.8 * 12);
  });
});

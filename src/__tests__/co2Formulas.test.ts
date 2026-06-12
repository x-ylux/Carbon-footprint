import { describe, expect, it } from 'vitest';
import { cashTransactionCO2, energyCO2, foodCO2, shoppingCO2, transportCO2 } from '../lib/co2Formulas';

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
});

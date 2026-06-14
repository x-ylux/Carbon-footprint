import { describe, it, expect } from 'vitest';
import { cashTransactionCO2, cashCategoryFactors } from '../lib/co2Formulas';

describe('Cash transaction CO2 calculations', () => {
  it('calculates food transaction correctly', () => {
    expect(cashTransactionCO2('food', 1000)).toBeCloseTo(1000 * cashCategoryFactors.food);
  });

  it('calculates transport transaction correctly', () => {
    expect(cashTransactionCO2('transport', 500)).toBeCloseTo(500 * cashCategoryFactors.transport);
  });

  it('calculates shopping transaction correctly', () => {
    expect(cashTransactionCO2('shopping', 2000)).toBeCloseTo(2000 * cashCategoryFactors.shopping);
  });

  it('defaults to other category for unknown types', () => {
    expect(cashTransactionCO2('unknown', 100)).toBeCloseTo(100 * cashCategoryFactors.other);
  });
});

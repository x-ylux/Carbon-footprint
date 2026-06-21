import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useCarbonAccounting,
  getCarbonIndicator,
  buildCarbonEntryPayloads,
  validateCalculatorInput,
  toCalculatorValues,
} from '../hooks/useCarbonAccounting';
import type { CalculatorInputValues } from '../hooks/useCarbonAccounting';

const defaultValues: CalculatorInputValues = {
  car_km: 100,
  bus_days: 20,
  metro_km: 50,
  bike_km: 30,
  flight_count: 2,
  elec_units: 200,
  gas_liters: 10,
  water_buckets: 5,
  food_type: 'mixed',
  meals_per_day: 3,
  meat_kg: 2,
  online_orders: 5,
  clothing_items: 3,
  electronics_count: 1,
  food_waste_pct: 10,
  streaming_hours: 20,
  cloud_gb: 50,
  email_count: 10,
  call_hours: 10,
  social_hours: 2,
};

const zeroValues: CalculatorInputValues = {
  ...defaultValues,
  car_km: 0, bus_days: 0, metro_km: 0, bike_km: 0, flight_count: 0,
  elec_units: 0, gas_liters: 0, water_buckets: 0,
  meals_per_day: 0, meat_kg: 0,
  online_orders: 0, clothing_items: 0, electronics_count: 0, food_waste_pct: 0,
  streaming_hours: 0, cloud_gb: 0, email_count: 0, call_hours: 0, social_hours: 0,
};

describe('useCarbonAccounting hook', () => {
  it('calculates all emission categories', () => {
    const { result } = renderHook(() => useCarbonAccounting(defaultValues, 0));

    expect(result.current.summary.transport).toBeGreaterThan(0);
    expect(result.current.summary.energy).toBeGreaterThan(0);
    expect(result.current.summary.food).toBeGreaterThan(0);
    expect(result.current.summary.shopping).toBeGreaterThan(0);
    expect(result.current.summary.digital).toBeGreaterThan(0);
    expect(result.current.summary.total).toBeGreaterThan(0);
  });

  it('includes cash total in overall total', () => {
    const { result: r1 } = renderHook(() => useCarbonAccounting(defaultValues, 0));
    const { result: r2 } = renderHook(() => useCarbonAccounting(defaultValues, 500));

    expect(r2.current.summary.total).toBe(r1.current.summary.total + 500);
  });

  it('handles zero values correctly', () => {
    const { result } = renderHook(() => useCarbonAccounting(zeroValues, 0));
    expect(result.current.summary.total).toBe(0);
  });

  it('calculates vegetarian diet as lower than non-vegetarian', () => {
    const vegValues: CalculatorInputValues = { ...defaultValues, food_type: 'vegetarian' as const, meals_per_day: 3 };
    const nonVegValues: CalculatorInputValues = { ...defaultValues, food_type: 'non-vegetarian' as const, meals_per_day: 3 };

    const { result: vegResult } = renderHook(() => useCarbonAccounting(vegValues, 0));
    const { result: nonVegResult } = renderHook(() => useCarbonAccounting(nonVegValues, 0));

    expect(nonVegResult.current.summary.food).toBeGreaterThan(vegResult.current.summary.food);
  });

  it('returns a per-source breakdown array', () => {
    const { result } = renderHook(() => useCarbonAccounting(defaultValues, 0));

    expect(result.current.breakdown).toBeInstanceOf(Array);
    expect(result.current.breakdown.length).toBeGreaterThan(10);
    const carEntry = result.current.breakdown.find(b => b.subcategory === 'car');
    expect(carEntry).toBeDefined();
    expect(carEntry?.co2).toBeGreaterThan(0);
  });

  it('returns a region-aware indicator', () => {
    const { result } = renderHook(() => useCarbonAccounting(defaultValues, 0));

    expect(result.current.indicator).toBeDefined();
    expect(result.current.indicator.tone).toMatch(/emerald|amber|rose/);
  });

  it('adapts indicator when region changes', () => {
    const { result: inResult } = renderHook(() => useCarbonAccounting(defaultValues, 0, 'IN'));
    const { result: usResult } = renderHook(() => useCarbonAccounting(defaultValues, 0, 'US'));

    // Default total is ~5471 kg. US: safe=5000, average=15300.
    // 5471 is above safe (5000) but below average (15300) -> amber in US.
    expect(usResult.current.indicator.tone).toBe('amber');
    // India: safe=2000, average=1600. 5471 > safe and > average -> rose.
    expect(inResult.current.indicator.tone).toBe('rose');
  });
});

describe('getCarbonIndicator', () => {
  it('returns eco-friendly status for low emissions', () => {
    const indicator = getCarbonIndicator(1200);
    expect(indicator.label).toBe('Low (Eco-Friendly)');
    expect(indicator.tone).toBe('emerald');
  });

  it('returns eco-friendly status at the safe target boundary', () => {
    // India safe target is 2000; at or below is eco-friendly
    const indicator = getCarbonIndicator(2000);
    expect(indicator.tone).toBe('emerald');
  });

  it('returns high status for high emissions', () => {
    const indicator = getCarbonIndicator(5000);
    expect(indicator.label).toBe('High Carbon Cost');
    expect(indicator.tone).toBe('rose');
  });
});

describe('buildCarbonEntryPayloads', () => {
  it('includes diet_type entry even with zero value', () => {
    const payloads = buildCarbonEntryPayloads(defaultValues, '2025-01-01T00:00:00Z');
    const dietEntry = payloads.find((p) => p.subcategory === 'diet_type');
    expect(dietEntry).toBeDefined();
  });

  it('filters out zero-value entries except diet', () => {
    const payloads = buildCarbonEntryPayloads(zeroValues, '2025-01-01T00:00:00Z');
    expect(payloads.length).toBe(1);
    expect(payloads[0].subcategory).toBe('diet_type');
  });

  it('stores diet name in unit field (not diet-index)', () => {
    const vegValues = { ...defaultValues, food_type: 'vegetarian' as const };
    const payloads = buildCarbonEntryPayloads(vegValues, '2025-01-01T00:00:00Z');
    const dietEntry = payloads.find(p => p.subcategory === 'diet_type');

    expect(dietEntry).toBeDefined();
    expect(dietEntry?.unit).toBe('vegetarian');
    expect(dietEntry?.unit).not.toBe('diet-index');
  });

  it('stores meals_per_day as the value for diet_type (not 1/1.5/2)', () => {
    const payloads = buildCarbonEntryPayloads(defaultValues, '2025-01-01T00:00:00Z');
    const dietEntry = payloads.find(p => p.subcategory === 'diet_type');

    expect(dietEntry).toBeDefined();
    expect(dietEntry?.value).toBe(3);
    expect(dietEntry?.value).not.toBe(1.5);
  });

  it('preserves the date in created_at field', () => {
    const payloads = buildCarbonEntryPayloads(defaultValues, '2025-06-15T10:00:00Z');
    expect(payloads.every(p => p.created_at === '2025-06-15T10:00:00Z')).toBe(true);
  });
});

describe('validateCalculatorInput', () => {
  it('returns no errors for valid input', () => {
    const errors = validateCalculatorInput(defaultValues);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('returns errors for meals_per_day exceeding 10', () => {
    const errors = validateCalculatorInput({ ...defaultValues, meals_per_day: 15 });
    expect(errors.meals_per_day).toBeDefined();
    expect(errors.meals_per_day).toContain('10');
  });

  it('returns errors for food_waste_pct exceeding 100', () => {
    const errors = validateCalculatorInput({ ...defaultValues, food_waste_pct: 150 });
    expect(errors.food_waste_pct).toBeDefined();
    expect(errors.food_waste_pct).toContain('100');
  });

  it('returns errors for bus_days exceeding 31', () => {
    const errors = validateCalculatorInput({ ...defaultValues, bus_days: 35 });
    expect(errors.bus_days).toBeDefined();
    expect(errors.bus_days).toContain('31');
  });
});

describe('toCalculatorValues', () => {
  it('maps snake_case form fields to camelCase domain values', () => {
    const domainValues = toCalculatorValues(defaultValues);
    expect(domainValues.carKmPerMonth).toBe(100);
    expect(domainValues.busDaysPerMonth).toBe(20);
    expect(domainValues.dietType).toBe('mixed');
    expect(domainValues.mealsPerDay).toBe(3);
  });

  it('defaults unknown diet type to mixed', () => {
    const values = { ...defaultValues, food_type: 'invalid' as CalculatorInputValues['food_type'] };
    const domainValues = toCalculatorValues(values);
    expect(domainValues.dietType).toBe('mixed');
  });

  it('sanitizes NaN values to 0', () => {
    const values = { ...defaultValues, car_km: NaN };
    const domainValues = toCalculatorValues(values);
    expect(domainValues.carKmPerMonth).toBe(0);
  });
});

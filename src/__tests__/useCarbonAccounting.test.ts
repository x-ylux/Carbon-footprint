import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCarbonAccounting, getCarbonIndicator, buildCarbonEntryPayloads } from '../hooks/useCarbonAccounting';
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

describe('useCarbonAccounting hook', () => {
  it('calculates all emission categories', () => {
    const { result } = renderHook(() => useCarbonAccounting(defaultValues, 0));

    expect(result.current.transport).toBeGreaterThan(0);
    expect(result.current.energy).toBeGreaterThan(0);
    expect(result.current.food).toBeGreaterThan(0);
    expect(result.current.shopping).toBeGreaterThan(0);
    expect(result.current.digital).toBeGreaterThan(0);
    expect(result.current.total).toBeGreaterThan(0);
  });

  it('includes cash total in overall total', () => {
    const { result: r1 } = renderHook(() => useCarbonAccounting(defaultValues, 0));
    const { result: r2 } = renderHook(() => useCarbonAccounting(defaultValues, 500));

    expect(r2.current.total).toBe(r1.current.total + 500);
  });

  it('handles zero values correctly', () => {
    const zeroValues: CalculatorInputValues = {
      ...defaultValues,
      car_km: 0,
      bus_days: 0,
      metro_km: 0,
      bike_km: 0,
      flight_count: 0,
      elec_units: 0,
      gas_liters: 0,
      water_buckets: 0,
      meals_per_day: 0,
      meat_kg: 0,
      online_orders: 0,
      clothing_items: 0,
      electronics_count: 0,
      food_waste_pct: 0,
      streaming_hours: 0,
      cloud_gb: 0,
      email_count: 0,
      call_hours: 0,
      social_hours: 0,
    };

    const { result } = renderHook(() => useCarbonAccounting(zeroValues, 0));
    expect(result.current.total).toBe(0);
  });

  it('calculates vegetarian diet as lower than non-vegetarian', () => {
    const vegValues: CalculatorInputValues = { ...defaultValues, food_type: 'vegetarian' as const, meals_per_day: 3 };
    const nonVegValues: CalculatorInputValues = { ...defaultValues, food_type: 'non-vegetarian' as const, meals_per_day: 3 };

    const { result: vegResult } = renderHook(() => useCarbonAccounting(vegValues, 0));
    const { result: nonVegResult } = renderHook(() => useCarbonAccounting(nonVegValues, 0));

    expect(nonVegResult.current.food).toBeGreaterThan(vegResult.current.food);
  });
});

describe('getCarbonIndicator', () => {
  it('returns eco-friendly status for low emissions', () => {
    const indicator = getCarbonIndicator(1200);
    expect(indicator.label).toBe('Low (Eco-Friendly)');
    expect(indicator.tone).toBe('emerald');
  });

  it('returns moderate status for medium emissions', () => {
    const indicator = getCarbonIndicator(2000);
    expect(indicator.label).toBe('Moderate');
    expect(indicator.tone).toBe('amber');
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
    const zeroValues: CalculatorInputValues = {
      ...defaultValues,
      car_km: 0,
      bus_days: 0,
      metro_km: 0,
      bike_km: 0,
      flight_count: 0,
      elec_units: 0,
      gas_liters: 0,
      water_buckets: 0,
      meals_per_day: 0,
      meat_kg: 0,
      online_orders: 0,
      clothing_items: 0,
      electronics_count: 0,
      food_waste_pct: 0,
      streaming_hours: 0,
      cloud_gb: 0,
      email_count: 0,
      call_hours: 0,
      social_hours: 0,
    };

    const payloads = buildCarbonEntryPayloads(zeroValues, '2025-01-01T00:00:00Z');
    expect(payloads.length).toBe(1);
    expect(payloads[0].subcategory).toBe('diet_type');
  });
});

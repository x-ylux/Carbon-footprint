import { useMemo } from 'react';
import {
  DEFAULT_REGION,
  DefaultRegionFactorProvider,
  getCarbonIndicator,
  getCarbonIndicatorForRegion,
  isDietType,
  REGION_FACTORS,
  RegionalCarbonReport,
  sanitizeNumericInput,
  validateEmissionInput,
  type CalculatorValues,
  type CarbonIndicator,
  type DietType,
  type EmissionBreakdown,
  type EmissionSourceResult,
  type RegionCode,
} from '../lib/co2Formulas';

export type CalculatorInputValues = {
  car_km: number; bus_days: number; metro_km: number; bike_km: number; flight_count: number;
  elec_units: number; gas_liters: number; water_buckets: number;
  food_type: 'vegetarian' | 'non-vegetarian' | 'mixed';
  meals_per_day: number; meat_kg: number;
  online_orders: number; clothing_items: number; electronics_count: number; food_waste_pct: number;
  streaming_hours: number; cloud_gb: number; email_count: number; call_hours: number; social_hours: number;
};

export type EmissionSummary = EmissionBreakdown;

export type CarbonEntryPayload = {
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  created_at: string;
};

const ALWAYS_EMIT_SUBCATEGORIES = new Set(['diet_type']);

export function toCalculatorValues(values: CalculatorInputValues): CalculatorValues {
  const dietType: DietType = isDietType(values.food_type) ? values.food_type : 'mixed';
  return {
    carKmPerMonth: sanitizeNumericInput(values.car_km),
    busDaysPerMonth: sanitizeNumericInput(values.bus_days),
    metroKmPerMonth: sanitizeNumericInput(values.metro_km),
    flightCountPerYear: sanitizeNumericInput(values.flight_count),
    electricityUnitsPerMonth: sanitizeNumericInput(values.elec_units),
    gasLitersPerMonth: sanitizeNumericInput(values.gas_liters),
    waterBucketsPerDay: sanitizeNumericInput(values.water_buckets),
    dietType,
    mealsPerDay: sanitizeNumericInput(values.meals_per_day),
    meatKgPerMonth: sanitizeNumericInput(values.meat_kg),
    onlineOrdersPerMonth: sanitizeNumericInput(values.online_orders),
    clothingItemsPerMonth: sanitizeNumericInput(values.clothing_items),
    electronicsCountPerYear: sanitizeNumericInput(values.electronics_count),
    foodWastePercent: sanitizeNumericInput(values.food_waste_pct),
    streamingHoursPerMonth: sanitizeNumericInput(values.streaming_hours),
    cloudStorageGb: sanitizeNumericInput(values.cloud_gb),
    emailsPerDay: sanitizeNumericInput(values.email_count),
    videoCallHoursPerMonth: sanitizeNumericInput(values.call_hours),
    socialMediaHoursPerDay: sanitizeNumericInput(values.social_hours),
  };
}

export interface UseCarbonAccountingResult {
  summary: EmissionSummary;
  breakdown: EmissionSourceResult[];
  indicator: CarbonIndicator;
}

/**
 * Region-aware carbon accounting hook. Computes category totals, per-source
 * detail, and a carbon indicator that adapts thresholds to the user's region.
 */
export const useCarbonAccounting = (
  values: CalculatorInputValues,
  cashTotal: number,
  region: RegionCode = DEFAULT_REGION,
): UseCarbonAccountingResult => {
  return useMemo<UseCarbonAccountingResult>(() => {
    const domainValues = toCalculatorValues(values);
    const report = new RegionalCarbonReport(new DefaultRegionFactorProvider(), region);
    const summary = report.computeBreakdown(domainValues, sanitizeNumericInput(cashTotal));
    const breakdown = report.computeSourceResults(domainValues);
    const indicator = getCarbonIndicatorForRegion(summary.total, region);
    return { summary, breakdown, indicator };
  }, [values, cashTotal, region]);
};

export { getCarbonIndicator, getCarbonIndicatorForRegion };
export { validateEmissionInput, sanitizeNumericInput };
export { REGION_FACTORS };

/**
 * Build carbon_entries insert payloads from form values.
 *
 * Contract: the `diet_type` entry stores `value = meals_per_day` and
 * `unit = <diet name>` ('vegetarian' | 'non-vegetarian' | 'mixed'). This
 * matches the server-side `calculate_carbon_emission` function, which
 * branches on `unit` (not `value`) for diet_type. The previous version
 * incorrectly stored `value` as 1/1.5/2 with `unit='diet-index'`, which
 * caused the server to miscompute diet emissions.
 */
export const buildCarbonEntryPayloads = (
  values: CalculatorInputValues,
  baseDate: string,
): CarbonEntryPayload[] => {
  const dietType: DietType = isDietType(values.food_type) ? values.food_type : 'mixed';

  const payloads: CarbonEntryPayload[] = [
    { category: 'transportation', subcategory: 'car', value: values.car_km, unit: 'km/month', created_at: baseDate },
    { category: 'transportation', subcategory: 'bus', value: values.bus_days, unit: 'days/month', created_at: baseDate },
    { category: 'transportation', subcategory: 'metro', value: values.metro_km, unit: 'km/month', created_at: baseDate },
    { category: 'transportation', subcategory: 'bike', value: values.bike_km, unit: 'km/month', created_at: baseDate },
    { category: 'transportation', subcategory: 'flight', value: values.flight_count, unit: 'flights/year', created_at: baseDate },
    { category: 'energy', subcategory: 'electricity', value: values.elec_units, unit: 'units/month', created_at: baseDate },
    { category: 'energy', subcategory: 'gas', value: values.gas_liters, unit: 'liters/month', created_at: baseDate },
    { category: 'energy', subcategory: 'water', value: values.water_buckets, unit: 'buckets/day', created_at: baseDate },
    { category: 'food', subcategory: 'diet_type', value: values.meals_per_day, unit: dietType, created_at: baseDate },
    { category: 'food', subcategory: 'meat', value: values.meat_kg, unit: 'kg/month', created_at: baseDate },
    { category: 'shopping', subcategory: 'online', value: values.online_orders, unit: 'orders/month', created_at: baseDate },
    { category: 'shopping', subcategory: 'clothing', value: values.clothing_items, unit: 'items/month', created_at: baseDate },
    { category: 'shopping', subcategory: 'electronics', value: values.electronics_count, unit: 'devices/year', created_at: baseDate },
    { category: 'shopping', subcategory: 'waste', value: values.food_waste_pct, unit: 'waste_pct', created_at: baseDate },
    { category: 'digital', subcategory: 'streaming', value: values.streaming_hours, unit: 'hours/month', created_at: baseDate },
    { category: 'digital', subcategory: 'cloud', value: values.cloud_gb, unit: 'GB', created_at: baseDate },
    { category: 'digital', subcategory: 'email', value: values.email_count, unit: 'emails/day', created_at: baseDate },
    { category: 'digital', subcategory: 'calls', value: values.call_hours, unit: 'hours/month', created_at: baseDate },
    { category: 'digital', subcategory: 'social', value: values.social_hours, unit: 'hours/day', created_at: baseDate },
  ];

  return payloads.filter((row) => row.value > 0 || ALWAYS_EMIT_SUBCATEGORIES.has(row.subcategory));
};

/**
 * Validate the full calculator input set. Returns an object of field → error
 * message for any invalid fields. Empty object means all valid.
 */
export const validateCalculatorInput = (
  values: CalculatorInputValues,
): Partial<Record<keyof CalculatorInputValues, string>> => {
  const errors: Partial<Record<keyof CalculatorInputValues, string>> = {};

  const numericFields: (keyof CalculatorInputValues)[] = [
    'car_km', 'bus_days', 'metro_km', 'bike_km', 'flight_count',
    'elec_units', 'gas_liters', 'water_buckets',
    'meals_per_day', 'meat_kg',
    'online_orders', 'clothing_items', 'electronics_count', 'food_waste_pct',
    'streaming_hours', 'cloud_gb', 'email_count', 'call_hours', 'social_hours',
  ];

  for (const field of numericFields) {
    const result = validateEmissionInput(values[field] as number);
    if (!result.isValid) {
      errors[field] = result.error;
    }
  }

  if (values.meals_per_day > 10) {
    errors.meals_per_day = 'Meals per day cannot exceed 10';
  }
  if (values.food_waste_pct > 100) {
    errors.food_waste_pct = 'Food waste percentage cannot exceed 100';
  }
  if (values.bus_days > 31) {
    errors.bus_days = 'Bus days per month cannot exceed 31';
  }

  return errors;
};

import type { DietType, RegionCode } from '../../lib/co2Formulas';

export interface FieldConfig {
  name: string;
  label: string;
  unit: string;
  helpText: string;
  step?: string;
  max?: number;
}

export interface TabConfig {
  id: TabId;
  label: string;
  icon: 'Car' | 'Zap' | 'Apple' | 'ShoppingBag' | 'Monitor' | 'Wallet';
  fields: FieldConfig[];
}

export type TabId = 'transport' | 'energy' | 'food' | 'shopping' | 'digital' | 'cash';

export const REGION_OPTIONS: Array<{ code: RegionCode; label: string; flag: string }> = [
  { code: 'IN', label: 'India', flag: 'IN' },
  { code: 'US', label: 'United States', flag: 'US' },
  { code: 'EU', label: 'European Union', flag: 'EU' },
  { code: 'CN', label: 'China', flag: 'CN' },
  { code: 'GLOBAL', label: 'Global Average', flag: 'GLOBAL' },
];

export const TAB_CONFIG: TabConfig[] = [
  {
    id: 'transport',
    label: 'Transport',
    icon: 'Car',
    fields: [
      { name: 'car_km', label: 'Car travel', unit: 'km/month', helpText: 'Distance driven by car per month', step: 'any' },
      { name: 'bus_days', label: 'Bus travel', unit: 'days/month', helpText: 'Days per month you travel by bus', max: 31 },
      { name: 'metro_km', label: 'Metro travel', unit: 'km/month', helpText: 'Distance traveled by metro/train per month', step: 'any' },
      { name: 'bike_km', label: 'Bicycle travel', unit: 'km/month', helpText: 'Cycling is zero-emission — logged for fitness tracking', step: 'any' },
      { name: 'flight_count', label: 'Flights taken', unit: 'count/year', helpText: 'Number of flights (short or long haul) per year' },
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: 'Zap',
    fields: [
      { name: 'elec_units', label: 'Electricity', unit: 'units (kWh)/month', helpText: 'Monthly electricity consumption in kWh from your bill', step: 'any' },
      { name: 'gas_liters', label: 'LPG/CNG Gas', unit: 'liters/month', helpText: 'Cooking gas consumed per month', step: 'any' },
      { name: 'water_buckets', label: 'Domestic Water', unit: 'buckets/day', helpText: 'Average water buckets used daily for household needs' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icon: 'Apple',
    fields: [],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: 'ShoppingBag',
    fields: [
      { name: 'online_orders', label: 'Online orders', unit: 'count/month', helpText: 'Number of online deliveries received per month' },
      { name: 'clothing_items', label: 'New clothing', unit: 'items/month', helpText: 'New garments purchased each month' },
      { name: 'electronics_count', label: 'Electronic devices', unit: 'count/year', helpText: 'New phones, laptops, or gadgets bought per year' },
      { name: 'food_waste_pct', label: 'Food waste', unit: '% of meals', helpText: 'Estimated percentage of food wasted per month', max: 100 },
    ],
  },
  {
    id: 'digital',
    label: 'Digital',
    icon: 'Monitor',
    fields: [
      { name: 'streaming_hours', label: 'Streaming', unit: 'hours/month', helpText: 'Time spent on video streaming (Netflix, YouTube, etc.)', step: 'any' },
      { name: 'cloud_gb', label: 'Cloud storage', unit: 'GB', helpText: 'Total cloud storage used across all services', step: 'any' },
      { name: 'email_count', label: 'Emails sent', unit: 'per day', helpText: 'Average emails sent per day (including forwards)' },
      { name: 'call_hours', label: 'Video calls', unit: 'hours/month', helpText: 'Time in video meetings (Zoom, Meet, Teams)', step: 'any' },
      { name: 'social_hours', label: 'Social media', unit: 'hours/day', helpText: 'Daily time spent scrolling social feeds', step: 'any' },
    ],
  },
  {
    id: 'cash',
    label: 'Cash',
    icon: 'Wallet',
    fields: [],
  },
];

export const DIET_OPTIONS: Array<{ value: DietType; label: string; factor: number }> = [
  { value: 'vegetarian', label: 'Vegetarian', factor: 0.5 },
  { value: 'mixed', label: 'Mixed Diet', factor: 0.85 },
  { value: 'non-vegetarian', label: 'Non-Vegetarian', factor: 1.2 },
];

export const CASH_CATEGORIES = Object.keys(
  {
    food: 0.005,
    transport: 0.008,
    shopping: 0.006,
    utilities: 0.01,
    entertainment: 0.004,
    healthcare: 0.003,
    other: 0.005,
  } as Record<string, number>,
);

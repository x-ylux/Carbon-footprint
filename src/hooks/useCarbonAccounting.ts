import { useMemo } from 'react';
import {
  digitalCO2,
  energyCO2,
  foodCO2,
  INDIA_AVERAGE_KG,
  shoppingCO2,
  transportCO2,
} from '../lib/co2Formulas';

export type CalculatorInputValues = {
  car_km: number;
  bus_days: number;
  metro_km: number;
  bike_km: number;
  flight_count: number;
  elec_units: number;
  gas_liters: number;
  water_buckets: number;
  food_type: 'vegetarian' | 'non-vegetarian' | 'mixed';
  meals_per_day: number;
  meat_kg: number;
  online_orders: number;
  clothing_items: number;
  electronics_count: number;
  food_waste_pct: number;
  streaming_hours: number;
  cloud_gb: number;
  email_count: number;
  call_hours: number;
  social_hours: number;
};

export type EmissionSummary = {
  transport: number;
  energy: number;
  food: number;
  shopping: number;
  digital: number;
  cash: number;
  total: number;
};

export const useCarbonAccounting = (values: CalculatorFormInput, cashTotal: number) => {
  return useMemo<EmissionSummary>(() => {
    const transport =
      transportCO2.car(values.car_km) +
      transportCO2.bus(values.bus_days) +
      transportCO2.metro(values.metro_km) +
      transportCO2.bike(values.bike_km) +
      transportCO2.flight(values.flight_count);

    const energy =
      energyCO2.electricity(values.elec_units) +
      energyCO2.gas(values.gas_liters) +
      energyCO2.water(values.water_buckets);

    const food =
      foodCO2.mealsPerYear(values.meals_per_day, values.food_type) +
      foodCO2.meat(values.meat_kg);

    const shopping =
      shoppingCO2.online(values.online_orders) +
      shoppingCO2.clothing(values.clothing_items) +
      shoppingCO2.electronics(values.electronics_count) +
      shoppingCO2.waste(values.food_waste_pct);

    const digital =
      digitalCO2.streaming(values.streaming_hours) +
      digitalCO2.cloud(values.cloud_gb) +
      digitalCO2.email(values.email_count) +
      digitalCO2.calls(values.call_hours) +
      digitalCO2.social(values.social_hours);

    const cash = cashTotal;
    const total = Math.round(transport + energy + food + shopping + digital + cash);

    return {
      transport: Math.round(transport),
      energy: Math.round(energy),
      food: Math.round(food),
      shopping: Math.round(shopping),
      digital: Math.round(digital),
      cash: Math.round(cash),
      total,
    };
  }, [values, cashTotal]);
};

export const getCarbonIndicator = (total: number) => {
  if (total < INDIA_AVERAGE_KG) {
    return {
      label: 'Low (Eco-Friendly)',
      description: 'Well below India average. Maintain progress with sustainable habits.',
      tone: 'emerald',
    };
  }

  if (total <= 3000) {
    return {
      label: 'Moderate',
      description: 'Around the India average. Small behavior changes can lower your footprint further.',
      tone: 'amber',
    };
  }

  return {
    label: 'High Carbon Cost',
    description: 'Above the safe limit. Prioritize low-carbon transport and energy savings.',
    tone: 'rose',
  };
};

export const buildCarbonEntryPayloads = (values: CalculatorFormInput, baseDate: string) => {
  const payloads = [
    {
      category: 'transportation',
      subcategory: 'car',
      value: values.car_km,
      unit: 'km/month',
      created_at: baseDate,
    },
    {
      category: 'transportation',
      subcategory: 'bus',
      value: values.bus_days,
      unit: 'days/month',
      created_at: baseDate,
    },
    {
      category: 'transportation',
      subcategory: 'metro',
      value: values.metro_km,
      unit: 'km/month',
      created_at: baseDate,
    },
    {
      category: 'transportation',
      subcategory: 'bike',
      value: values.bike_km,
      unit: 'km/month',
      created_at: baseDate,
    },
    {
      category: 'transportation',
      subcategory: 'flight',
      value: values.flight_count,
      unit: 'flights/year',
      created_at: baseDate,
    },
    {
      category: 'energy',
      subcategory: 'electricity',
      value: values.elec_units,
      unit: 'kWh/month',
      created_at: baseDate,
    },
    {
      category: 'energy',
      subcategory: 'gas',
      value: values.gas_liters,
      unit: 'liters/month',
      created_at: baseDate,
    },
    {
      category: 'energy',
      subcategory: 'water',
      value: values.water_buckets,
      unit: 'buckets/day',
      created_at: baseDate,
    },
    {
      category: 'food',
      subcategory: 'diet_type',
      value: values.food_type === 'vegetarian' ? 1 : values.food_type === 'non-vegetarian' ? 2 : 1.5,
      unit: 'diet-index',
      created_at: baseDate,
    },
    {
      category: 'food',
      subcategory: 'meat',
      value: values.meat_kg,
      unit: 'kg/month',
      created_at: baseDate,
    },
    {
      category: 'shopping',
      subcategory: 'online',
      value: values.online_orders,
      unit: 'orders/month',
      created_at: baseDate,
    },
    {
      category: 'shopping',
      subcategory: 'clothing',
      value: values.clothing_items,
      unit: 'items/month',
      created_at: baseDate,
    },
    {
      category: 'shopping',
      subcategory: 'electronics',
      value: values.electronics_count,
      unit: 'devices/year',
      created_at: baseDate,
    },
    {
      category: 'shopping',
      subcategory: 'waste',
      value: values.food_waste_pct,
      unit: 'waste_pct',
      created_at: baseDate,
    },
    {
      category: 'digital',
      subcategory: 'streaming',
      value: values.streaming_hours,
      unit: 'hours/month',
      created_at: baseDate,
    },
    {
      category: 'digital',
      subcategory: 'cloud',
      value: values.cloud_gb,
      unit: 'GB',
      created_at: baseDate,
    },
    {
      category: 'digital',
      subcategory: 'email',
      value: values.email_count,
      unit: 'emails/day',
      created_at: baseDate,
    },
    {
      category: 'digital',
      subcategory: 'calls',
      value: values.call_hours,
      unit: 'hours/month',
      created_at: baseDate,
    },
    {
      category: 'digital',
      subcategory: 'social',
      value: values.social_hours,
      unit: 'hours/day',
      created_at: baseDate,
    },
  ];

  return payloads.filter((row) => row.value > 0 || row.subcategory === 'diet_type');
};

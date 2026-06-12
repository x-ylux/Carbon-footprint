/** CO2 emission formulas — all results in kg CO₂e per year unless noted */

export const INDIA_AVERAGE_TONNES = 1.6;
export const INDIA_AVERAGE_KG = INDIA_AVERAGE_TONNES * 1000; // 1600 kg
export const CLIMATE_SAFE_TARGET_KG = 2000;

export const transportCO2 = {
  car: (kmPerMonth: number) => kmPerMonth * 0.12 * 12,
  bus: (daysPerMonth: number) => daysPerMonth * 2.5 * 12,
  metro: (kmPerMonth: number) => kmPerMonth * 0.05 * 12,
  bike: () => 0,
  flight: (countPerYear: number) => countPerYear * 200,
};

export const energyCO2 = {
  electricity: (unitsPerMonth: number) => unitsPerMonth * 0.8 * 12,
  gas: (litersPerMonth: number) => litersPerMonth * 2.0 * 12,
  water: (bucketsPerDay: number) => bucketsPerDay * 0.05 * 365,
};

export const foodCO2 = {
  mealsPerYear: (mealsPerDay: number, foodType: 'vegetarian' | 'non-vegetarian' | 'mixed') => {
    const factor =
      foodType === 'vegetarian' ? 0.5 : foodType === 'non-vegetarian' ? 1.2 : 0.85;
    return mealsPerDay * factor * 365;
  },
  meat: (kgPerMonth: number) => kgPerMonth * 12 * 12,
};

export const shoppingCO2 = {
  online: (ordersPerMonth: number) => ordersPerMonth * 5 * 12,
  clothing: (itemsPerMonth: number) => itemsPerMonth * 10 * 12,
  electronics: (countPerYear: number) => countPerYear * 80,
  waste: (wastePct: number) => wastePct * 2 * 12,
};

export const digitalCO2 = {
  streaming: (hoursPerMonth: number) => hoursPerMonth * 0.05 * 12,
  cloud: (gb: number) => gb * 0.2,
  email: (emailsPerDay: number) => emailsPerDay * 0.004 * 365,
  calls: (hoursPerMonth: number) => hoursPerMonth * 0.1 * 12,
  social: (hoursPerDay: number) => hoursPerDay * 0.02 * 365,
};

/** kg CO₂ per unit of currency (INR) by category */
export const cashCategoryFactors: Record<string, number> = {
  food: 0.005,
  transport: 0.008,
  shopping: 0.006,
  utilities: 0.01,
  entertainment: 0.004,
  healthcare: 0.003,
  other: 0.005,
};

export const cashTransactionCO2 = (category: string, amount: number) =>
  amount * (cashCategoryFactors[category] ?? cashCategoryFactors.other);

export const calculateCarbonEmission = (params: {
  category: string;
  subcategory: string;
  value: number;
  unit: string;
}) => {
  const { category, subcategory, value, unit } = params;

  if (category === 'transportation' && subcategory === 'car') return value * 0.12 * 12;
  if (category === 'transportation' && subcategory === 'bus') return value * 2.5 * 12;
  if (category === 'transportation' && subcategory === 'metro') return value * 0.05 * 12;
  if (category === 'transportation' && subcategory === 'bike') return 0;
  if (category === 'transportation' && subcategory === 'flight') return value * 200;

  if (category === 'energy' && subcategory === 'electricity') return value * 0.8 * 12;
  if (category === 'energy' && subcategory === 'gas') return value * 2.0 * 12;
  if (category === 'energy' && subcategory === 'water') return value * 0.05 * 365;

  if (category === 'food' && subcategory === 'diet_type') {
    if (unit === 'vegetarian') return value * 0.5 * 365;
    if (unit === 'non-vegetarian') return value * 1.2 * 365;
    return value * 0.85 * 365;
  }
  if (category === 'food' && subcategory === 'meat') return value * 12 * 12;

  if (category === 'shopping' && subcategory === 'online') return value * 5 * 12;
  if (category === 'shopping' && subcategory === 'clothing') return value * 10 * 12;
  if (category === 'shopping' && subcategory === 'electronics') return value * 80;
  if (category === 'shopping' && subcategory === 'waste') return value * 2 * 12;

  if (category === 'digital' && subcategory === 'streaming') return value * 0.05 * 12;
  if (category === 'digital' && subcategory === 'cloud') return value * 0.2;
  if (category === 'digital' && subcategory === 'email') return value * 0.004 * 365;
  if (category === 'digital' && subcategory === 'calls') return value * 0.1 * 12;
  if (category === 'digital' && subcategory === 'social') return value * 0.02 * 365;

  return 0;
};

export const TIPS = [
  {
    title: 'Switch to LED bulbs',
    desc: 'Replace incandescent bulbs with LEDs to cut lighting energy use by up to 80%.',
    savings: '50 kg/yr',
  },
  {
    title: 'Take public transit 2× per week',
    desc: 'Replace car trips with bus or metro to dramatically lower transport emissions.',
    savings: '400 kg/yr',
  },
  {
    title: 'Eat vegetarian 3 days a week',
    desc: 'Reducing meat consumption is one of the fastest ways to shrink your food footprint.',
    savings: '300 kg/yr',
  },
  {
    title: 'Unplug idle electronics',
    desc: 'Phantom power from chargers and standby devices adds up — use power strips.',
    savings: '80 kg/yr',
  },
  {
    title: 'Buy local & reduce packaging',
    desc: 'Fewer online orders and local produce mean less shipping and packaging waste.',
    savings: '120 kg/yr',
  },
];

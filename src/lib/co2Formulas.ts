/** CO2 emission calculations — results in kg CO2e per year unless noted */

export const INDIA_AVERAGE_TONNES = 1.6;
export const INDIA_AVERAGE_KG = INDIA_AVERAGE_TONNES * 1000; // 1600 kg
export const CLIMATE_SAFE_TARGET_KG = 2000;

export type DietType = 'vegetarian' | 'non-vegetarian' | 'mixed';
export type EmissionCategory = 'transportation' | 'energy' | 'food' | 'shopping' | 'digital';

/**
 * Base class for all emission sources. Encapsulates a single calculation
 * formula and exposes metadata (category, subcategory, unit) so callers
 * can build entries without re-deriving the formula per call site.
 */
export abstract class EmissionSource {
  abstract readonly category: EmissionCategory;
  abstract readonly subcategory: string;
  abstract readonly unit: string;

  /** Compute annual kg CO2e for the given input value. */
  abstract calculate(value: number): number;
}

/**
 * Convenience mixin: most sources share the shape `value * factor * period`.
 * Centralizing the math avoids drift between the formula table and the
 * giant switch in the old `calculateCarbonEmission` helper.
 */
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365;

abstract class LinearEmissionSource extends EmissionSource {
  protected readonly factor: number;
  protected readonly frequencyPerYear: number;

  constructor(factor: number, frequencyPerYear: number) {
    super();
    this.factor = factor;
    this.frequencyPerYear = frequencyPerYear;
  }

  calculate(value: number): number {
    return value * this.factor * this.frequencyPerYear;
  }
}

// ---------------------------------------------------------------------------
// Transportation
// ---------------------------------------------------------------------------

export class CarEmission extends LinearEmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'car';
  readonly unit = 'km/month';
  constructor() {
    super(0.12, MONTHS_PER_YEAR);
  }
}

export class BusEmission extends LinearEmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'bus';
  readonly unit = 'days/month';
  constructor() {
    super(2.5, MONTHS_PER_YEAR);
  }
}

export class MetroEmission extends LinearEmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'metro';
  readonly unit = 'km/month';
  constructor() {
    super(0.05, MONTHS_PER_YEAR);
  }
}

export class BicycleEmission extends EmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'bike';
  readonly unit = 'km/month';
  calculate(): number {
    return 0;
  }
}

export class FlightEmission extends LinearEmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'flight';
  readonly unit = 'flights/year';
  constructor() {
    super(200, 1);
  }
}

// ---------------------------------------------------------------------------
// Energy
// ---------------------------------------------------------------------------

export class ElectricityEmission extends LinearEmissionSource {
  readonly category = 'energy' as const;
  readonly subcategory = 'electricity';
  readonly unit = 'units/month';
  constructor() {
    super(0.8, MONTHS_PER_YEAR);
  }
}

export class GasEmission extends LinearEmissionSource {
  readonly category = 'energy' as const;
  readonly subcategory = 'gas';
  readonly unit = 'liters/month';
  constructor() {
    super(2.0, MONTHS_PER_YEAR);
  }
}

export class WaterEmission extends LinearEmissionSource {
  readonly category = 'energy' as const;
  readonly subcategory = 'water';
  readonly unit = 'buckets/day';
  constructor() {
    super(0.05, DAYS_PER_YEAR);
  }
}

// ---------------------------------------------------------------------------
// Food
// ---------------------------------------------------------------------------

const DIET_FACTORS: Record<DietType, number> = {
  vegetarian: 0.5,
  'non-vegetarian': 1.2,
  mixed: 0.85,
};

export class DietEmission extends EmissionSource {
  readonly category = 'food' as const;
  readonly subcategory = 'diet_type';
  private readonly dietType: DietType;

  constructor(dietType: DietType) {
    super();
    this.dietType = dietType;
  }

  get unit(): DietType {
    return this.dietType;
  }

  calculate(mealsPerDay: number): number {
    return mealsPerDay * DIET_FACTORS[this.dietType] * DAYS_PER_YEAR;
  }
}

export class MeatEmission extends LinearEmissionSource {
  readonly category = 'food' as const;
  readonly subcategory = 'meat';
  readonly unit = 'kg/month';
  constructor() {
    super(12, MONTHS_PER_YEAR);
  }
}

// ---------------------------------------------------------------------------
// Shopping & Waste
// ---------------------------------------------------------------------------

export class OnlineOrdersEmission extends LinearEmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'online';
  readonly unit = 'orders/month';
  constructor() {
    super(5, MONTHS_PER_YEAR);
  }
}

export class ClothingEmission extends LinearEmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'clothing';
  readonly unit = 'items/month';
  constructor() {
    super(10, MONTHS_PER_YEAR);
  }
}

export class ElectronicsEmission extends EmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'electronics';
  readonly unit = 'devices/year';
  calculate(value: number): number {
    return value * 80;
  }
}

export class FoodWasteEmission extends LinearEmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'waste';
  readonly unit = 'waste_pct';
  constructor() {
    super(2, MONTHS_PER_YEAR);
  }
}

// ---------------------------------------------------------------------------
// Digital
// ---------------------------------------------------------------------------

export class StreamingEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'streaming';
  readonly unit = 'hours/month';
  constructor() {
    super(0.05, MONTHS_PER_YEAR);
  }
}

export class CloudStorageEmission extends EmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'cloud';
  readonly unit = 'GB';
  calculate(value: number): number {
    return value * 0.2;
  }
}

export class EmailEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'email';
  readonly unit = 'emails/day';
  constructor() {
    super(0.004, DAYS_PER_YEAR);
  }
}

export class VideoCallsEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'calls';
  readonly unit = 'hours/month';
  constructor() {
    super(0.1, MONTHS_PER_YEAR);
  }
}

export class SocialMediaEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'social';
  readonly unit = 'hours/day';
  constructor() {
    super(0.02, DAYS_PER_YEAR);
  }
}

// ---------------------------------------------------------------------------
// Registry: lookup table by (category, subcategory)
// ---------------------------------------------------------------------------

type SourceFactory = (unit?: string) => EmissionSource;

const SOURCE_FACTORIES: Record<EmissionCategory, Record<string, SourceFactory>> = {
  transportation: {
    car: () => new CarEmission(),
    bus: () => new BusEmission(),
    metro: () => new MetroEmission(),
    bike: () => new BicycleEmission(),
    flight: () => new FlightEmission(),
  },
  energy: {
    electricity: () => new ElectricityEmission(),
    gas: () => new GasEmission(),
    water: () => new WaterEmission(),
  },
  food: {
    diet_type: (unit) => new DietEmission((unit as DietType) ?? 'mixed'),
    meat: () => new MeatEmission(),
  },
  shopping: {
    online: () => new OnlineOrdersEmission(),
    clothing: () => new ClothingEmission(),
    electronics: () => new ElectronicsEmission(),
    waste: () => new FoodWasteEmission(),
  },
  digital: {
    streaming: () => new StreamingEmission(),
    cloud: () => new CloudStorageEmission(),
    email: () => new EmailEmission(),
    calls: () => new VideoCallsEmission(),
    social: () => new SocialMediaEmission(),
  },
};

/**
 * Resolve an EmissionSource instance from a stored entry's (category, subcategory, unit).
 * Returns null for unknown combinations, so callers can skip instead of emitting zero.
 */
export function resolveEmissionSource(
  category: string,
  subcategory: string,
  unit?: string,
): EmissionSource | null {
  const factory = SOURCE_FACTORIES[category as EmissionCategory]?.[subcategory];
  return factory ? factory(unit) : null;
}

/**
 * Calculate the CO2 emission for a stored carbon entry. Replaces the previous
 * 40-line switch statement with a single registry lookup.
 */
export function calculateCarbonEmission(params: {
  category: string;
  subcategory: string;
  value: number;
  unit: string;
}): number {
  const source = resolveEmissionSource(params.category, params.subcategory, params.unit);
  if (!source) return 0;
  // DietEmission stores the diet type in `unit`; the meals-per-day value is the input.
  return source.calculate(params.value);
}

// ---------------------------------------------------------------------------
// Cash transactions
// ---------------------------------------------------------------------------

/** kg CO2 per unit of currency (INR) by spending category */
export const cashCategoryFactors: Record<string, number> = {
  food: 0.005,
  transport: 0.008,
  shopping: 0.006,
  utilities: 0.01,
  entertainment: 0.004,
  healthcare: 0.003,
  other: 0.005,
};

export const CASH_DEFAULT_FACTOR = 0.005;

export function cashTransactionCO2(category: string, amount: number): number {
  const factor = cashCategoryFactors[category] ?? CASH_DEFAULT_FACTOR;
  return amount * factor;
}

// ---------------------------------------------------------------------------
// Domain model: bundles a set of emission sources for one calculator run
// ---------------------------------------------------------------------------

export interface EmissionBreakdown {
  transport: number;
  energy: number;
  food: number;
  shopping: number;
  digital: number;
  cash: number;
  total: number;
}

export interface CalculatorValues {
  carKmPerMonth: number;
  busDaysPerMonth: number;
  metroKmPerMonth: number;
  flightCountPerYear: number;
  electricityUnitsPerMonth: number;
  gasLitersPerMonth: number;
  waterBucketsPerDay: number;
  dietType: DietType;
  mealsPerDay: number;
  meatKgPerMonth: number;
  onlineOrdersPerMonth: number;
  clothingItemsPerMonth: number;
  electronicsCountPerYear: number;
  foodWastePercent: number;
  streamingHoursPerMonth: number;
  cloudStorageGb: number;
  emailsPerDay: number;
  videoCallHoursPerMonth: number;
  socialMediaHoursPerDay: number;
}

/**
 * Aggregates a set of emission sources for a single calculation. Each field
 * owns its own EmissionSource instance, so the breakdown is testable in
 * isolation and the Calculator page no longer needs to reach into formula
 * internals.
 */
export class CarbonFootprintReport {
  readonly sources: EmissionSource[];

  constructor(sources: EmissionSource[]) {
    this.sources = sources;
  }

  static fromCalculatorValues(values: CalculatorValues): CarbonFootprintReport {
    const sources: EmissionSource[] = [
      new CarEmission(),
      new BusEmission(),
      new MetroEmission(),
      new FlightEmission(),
      new ElectricityEmission(),
      new GasEmission(),
      new WaterEmission(),
      new DietEmission(values.dietType),
      new MeatEmission(),
      new OnlineOrdersEmission(),
      new ClothingEmission(),
      new ElectronicsEmission(),
      new FoodWasteEmission(),
      new StreamingEmission(),
      new CloudStorageEmission(),
      new EmailEmission(),
      new VideoCallsEmission(),
      new SocialMediaEmission(),
    ];
    return new CarbonFootprintReport(sources);
  }

  computeBreakdown(values: CalculatorValues, cashTotal: number): EmissionBreakdown {
    const transport =
      new CarEmission().calculate(values.carKmPerMonth) +
      new BusEmission().calculate(values.busDaysPerMonth) +
      new MetroEmission().calculate(values.metroKmPerMonth) +
      new FlightEmission().calculate(values.flightCountPerYear);

    const energy =
      new ElectricityEmission().calculate(values.electricityUnitsPerMonth) +
      new GasEmission().calculate(values.gasLitersPerMonth) +
      new WaterEmission().calculate(values.waterBucketsPerDay);

    const food =
      new DietEmission(values.dietType).calculate(values.mealsPerDay) +
      new MeatEmission().calculate(values.meatKgPerMonth);

    const shopping =
      new OnlineOrdersEmission().calculate(values.onlineOrdersPerMonth) +
      new ClothingEmission().calculate(values.clothingItemsPerMonth) +
      new ElectronicsEmission().calculate(values.electronicsCountPerYear) +
      new FoodWasteEmission().calculate(values.foodWastePercent);

    const digital =
      new StreamingEmission().calculate(values.streamingHoursPerMonth) +
      new CloudStorageEmission().calculate(values.cloudStorageGb) +
      new EmailEmission().calculate(values.emailsPerDay) +
      new VideoCallsEmission().calculate(values.videoCallHoursPerMonth) +
      new SocialMediaEmission().calculate(values.socialMediaHoursPerDay);

    const total = Math.round(transport + energy + food + shopping + digital + cashTotal);

    return {
      transport: Math.round(transport),
      energy: Math.round(energy),
      food: Math.round(food),
      shopping: Math.round(shopping),
      digital: Math.round(digital),
      cash: Math.round(cashTotal),
      total,
    };
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible functional API (thin wrappers over the OOP classes)
// ---------------------------------------------------------------------------

const singleton = <T>(ctor: () => T) => {
  let instance: T | undefined;
  return () => (instance ??= ctor());
};

const carSource = singleton(() => new CarEmission());
const busSource = singleton(() => new BusEmission());
const metroSource = singleton(() => new MetroEmission());
const flightSource = singleton(() => new FlightEmission());
const electricitySource = singleton(() => new ElectricityEmission());
const gasSource = singleton(() => new GasEmission());
const waterSource = singleton(() => new WaterEmission());
const meatSource = singleton(() => new MeatEmission());
const onlineOrdersSource = singleton(() => new OnlineOrdersEmission());
const clothingSource = singleton(() => new ClothingEmission());
const electronicsSource = singleton(() => new ElectronicsEmission());
const foodWasteSource = singleton(() => new FoodWasteEmission());
const streamingSource = singleton(() => new StreamingEmission());
const cloudStorageSource = singleton(() => new CloudStorageEmission());
const emailSource = singleton(() => new EmailEmission());
const videoCallsSource = singleton(() => new VideoCallsEmission());
const socialMediaSource = singleton(() => new SocialMediaEmission());

/** Functional emission calculators — delegates to the OOP classes above. */
export const transportCO2 = {
  car: (kmPerMonth: number) => carSource().calculate(kmPerMonth),
  bus: (daysPerMonth: number) => busSource().calculate(daysPerMonth),
  metro: (kmPerMonth: number) => metroSource().calculate(kmPerMonth),
  bike: () => 0,
  flight: (countPerYear: number) => flightSource().calculate(countPerYear),
};

export const energyCO2 = {
  electricity: (unitsPerMonth: number) => electricitySource().calculate(unitsPerMonth),
  gas: (litersPerMonth: number) => gasSource().calculate(litersPerMonth),
  water: (bucketsPerDay: number) => waterSource().calculate(bucketsPerDay),
};

export const foodCO2 = {
  mealsPerYear: (mealsPerDay: number, foodType: DietType) =>
    new DietEmission(foodType).calculate(mealsPerDay),
  meat: (kgPerMonth: number) => meatSource().calculate(kgPerMonth),
};

export const shoppingCO2 = {
  online: (ordersPerMonth: number) => onlineOrdersSource().calculate(ordersPerMonth),
  clothing: (itemsPerMonth: number) => clothingSource().calculate(itemsPerMonth),
  electronics: (countPerYear: number) => electronicsSource().calculate(countPerYear),
  waste: (wastePct: number) => foodWasteSource().calculate(wastePct),
};

export const digitalCO2 = {
  streaming: (hoursPerMonth: number) => streamingSource().calculate(hoursPerMonth),
  cloud: (gb: number) => cloudStorageSource().calculate(gb),
  email: (emailsPerDay: number) => emailSource().calculate(emailsPerDay),
  calls: (hoursPerMonth: number) => videoCallsSource().calculate(hoursPerMonth),
  social: (hoursPerDay: number) => socialMediaSource().calculate(hoursPerDay),
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

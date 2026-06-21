/** CO2 emission calculations — results in kg CO2e per year unless noted */

// ---------------------------------------------------------------------------
// Regional emission factors
// ---------------------------------------------------------------------------

export type RegionCode = 'IN' | 'US' | 'EU' | 'CN' | 'GLOBAL';

export interface RegionFactor {
  electricityFactorPerKwh: number;
  carFactorPerKm: number;
  gasFactorPerLiter: number;
  flightFactorPerFlight: number;
  perCapitaAverageKg: number;
  safeTargetKg: number;
}

/**
 * Region-specific carbon intensity factors per year. Electricity grid factors
 * reflect IEA 2023 averages; car factors reflect average fleet efficiency;
 * per-capita averages are approximate national footprints in kg CO2e/year.
 */
export const REGION_FACTORS: Record<RegionCode, RegionFactor> = {
  IN: { electricityFactorPerKwh: 0.71, carFactorPerKm: 0.12, gasFactorPerLiter: 2.0, flightFactorPerFlight: 200, perCapitaAverageKg: 1600, safeTargetKg: 2000 },
  US: { electricityFactorPerKwh: 0.37, carFactorPerKm: 0.22, gasFactorPerLiter: 2.3, flightFactorPerFlight: 350, perCapitaAverageKg: 15300, safeTargetKg: 5000 },
  EU: { electricityFactorPerKwh: 0.23, carFactorPerKm: 0.17, gasFactorPerLiter: 2.1, flightFactorPerFlight: 300, perCapitaAverageKg: 6800, safeTargetKg: 4000 },
  CN: { electricityFactorPerKwh: 0.58, carFactorPerKm: 0.18, gasFactorPerLiter: 2.2, flightFactorPerFlight: 280, perCapitaAverageKg: 7400, safeTargetKg: 4500 },
  GLOBAL: { electricityFactorPerKwh: 0.45, carFactorPerKm: 0.15, gasFactorPerLiter: 2.1, flightFactorPerFlight: 250, perCapitaAverageKg: 4700, safeTargetKg: 3000 },
};

export const DEFAULT_REGION: RegionCode = 'IN';

export const INDIA_AVERAGE_TONNES = 1.6;
export const INDIA_AVERAGE_KG = INDIA_AVERAGE_TONNES * 1000;
export const CLIMATE_SAFE_TARGET_KG = 2000;

export type DietType = 'vegetarian' | 'non-vegetarian' | 'mixed';
export type EmissionCategory = 'transportation' | 'energy' | 'food' | 'shopping' | 'digital';

// ---------------------------------------------------------------------------
// Region factor provider — strategy pattern for testability
// ---------------------------------------------------------------------------

export interface RegionFactorProvider {
  getFactors(region: RegionCode): RegionFactor;
}

export class DefaultRegionFactorProvider implements RegionFactorProvider {
  getFactors(region: RegionCode): RegionFactor {
    return REGION_FACTORS[region] ?? REGION_FACTORS[DEFAULT_REGION];
  }
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmissionInput(value: number, maxValue = 1_000_000): ValidationResult {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { isValid: false, error: 'Value must be a number' };
  }
  if (value < 0) {
    return { isValid: false, error: 'Value cannot be negative' };
  }
  if (value > maxValue) {
    return { isValid: false, error: `Value exceeds maximum of ${maxValue}` };
  }
  return { isValid: true };
}

export function sanitizeNumericInput(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

// ---------------------------------------------------------------------------
// OOP emission source hierarchy
// ---------------------------------------------------------------------------

const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365;

export abstract class EmissionSource {
  abstract readonly category: EmissionCategory;
  abstract readonly subcategory: string;
  abstract readonly unit: string;
  abstract calculate(value: number): number;
}

abstract class LinearEmissionSource extends EmissionSource {
  protected readonly factor: number;
  protected readonly frequencyPerYear: number;

  constructor(factor: number, frequencyPerYear: number) {
    super();
    this.factor = factor;
    this.frequencyPerYear = frequencyPerYear;
  }

  calculate(value: number): number {
    return sanitizeNumericInput(value) * this.factor * this.frequencyPerYear;
  }
}

abstract class RegionAwareLinearSource extends EmissionSource {
  protected readonly frequencyPerYear: number;
  protected readonly factorProvider: RegionFactorProvider;
  protected readonly region: RegionCode;

  constructor(factorProvider: RegionFactorProvider, region: RegionCode, frequencyPerYear: number) {
    super();
    this.factorProvider = factorProvider;
    this.region = region;
    this.frequencyPerYear = frequencyPerYear;
  }

  protected abstract resolveFactor(): number;

  calculate(value: number): number {
    return sanitizeNumericInput(value) * this.resolveFactor() * this.frequencyPerYear;
  }
}

// ---------------------------------------------------------------------------
// Transportation
// ---------------------------------------------------------------------------

export class CarEmission extends RegionAwareLinearSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'car';
  readonly unit = 'km/month';
  protected resolveFactor(): number {
    return this.factorProvider.getFactors(this.region).carFactorPerKm;
  }
}

export class BusEmission extends LinearEmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'bus';
  readonly unit = 'days/month';
  constructor() { super(2.5, MONTHS_PER_YEAR); }
}

export class MetroEmission extends LinearEmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'metro';
  readonly unit = 'km/month';
  constructor() { super(0.05, MONTHS_PER_YEAR); }
}

export class BicycleEmission extends EmissionSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'bike';
  readonly unit = 'km/month';
  calculate(): number { return 0; }
}

export class FlightEmission extends RegionAwareLinearSource {
  readonly category = 'transportation' as const;
  readonly subcategory = 'flight';
  readonly unit = 'flights/year';
  protected resolveFactor(): number {
    return this.factorProvider.getFactors(this.region).flightFactorPerFlight;
  }
}

// ---------------------------------------------------------------------------
// Energy
// ---------------------------------------------------------------------------

export class ElectricityEmission extends RegionAwareLinearSource {
  readonly category = 'energy' as const;
  readonly subcategory = 'electricity';
  readonly unit = 'units/month';
  protected resolveFactor(): number {
    return this.factorProvider.getFactors(this.region).electricityFactorPerKwh;
  }
}

export class GasEmission extends RegionAwareLinearSource {
  readonly category = 'energy' as const;
  readonly subcategory = 'gas';
  readonly unit = 'liters/month';
  protected resolveFactor(): number {
    return this.factorProvider.getFactors(this.region).gasFactorPerLiter;
  }
}

export class WaterEmission extends LinearEmissionSource {
  readonly category = 'energy' as const;
  readonly subcategory = 'water';
  readonly unit = 'buckets/day';
  constructor() { super(0.05, DAYS_PER_YEAR); }
}

// ---------------------------------------------------------------------------
// Food
// ---------------------------------------------------------------------------

const DIET_FACTORS: Record<DietType, number> = {
  vegetarian: 0.5,
  'non-vegetarian': 1.2,
  mixed: 0.85,
};

export function isDietType(value: string): value is DietType {
  return value === 'vegetarian' || value === 'non-vegetarian' || value === 'mixed';
}

export class DietEmission extends EmissionSource {
  readonly category = 'food' as const;
  readonly subcategory = 'diet_type';
  private readonly dietType: DietType;

  constructor(dietType: DietType) {
    super();
    this.dietType = isDietType(dietType) ? dietType : 'mixed';
  }

  get unit(): DietType { return this.dietType; }

  calculate(mealsPerDay: number): number {
    return sanitizeNumericInput(mealsPerDay) * DIET_FACTORS[this.dietType] * DAYS_PER_YEAR;
  }
}

export class MeatEmission extends LinearEmissionSource {
  readonly category = 'food' as const;
  readonly subcategory = 'meat';
  readonly unit = 'kg/month';
  constructor() { super(12, MONTHS_PER_YEAR); }
}

// ---------------------------------------------------------------------------
// Shopping & Waste
// ---------------------------------------------------------------------------

export class OnlineOrdersEmission extends LinearEmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'online';
  readonly unit = 'orders/month';
  constructor() { super(5, MONTHS_PER_YEAR); }
}

export class ClothingEmission extends LinearEmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'clothing';
  readonly unit = 'items/month';
  constructor() { super(10, MONTHS_PER_YEAR); }
}

export class ElectronicsEmission extends EmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'electronics';
  readonly unit = 'devices/year';
  calculate(value: number): number {
    return sanitizeNumericInput(value) * 80;
  }
}

export class FoodWasteEmission extends LinearEmissionSource {
  readonly category = 'shopping' as const;
  readonly subcategory = 'waste';
  readonly unit = 'waste_pct';
  constructor() { super(2, MONTHS_PER_YEAR); }
}

// ---------------------------------------------------------------------------
// Digital
// ---------------------------------------------------------------------------

export class StreamingEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'streaming';
  readonly unit = 'hours/month';
  constructor() { super(0.05, MONTHS_PER_YEAR); }
}

export class CloudStorageEmission extends EmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'cloud';
  readonly unit = 'GB';
  calculate(value: number): number {
    return sanitizeNumericInput(value) * 0.2;
  }
}

export class EmailEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'email';
  readonly unit = 'emails/day';
  constructor() { super(0.004, DAYS_PER_YEAR); }
}

export class VideoCallsEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'calls';
  readonly unit = 'hours/month';
  constructor() { super(0.1, MONTHS_PER_YEAR); }
}

export class SocialMediaEmission extends LinearEmissionSource {
  readonly category = 'digital' as const;
  readonly subcategory = 'social';
  readonly unit = 'hours/day';
  constructor() { super(0.02, DAYS_PER_YEAR); }
}

// ---------------------------------------------------------------------------
// Source factory + registry
// ---------------------------------------------------------------------------

type SourceFactory = (unit?: string) => EmissionSource;

const DEFAULT_PROVIDER = new DefaultRegionFactorProvider();

const SOURCE_FACTORIES: Record<EmissionCategory, Record<string, SourceFactory>> = {
  transportation: {
    car: () => new CarEmission(DEFAULT_PROVIDER, DEFAULT_REGION, MONTHS_PER_YEAR),
    bus: () => new BusEmission(),
    metro: () => new MetroEmission(),
    bike: () => new BicycleEmission(),
    flight: () => new FlightEmission(DEFAULT_PROVIDER, DEFAULT_REGION, 1),
  },
  energy: {
    electricity: () => new ElectricityEmission(DEFAULT_PROVIDER, DEFAULT_REGION, MONTHS_PER_YEAR),
    gas: () => new GasEmission(DEFAULT_PROVIDER, DEFAULT_REGION, MONTHS_PER_YEAR),
    water: () => new WaterEmission(),
  },
  food: {
    diet_type: (unit) => {
      const diet = isDietType(unit ?? '') ? (unit as DietType) : 'mixed';
      return new DietEmission(diet);
    },
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

export function resolveEmissionSource(
  category: string,
  subcategory: string,
  unit?: string,
): EmissionSource | null {
  const factory = SOURCE_FACTORIES[category as EmissionCategory]?.[subcategory];
  return factory ? factory(unit) : null;
}

export function calculateCarbonEmission(params: {
  category: string;
  subcategory: string;
  value: number;
  unit: string;
}): number {
  const source = resolveEmissionSource(params.category, params.subcategory, params.unit);
  if (!source) return 0;
  return source.calculate(params.value);
}

// ---------------------------------------------------------------------------
// Cash transactions
// ---------------------------------------------------------------------------

export const cashCategoryFactors: Record<string, number> = {
  food: 0.005, transport: 0.008, shopping: 0.006, utilities: 0.01,
  entertainment: 0.004, healthcare: 0.003, other: 0.005,
};

export const CASH_DEFAULT_FACTOR = 0.005;

export function cashTransactionCO2(category: string, amount: number): number {
  const factor = cashCategoryFactors[category] ?? CASH_DEFAULT_FACTOR;
  return sanitizeNumericInput(amount) * factor;
}

// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------

export interface EmissionBreakdown {
  transport: number; energy: number; food: number;
  shopping: number; digital: number; cash: number; total: number;
}

export interface CalculatorValues {
  carKmPerMonth: number; busDaysPerMonth: number; metroKmPerMonth: number;
  flightCountPerYear: number; electricityUnitsPerMonth: number; gasLitersPerMonth: number;
  waterBucketsPerDay: number; dietType: DietType; mealsPerDay: number; meatKgPerMonth: number;
  onlineOrdersPerMonth: number; clothingItemsPerMonth: number; electronicsCountPerYear: number;
  foodWastePercent: number; streamingHoursPerMonth: number; cloudStorageGb: number;
  emailsPerDay: number; videoCallHoursPerMonth: number; socialMediaHoursPerDay: number;
}

export interface EmissionSourceResult {
  category: EmissionCategory; subcategory: string; unit: string;
  input: number; co2: number;
}

/**
 * Region-aware report builder. Creates the right source instances for the
 * user's region and computes a full breakdown plus per-source detail.
 */
export class RegionalCarbonReport {
  private readonly provider: RegionFactorProvider;
  private readonly region: RegionCode;
  readonly carSource: CarEmission;
  readonly busSource: BusEmission;
  readonly metroSource: MetroEmission;
  readonly flightSource: FlightEmission;
  readonly electricitySource: ElectricityEmission;
  readonly gasSource: GasEmission;
  readonly waterSource: WaterEmission;
  readonly meatSource: MeatEmission;
  readonly onlineOrdersSource: OnlineOrdersEmission;
  readonly clothingSource: ClothingEmission;
  readonly electronicsSource: ElectronicsEmission;
  readonly foodWasteSource: FoodWasteEmission;
  readonly streamingSource: StreamingEmission;
  readonly cloudStorageSource: CloudStorageEmission;
  readonly emailSource: EmailEmission;
  readonly videoCallsSource: VideoCallsEmission;
  readonly socialMediaSource: SocialMediaEmission;

  constructor(provider?: RegionFactorProvider, region?: RegionCode) {
    this.provider = provider ?? new DefaultRegionFactorProvider();
    this.region = region ?? DEFAULT_REGION;
    this.carSource = new CarEmission(this.provider, this.region, MONTHS_PER_YEAR);
    this.busSource = new BusEmission();
    this.metroSource = new MetroEmission();
    this.flightSource = new FlightEmission(this.provider, this.region, 1);
    this.electricitySource = new ElectricityEmission(this.provider, this.region, MONTHS_PER_YEAR);
    this.gasSource = new GasEmission(this.provider, this.region, MONTHS_PER_YEAR);
    this.waterSource = new WaterEmission();
    this.meatSource = new MeatEmission();
    this.onlineOrdersSource = new OnlineOrdersEmission();
    this.clothingSource = new ClothingEmission();
    this.electronicsSource = new ElectronicsEmission();
    this.foodWasteSource = new FoodWasteEmission();
    this.streamingSource = new StreamingEmission();
    this.cloudStorageSource = new CloudStorageEmission();
    this.emailSource = new EmailEmission();
    this.videoCallsSource = new VideoCallsEmission();
    this.socialMediaSource = new SocialMediaEmission();
  }

  computeBreakdown(values: CalculatorValues, cashTotal: number): EmissionBreakdown {
    const transport =
      this.carSource.calculate(values.carKmPerMonth) +
      this.busSource.calculate(values.busDaysPerMonth) +
      this.metroSource.calculate(values.metroKmPerMonth) +
      this.flightSource.calculate(values.flightCountPerYear);
    const energy =
      this.electricitySource.calculate(values.electricityUnitsPerMonth) +
      this.gasSource.calculate(values.gasLitersPerMonth) +
      this.waterSource.calculate(values.waterBucketsPerDay);
    const food =
      new DietEmission(values.dietType).calculate(values.mealsPerDay) +
      this.meatSource.calculate(values.meatKgPerMonth);
    const shopping =
      this.onlineOrdersSource.calculate(values.onlineOrdersPerMonth) +
      this.clothingSource.calculate(values.clothingItemsPerMonth) +
      this.electronicsSource.calculate(values.electronicsCountPerYear) +
      this.foodWasteSource.calculate(values.foodWastePercent);
    const digital =
      this.streamingSource.calculate(values.streamingHoursPerMonth) +
      this.cloudStorageSource.calculate(values.cloudStorageGb) +
      this.emailSource.calculate(values.emailsPerDay) +
      this.videoCallsSource.calculate(values.videoCallHoursPerMonth) +
      this.socialMediaSource.calculate(values.socialMediaHoursPerDay);
    const total = Math.round(transport + energy + food + shopping + digital + cashTotal);
    return {
      transport: Math.round(transport), energy: Math.round(energy), food: Math.round(food),
      shopping: Math.round(shopping), digital: Math.round(digital),
      cash: Math.round(cashTotal), total,
    };
  }

  computeSourceResults(values: CalculatorValues): EmissionSourceResult[] {
    return [
      { category: 'transportation', subcategory: 'car', unit: 'km/month', input: values.carKmPerMonth, co2: this.carSource.calculate(values.carKmPerMonth) },
      { category: 'transportation', subcategory: 'bus', unit: 'days/month', input: values.busDaysPerMonth, co2: this.busSource.calculate(values.busDaysPerMonth) },
      { category: 'transportation', subcategory: 'metro', unit: 'km/month', input: values.metroKmPerMonth, co2: this.metroSource.calculate(values.metroKmPerMonth) },
      { category: 'transportation', subcategory: 'flight', unit: 'flights/year', input: values.flightCountPerYear, co2: this.flightSource.calculate(values.flightCountPerYear) },
      { category: 'energy', subcategory: 'electricity', unit: 'units/month', input: values.electricityUnitsPerMonth, co2: this.electricitySource.calculate(values.electricityUnitsPerMonth) },
      { category: 'energy', subcategory: 'gas', unit: 'liters/month', input: values.gasLitersPerMonth, co2: this.gasSource.calculate(values.gasLitersPerMonth) },
      { category: 'energy', subcategory: 'water', unit: 'buckets/day', input: values.waterBucketsPerDay, co2: this.waterSource.calculate(values.waterBucketsPerDay) },
      { category: 'food', subcategory: 'diet_type', unit: values.dietType, input: values.mealsPerDay, co2: new DietEmission(values.dietType).calculate(values.mealsPerDay) },
      { category: 'food', subcategory: 'meat', unit: 'kg/month', input: values.meatKgPerMonth, co2: this.meatSource.calculate(values.meatKgPerMonth) },
      { category: 'shopping', subcategory: 'online', unit: 'orders/month', input: values.onlineOrdersPerMonth, co2: this.onlineOrdersSource.calculate(values.onlineOrdersPerMonth) },
      { category: 'shopping', subcategory: 'clothing', unit: 'items/month', input: values.clothingItemsPerMonth, co2: this.clothingSource.calculate(values.clothingItemsPerMonth) },
      { category: 'shopping', subcategory: 'electronics', unit: 'devices/year', input: values.electronicsCountPerYear, co2: this.electronicsSource.calculate(values.electronicsCountPerYear) },
      { category: 'shopping', subcategory: 'waste', unit: 'waste_pct', input: values.foodWastePercent, co2: this.foodWasteSource.calculate(values.foodWastePercent) },
      { category: 'digital', subcategory: 'streaming', unit: 'hours/month', input: values.streamingHoursPerMonth, co2: this.streamingSource.calculate(values.streamingHoursPerMonth) },
      { category: 'digital', subcategory: 'cloud', unit: 'GB', input: values.cloudStorageGb, co2: this.cloudStorageSource.calculate(values.cloudStorageGb) },
      { category: 'digital', subcategory: 'email', unit: 'emails/day', input: values.emailsPerDay, co2: this.emailSource.calculate(values.emailsPerDay) },
      { category: 'digital', subcategory: 'calls', unit: 'hours/month', input: values.videoCallHoursPerMonth, co2: this.videoCallsSource.calculate(values.videoCallHoursPerMonth) },
      { category: 'digital', subcategory: 'social', unit: 'hours/day', input: values.socialMediaHoursPerDay, co2: this.socialMediaSource.calculate(values.socialMediaHoursPerDay) },
    ];
  }
}

// ---------------------------------------------------------------------------
// Carbon indicator — region-aware status thresholds
// ---------------------------------------------------------------------------

export interface CarbonIndicator {
  label: string;
  description: string;
  tone: 'emerald' | 'amber' | 'rose';
}

export function getCarbonIndicatorForRegion(total: number, region: RegionCode = DEFAULT_REGION): CarbonIndicator {
  const factors = REGION_FACTORS[region] ?? REGION_FACTORS[DEFAULT_REGION];
  const average = factors.perCapitaAverageKg;
  const safe = factors.safeTargetKg;

  if (total <= safe) {
    return {
      label: 'Low (Eco-Friendly)',
      description: `At or below the climate-safe target of ${safe.toLocaleString()} kg. Maintain progress with sustainable habits.`,
      tone: 'emerald',
    };
  }
  if (total < average) {
    return {
      label: 'Moderate',
      description: `Above the safe target but below the regional average (${average.toLocaleString()} kg). Small changes can get you under ${safe.toLocaleString()} kg.`,
      tone: 'amber',
    };
  }
  return {
    label: 'High Carbon Cost',
    description: `Above the regional average of ${average.toLocaleString()} kg. Prioritize low-carbon transport and energy savings.`,
    tone: 'rose',
  };
}

export function getCarbonIndicator(total: number): CarbonIndicator {
  return getCarbonIndicatorForRegion(total, DEFAULT_REGION);
}

// ---------------------------------------------------------------------------
// Backward-compatible functional API (thin wrappers over OOP classes)
// ---------------------------------------------------------------------------

const singleton = <T>(ctor: () => T) => {
  let instance: T | undefined;
  return () => (instance ??= ctor());
};

const carSource = singleton(() => new CarEmission(DEFAULT_PROVIDER, DEFAULT_REGION, MONTHS_PER_YEAR));
const busSource = singleton(() => new BusEmission());
const metroSource = singleton(() => new MetroEmission());
const flightSource = singleton(() => new FlightEmission(DEFAULT_PROVIDER, DEFAULT_REGION, 1));
const electricitySource = singleton(() => new ElectricityEmission(DEFAULT_PROVIDER, DEFAULT_REGION, MONTHS_PER_YEAR));
const gasSource = singleton(() => new GasEmission(DEFAULT_PROVIDER, DEFAULT_REGION, MONTHS_PER_YEAR));
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
  { title: 'Switch to LED bulbs', desc: 'Replace incandescent bulbs with LEDs to cut lighting energy use by up to 80%.', savings: '50 kg/yr' },
  { title: 'Take public transit 2× per week', desc: 'Replace car trips with bus or metro to dramatically lower transport emissions.', savings: '400 kg/yr' },
  { title: 'Eat vegetarian 3 days a week', desc: 'Reducing meat consumption is one of the fastest ways to shrink your food footprint.', savings: '300 kg/yr' },
  { title: 'Unplug idle electronics', desc: 'Phantom power from chargers and standby devices adds up — use power strips.', savings: '80 kg/yr' },
  { title: 'Buy local & reduce packaging', desc: 'Fewer online orders and local produce mean less shipping and packaging waste.', savings: '120 kg/yr' },
];

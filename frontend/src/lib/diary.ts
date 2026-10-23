import { addDays } from './date';
import type { Addon, DiaryEntry, Food, FoodCategory, MealType, Nutrients, Sweetness } from './types';

export const MEALS: { id: MealType; label: string; localLabel: string }[] = [
  { id: 'breakfast', label: 'Breakfast', localLabel: 'Sarapan' },
  { id: 'lunch', label: 'Lunch', localLabel: 'Makan tengah hari' },
  { id: 'teatime', label: 'Tea time', localLabel: 'Minum petang' },
  { id: 'dinner', label: 'Dinner', localLabel: 'Makan malam' },
  { id: 'supper', label: 'Supper', localLabel: 'Lewat malam' },
];

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  teatime: 'Tea time',
  dinner: 'Dinner',
  supper: 'Supper',
};

export const SWEETNESS: Record<Sweetness, { label: string; detail: string; factor: number }> = {
  normal: { label: 'Normal', detail: 'As usually served', factor: 1 },
  less: { label: 'Kurang manis', detail: 'About half the sugar', factor: 0.5 },
  none: { label: 'Kosong', detail: 'No added sugar', factor: 0 },
};

export const SERVINGS = { min: 0.5, max: 5, step: 0.5 } as const;

export const EMPTY_TOTALS: Nutrients = { energyKcal: 0, carbohydrateG: 0, proteinG: 0, fatG: 0 };

const roundTo = (value: number, places: number) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function clampServings(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const stepped = Math.round(value / SERVINGS.step) * SERVINGS.step;
  return Math.min(SERVINGS.max, Math.max(SERVINGS.min, stepped));
}

/**
 * Nutrients for a number of servings. Energy is rounded to whole kcal and grams to one
 * decimal, and totals are summed from these rounded values so that the figures shown for
 * each entry always add up to the totals shown for the day.
 */
export function nutrientsFor(perServing: Nutrients, servings: number): Nutrients {
  return {
    energyKcal: Math.round(perServing.energyKcal * servings),
    carbohydrateG: roundTo(perServing.carbohydrateG * servings, 1),
    proteinG: roundTo(perServing.proteinG * servings, 1),
    fatG: roundTo(perServing.fatG * servings, 1),
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  return items.reduce<Nutrients>(
    (total, item) => ({
      energyKcal: total.energyKcal + item.energyKcal,
      carbohydrateG: roundTo(total.carbohydrateG + item.carbohydrateG, 1),
      proteinG: roundTo(total.proteinG + item.proteinG, 1),
      fatG: roundTo(total.fatG + item.fatG, 1),
    }),
    EMPTY_TOTALS,
  );
}

/** One serving of a food with its add-ons, and with sweetener reduced for kurang manis or kosong. */
export function servingNutrients(food: Food, addons: Addon[] = [], sweetness: Sweetness = 'normal'): Nutrients {
  const removedSugar = food.sugarG ? food.sugarG * (1 - SWEETNESS[sweetness].factor) : 0;
  const base: Nutrients = {
    energyKcal: food.energyKcal - removedSugar * 4,
    carbohydrateG: food.carbohydrateG - removedSugar,
    proteinG: food.proteinG,
    fatG: food.fatG,
  };
  const total = [base, ...addons].reduce<Nutrients>(
    (sum, item) => ({
      energyKcal: sum.energyKcal + item.energyKcal,
      carbohydrateG: sum.carbohydrateG + item.carbohydrateG,
      proteinG: sum.proteinG + item.proteinG,
      fatG: sum.fatG + item.fatG,
    }),
    EMPTY_TOTALS,
  );
  return {
    energyKcal: Math.round(total.energyKcal),
    carbohydrateG: roundTo(total.carbohydrateG, 1),
    proteinG: roundTo(total.proteinG, 1),
    fatG: roundTo(total.fatG, 1),
  };
}

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface NewEntry {
  food: Food;
  servings: number;
  meal: MealType;
  date: string;
  source: DiaryEntry['source'];
  addons?: Addon[];
  sweetness?: Sweetness;
  confidence?: number;
  photo?: string;
}

export function createEntry({ food, servings, meal, date, source, addons = [], sweetness, confidence, photo }: NewEntry): DiaryEntry {
  const portions = clampServings(servings);
  const perServing = servingNutrients(food, addons, sweetness);
  // Nutrients are copied into the entry so later database revisions don't rewrite history.
  return {
    id: newId(),
    date,
    meal,
    foodId: food.id,
    foodName: food.name,
    category: food.category,
    servingLabel: food.serving.localLabel,
    servings: portions,
    perServing,
    addons: addons.map((addon) => addon.name),
    ...(food.sugarG && sweetness ? { sweetness } : {}),
    source,
    ...(confidence !== undefined ? { confidence } : {}),
    ...(photo ? { photo } : {}),
    loggedAt: new Date().toISOString(),
    ...nutrientsFor(perServing, portions),
  };
}

export const QUICK_ADD_LIMIT = { min: 1, max: 5000 } as const;

/** Calories only, for food that isn't in the database and doesn't need its own entry. */
export function createQuickEntry({ kcal, name, meal, date }: { kcal: number; name?: string; meal: MealType; date: string }): DiaryEntry {
  const energyKcal = Math.round(Math.min(QUICK_ADD_LIMIT.max, Math.max(QUICK_ADD_LIMIT.min, kcal)));
  const perServing: Nutrients = { energyKcal, carbohydrateG: 0, proteinG: 0, fatG: 0 };
  return {
    id: newId(),
    date,
    meal,
    foodId: 'quick',
    foodName: name?.trim() || 'Quick add',
    category: 'custom',
    servingLabel: 'calories only',
    servings: 1,
    perServing,
    addons: [],
    source: 'quick',
    loggedAt: new Date().toISOString(),
    ...perServing,
  };
}

/** Recalculates an entry after its servings change, from the per-serving values it was logged with. */
export function withServings(entry: DiaryEntry, servings: number): DiaryEntry {
  const portions = clampServings(servings);
  return { ...entry, servings: portions, ...nutrientsFor(entry.perServing, portions) };
}

export function entriesOn(entries: DiaryEntry[], date: string): DiaryEntry[] {
  return entries.filter((entry) => entry.date === date);
}

export function byMeal(entries: DiaryEntry[]): Record<MealType, DiaryEntry[]> {
  const groups: Record<MealType, DiaryEntry[]> = { breakfast: [], lunch: [], teatime: [], dinner: [], supper: [] };
  for (const entry of entries) groups[entry.meal].push(entry);
  for (const meal of Object.keys(groups) as MealType[]) {
    groups[meal].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  }
  return groups;
}

export interface Balance {
  targetKcal: number;
  eatenKcal: number;
  /** Negative when the target has been exceeded. */
  remainingKcal: number;
  /** Eaten as a fraction of the target (can exceed 1). */
  progress: number;
  over: boolean;
}

export function balance(targetKcal: number, eatenKcal: number): Balance {
  const remainingKcal = targetKcal - eatenKcal;
  return {
    targetKcal,
    eatenKcal,
    remainingKcal,
    progress: targetKcal > 0 ? eatenKcal / targetKcal : 0,
    over: remainingKcal < 0,
  };
}

/** Whole-percent share of the daily target a number of kcal represents. */
export function shareOfTarget(kcal: number, targetKcal: number): number {
  if (targetKcal <= 0) return 0;
  return Math.round((kcal / targetKcal) * 100);
}

/** Meal for the time of day, following typical Malaysian meal times. */
export function suggestedMeal(now: Date = new Date()): MealType {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= 5 * 60 && minutes < 11 * 60) return 'breakfast';
  if (minutes >= 11 * 60 && minutes < 15 * 60) return 'lunch';
  if (minutes >= 15 * 60 && minutes < 18 * 60 + 30) return 'teatime';
  if (minutes >= 18 * 60 + 30 && minutes < 21 * 60 + 30) return 'dinner';
  return 'supper';
}

export function isMealType(value: string | null): value is MealType {
  return value === 'breakfast' || value === 'lunch' || value === 'teatime' || value === 'dinner' || value === 'supper';
}

export function formatServings(servings: number, unit: string): string {
  // "1 pinggan", "1.5 × 1 pinggan", "2 × 10 cucuk"
  return servings === 1 ? unit : `${servings} × ${unit}`;
}

/** Consecutive days with at least one entry, counting back from today (or yesterday if today is empty). */
export function loggingStreak(entries: DiaryEntry[], today: string): number {
  const days = new Set(entries.map((entry) => entry.date));
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/** Most recently logged foods, newest first, one entry per food. Quick adds are skipped. */
export function recentFoodIds(entries: DiaryEntry[], limit = 8): string[] {
  const ids: string[] = [];
  const sorted = [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  for (const entry of sorted) {
    if (entry.source === 'quick' || ids.includes(entry.foodId)) continue;
    ids.push(entry.foodId);
    if (ids.length === limit) break;
  }
  return ids;
}

export interface CustomFoodInput {
  name: string;
  servingLabel: string;
  category: FoodCategory;
  energyKcal: number;
  carbohydrateG?: number;
  proteinG?: number;
  fatG?: number;
}

export type CustomFoodErrors = Partial<Record<keyof CustomFoodInput, string>>;

export function validateCustomFood(input: Partial<CustomFoodInput>): CustomFoodErrors {
  const errors: CustomFoodErrors = {};
  if (!input.name?.trim()) errors.name = 'Give the food a name.';
  else if (input.name.trim().length > 40) errors.name = 'Keep the name under 40 characters.';
  if (!input.servingLabel?.trim()) errors.servingLabel = 'Describe one serving, e.g. 1 pinggan.';
  const kcal = input.energyKcal;
  if (kcal === undefined || !Number.isFinite(kcal)) errors.energyKcal = 'Enter the calories in one serving.';
  else if (kcal <= 0 || kcal > 3000) errors.energyKcal = 'Calories must be between 1 and 3,000.';
  for (const key of ['carbohydrateG', 'proteinG', 'fatG'] as const) {
    const grams = input[key];
    if (grams !== undefined && (!Number.isFinite(grams) || grams < 0 || grams > 500)) {
      errors[key] = 'Use a number between 0 and 500.';
    }
  }
  return errors;
}

export function createCustomFood(input: CustomFoodInput): Food {
  return {
    id: `custom-${newId()}`,
    name: input.name.trim(),
    localName: '',
    description: 'Your own food',
    category: input.category,
    serving: { label: input.servingLabel.trim(), localLabel: input.servingLabel.trim(), grams: 0 },
    scan: false,
    addonIds: [],
    pork: false,
    aliases: [],
    custom: true,
    energyKcal: Math.round(input.energyKcal),
    carbohydrateG: input.carbohydrateG ?? 0,
    proteinG: input.proteinG ?? 0,
    fatG: input.fatG ?? 0,
  };
}

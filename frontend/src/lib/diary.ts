import type { DiaryEntry, Food, MealType, Nutrients } from './types';

export const MEALS: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
];

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
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
 * Nutrients for a number of standard servings. Energy is rounded to whole kcal and grams
 * to one decimal, and totals are summed from these rounded values so that the figures
 * shown for each entry always add up to the totals shown for the day.
 */
export function nutrientsFor(food: Nutrients, servings: number): Nutrients {
  return {
    energyKcal: Math.round(food.energyKcal * servings),
    carbohydrateG: roundTo(food.carbohydrateG * servings, 1),
    proteinG: roundTo(food.proteinG * servings, 1),
    fatG: roundTo(food.fatG * servings, 1),
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
  confidence?: number;
}

export function createEntry({ food, servings, meal, date, source, confidence }: NewEntry): DiaryEntry {
  const portions = clampServings(servings);
  // Nutrients are copied into the entry so later database revisions don't rewrite history.
  return {
    id: newId(),
    date,
    meal,
    foodId: food.id,
    foodName: food.name,
    servingLabel: food.serving.label,
    servings: portions,
    perServing: {
      energyKcal: food.energyKcal,
      carbohydrateG: food.carbohydrateG,
      proteinG: food.proteinG,
      fatG: food.fatG,
    },
    source,
    ...(confidence !== undefined ? { confidence } : {}),
    loggedAt: new Date().toISOString(),
    ...nutrientsFor(food, portions),
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
  const groups: Record<MealType, DiaryEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
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

export function suggestedMeal(now: Date = new Date()): MealType {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= 4 * 60 && minutes < 11 * 60) return 'breakfast';
  if (minutes >= 11 * 60 && minutes < 15 * 60) return 'lunch';
  if (minutes >= 18 * 60 && minutes < 22 * 60) return 'dinner';
  return 'snack';
}

export function isMealType(value: string | null): value is MealType {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack';
}

export function formatServings(servings: number): string {
  return servings === 1 ? '1 serving' : `${servings} servings`;
}

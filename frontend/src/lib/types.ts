export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type Goal = 'lose' | 'maintain' | 'gain';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodCategory = 'rice' | 'noodles' | 'bread' | 'skewer' | 'curry';

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  updatedAt: string;
}

export interface Nutrients {
  energyKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
}

export interface Food extends Nutrients {
  id: string;
  name: string;
  localName: string;
  description: string;
  category: FoodCategory;
  serving: { label: string; grams: number };
}

export interface DiaryEntry extends Nutrients {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  meal: MealType;
  foodId: string;
  foodName: string;
  servingLabel: string;
  /** Number of standard servings the user confirmed. */
  servings: number;
  /** Database values for one standard serving at the time of logging. */
  perServing: Nutrients;
  source: 'scan' | 'manual';
  /** Top-1 model confidence when the entry came from a scan the user accepted. */
  confidence?: number;
  loggedAt: string;
}

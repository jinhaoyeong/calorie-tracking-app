export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type Goal = 'lose' | 'maintain' | 'gain';
/** Malaysian eating pattern: tea time (minum petang) and supper are proper meals here. */
export type MealType = 'breakfast' | 'lunch' | 'teatime' | 'dinner' | 'supper';
export type FoodCategory = 'rice' | 'noodles' | 'bread' | 'mains' | 'kuih' | 'dessert' | 'drinks' | 'fruit' | 'custom';
/** Drink sweetness as ordered at a kopitiam or mamak. */
export type Sweetness = 'normal' | 'less' | 'none';

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  updatedAt: string;
}

export interface Preferences {
  /** Hide foods that usually contain pork. */
  halalOnly: boolean;
  /** Keep a small thumbnail of scanned meals in the diary, on this device only. */
  savePhotos: boolean;
}

export interface Nutrients {
  energyKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
}

export interface Addon extends Nutrients {
  id: string;
  name: string;
  description: string;
}

export interface Food extends Nutrients {
  id: string;
  name: string;
  localName: string;
  description: string;
  category: FoodCategory;
  /** label is English ("1 plate"), localLabel the Malay unit people use ("1 pinggan"). */
  serving: { label: string; localLabel: string; grams: number };
  /** One of the ten classes the recognition model is trained on. */
  scan: boolean;
  addonIds: string[];
  /** Grams of sugar from sweetener or condensed milk in a normal serving (drinks only). */
  sugarG?: number;
  /** Usually contains pork, so not halal. */
  pork: boolean;
  aliases: string[];
  /** Created by the user on this device. */
  custom?: boolean;
}

export interface DiaryEntry extends Nutrients {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  meal: MealType;
  foodId: string;
  foodName: string;
  category: FoodCategory;
  servingLabel: string;
  /** Number of servings the user confirmed. */
  servings: number;
  /** One serving including add-ons and sweetness, as logged. */
  perServing: Nutrients;
  /** Names of add-ons included in each serving. */
  addons: string[];
  sweetness?: Sweetness;
  source: 'scan' | 'manual' | 'quick';
  /** Top-1 model confidence when the entry came from a scan the user accepted. */
  confidence?: number;
  /** Small JPEG data URL, kept only if the user allows saving meal photos. */
  photo?: string;
  loggedAt: string;
}

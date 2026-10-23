import database from '../../../data/malaysian_foods.json';
import type { Food, FoodCategory } from './types';

interface RawFood {
  id: string;
  name: string;
  local_name: string;
  description: string;
  category: string;
  serving: { label: string; grams: number };
  energy_kcal: number;
  carbohydrate_g: number;
  protein_g: number;
  fat_g: number;
}

export function parseFood(raw: RawFood): Food {
  return {
    id: raw.id,
    name: raw.name,
    localName: raw.local_name,
    description: raw.description,
    category: raw.category as FoodCategory,
    serving: raw.serving,
    energyKcal: raw.energy_kcal,
    carbohydrateG: raw.carbohydrate_g,
    proteinG: raw.protein_g,
    fatG: raw.fat_g,
  };
}

export const FOODS: Food[] = database.foods.map(parseFood);
export const NUTRITION_BASIS: string = database.basis;
export const NUTRITION_SOURCE_URL: string = database.source_url;
export const NUTRITION_VERSION: string = database.version;

const byId = new Map(FOODS.map((food) => [food.id, food]));

/** Returns undefined when the database has no entry for the id (e.g. a new model class). */
export function findFood(id: string): Food | undefined {
  return byId.get(id);
}

export function searchFoods(query: string, foods: Food[] = FOODS): Food[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return foods;
  return foods.filter((food) =>
    [food.name, food.localName, food.description].some((text) => text.toLowerCase().includes(needle)),
  );
}

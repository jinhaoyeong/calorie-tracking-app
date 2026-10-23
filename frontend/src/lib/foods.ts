import database from '../../../data/malaysian_foods.json';
import type { Addon, Food, FoodCategory, Nutrients } from './types';

interface RawNutrients {
  energy_kcal: number;
  carbohydrate_g: number;
  protein_g: number;
  fat_g: number;
}

interface RawFood extends RawNutrients {
  id: string;
  name: string;
  local_name: string;
  description: string;
  category: string;
  serving: { label: string; local_label: string; grams: number };
  scan?: boolean;
  addons?: string[];
  sugar_g?: number;
  pork?: boolean;
  aliases?: string[];
}

interface RawAddon extends RawNutrients {
  id: string;
  name: string;
  description: string;
}

const nutrients = (raw: RawNutrients): Nutrients => ({
  energyKcal: raw.energy_kcal,
  carbohydrateG: raw.carbohydrate_g,
  proteinG: raw.protein_g,
  fatG: raw.fat_g,
});

export function parseFood(raw: RawFood): Food {
  return {
    id: raw.id,
    name: raw.name,
    localName: raw.local_name,
    description: raw.description,
    category: raw.category as FoodCategory,
    serving: { label: raw.serving.label, localLabel: raw.serving.local_label, grams: raw.serving.grams },
    scan: Boolean(raw.scan),
    addonIds: raw.addons ?? [],
    ...(raw.sugar_g !== undefined ? { sugarG: raw.sugar_g } : {}),
    pork: Boolean(raw.pork),
    aliases: raw.aliases ?? [],
    ...nutrients(raw),
  };
}

export const FOODS: Food[] = (database.foods as RawFood[]).map(parseFood);
export const ADDONS: Addon[] = (database.addons as RawAddon[]).map((raw) => ({
  id: raw.id,
  name: raw.name,
  description: raw.description,
  ...nutrients(raw),
}));
export const CATEGORIES: { id: FoodCategory; name: string; localName: string }[] = database.categories.map((c) => ({
  id: c.id as FoodCategory,
  name: c.name,
  localName: c.local_name,
}));

export const NUTRITION_BASIS: string = database.basis;
export const NUTRITION_SOURCE_URL: string = database.source_url;
export const NUTRITION_VERSION: string = database.version;

/** The ten dishes the recognition model is trained on, in database order. */
export const SCAN_FOODS: Food[] = FOODS.filter((food) => food.scan);

const foodsById = new Map(FOODS.map((food) => [food.id, food]));
const addonsById = new Map(ADDONS.map((addon) => [addon.id, addon]));

/** Looks up built-in foods, then the user's own foods. Undefined when there is no entry. */
export function findFood(id: string, customFoods: Food[] = []): Food | undefined {
  return foodsById.get(id) ?? customFoods.find((food) => food.id === id);
}

export function addonsFor(food: Food): Addon[] {
  return food.addonIds.map((id) => addonsById.get(id)).filter((addon): addon is Addon => Boolean(addon));
}

export function findAddon(id: string): Addon | undefined {
  return addonsById.get(id);
}

export function isVisible(food: Food, halalOnly: boolean): boolean {
  return !(halalOnly && food.pork);
}

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Ranks name and local-name matches above alias and description matches. */
export function searchFoods(query: string, foods: Food[] = FOODS): Food[] {
  const needle = normalise(query);
  if (!needle) return foods;
  const scored: { food: Food; score: number }[] = [];
  for (const food of foods) {
    const names = [food.name, food.localName].map(normalise);
    let score = 0;
    if (names.some((n) => n.startsWith(needle))) score = 3;
    else if (names.some((n) => n.includes(needle))) score = 2;
    else if (food.aliases.map(normalise).some((a) => a.includes(needle))) score = 2;
    else if (normalise(food.description).includes(needle)) score = 1;
    if (score) scored.push({ food, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.food);
}

import { describe, expect, it } from 'vitest';
import {
  balance,
  byMeal,
  clampServings,
  createCustomFood,
  createEntry,
  createQuickEntry,
  entriesOn,
  formatServings,
  loggingStreak,
  nutrientsFor,
  recentFoodIds,
  servingNutrients,
  shareOfTarget,
  suggestedMeal,
  sumNutrients,
  validateCustomFood,
  withServings,
} from './diary';
import { addonsFor, findAddon, findFood, FOODS } from './foods';
import type { DiaryEntry } from './types';

const nasiLemak = findFood('nasi_lemak')!;
const rotiCanai = findFood('roti_canai')!;
const tehTarik = findFood('teh_tarik')!;
const ayamGoreng = findAddon('ayam_goreng')!;
const telurMata = findAddon('telur_mata')!;

describe('servingNutrients', () => {
  it('is the database serving when nothing is added', () => {
    expect(servingNutrients(nasiLemak)).toEqual({ energyKcal: 389, carbohydrateG: 46, proteinG: 11, fatG: 18 });
  });

  it('adds Malaysian add-ons such as ayam goreng and telur mata', () => {
    const result = servingNutrients(nasiLemak, [ayamGoreng, telurMata]);
    expect(result.energyKcal).toBe(389 + ayamGoreng.energyKcal + telurMata.energyKcal);
    expect(result.proteinG).toBeCloseTo(11 + 22 + 6.3, 1);
  });

  it('removes sweetener for kurang manis and kosong', () => {
    // Teh tarik: 150 kcal with 20 g sugar from condensed milk.
    expect(servingNutrients(tehTarik, [], 'normal').energyKcal).toBe(150);
    expect(servingNutrients(tehTarik, [], 'less').energyKcal).toBe(110);
    expect(servingNutrients(tehTarik, [], 'none').energyKcal).toBe(70);
    expect(servingNutrients(tehTarik, [], 'none').carbohydrateG).toBe(4);
  });

  it('ignores sweetness for food without added sugar', () => {
    expect(servingNutrients(nasiLemak, [], 'none').energyKcal).toBe(389);
  });
});

describe('add-ons', () => {
  it('only reference add-ons that exist', () => {
    for (const food of FOODS) expect(addonsFor(food)).toHaveLength(food.addonIds.length);
  });

  it('offers nasi lemak sides', () => {
    expect(addonsFor(nasiLemak).map((a) => a.id)).toEqual(expect.arrayContaining(['ayam_goreng', 'telur_mata', 'sambal']));
  });
});

describe('nutrientsFor', () => {
  it('scales a serving', () => {
    expect(nutrientsFor(nasiLemak, 1.5)).toEqual({ energyKcal: 584, carbohydrateG: 69, proteinG: 16.5, fatG: 27 });
  });
});

describe('clampServings', () => {
  it('snaps to half servings within 0.5–5', () => {
    expect(clampServings(1.26)).toBe(1.5);
    expect(clampServings(0.1)).toBe(0.5);
    expect(clampServings(9)).toBe(5);
    expect(clampServings(Number.NaN)).toBe(1);
  });
});

describe('createEntry', () => {
  it('copies the food, add-ons and nutrients into the entry', () => {
    const entry = createEntry({
      food: nasiLemak,
      servings: 2,
      meal: 'breakfast',
      date: '2026-10-23',
      source: 'scan',
      addons: [ayamGoreng],
      confidence: 0.91,
    });
    expect(entry).toMatchObject({
      foodId: 'nasi_lemak',
      foodName: 'Nasi lemak',
      category: 'rice',
      servingLabel: '1 bungkus',
      servings: 2,
      addons: ['Ayam goreng'],
      energyKcal: 2 * (389 + ayamGoreng.energyKcal),
      source: 'scan',
      confidence: 0.91,
    });
    expect(entry.perServing.energyKcal).toBe(389 + ayamGoreng.energyKcal);
  });

  it('records sweetness only for sweetened drinks', () => {
    const drink = createEntry({ food: tehTarik, servings: 1, meal: 'teatime', date: '2026-10-23', source: 'manual', sweetness: 'less' });
    expect(drink.sweetness).toBe('less');
    expect(drink.energyKcal).toBe(110);
    const meal = createEntry({ food: rotiCanai, servings: 1, meal: 'breakfast', date: '2026-10-23', source: 'manual', sweetness: 'less' });
    expect('sweetness' in meal).toBe(false);
  });

  it('gives each entry a unique id and omits empty optional fields', () => {
    const make = () => createEntry({ food: rotiCanai, servings: 1, meal: 'supper', date: '2026-10-23', source: 'manual' });
    const a = make();
    expect(a.id).not.toBe(make().id);
    expect('confidence' in a).toBe(false);
    expect('photo' in a).toBe(false);
  });
});

describe('createQuickEntry', () => {
  it('logs calories only', () => {
    const entry = createQuickEntry({ kcal: 249.6, name: '  Kuih bahulu ', meal: 'teatime', date: '2026-10-23' });
    expect(entry).toMatchObject({ foodName: 'Kuih bahulu', energyKcal: 250, proteinG: 0, source: 'quick', meal: 'teatime' });
  });

  it('falls back to a default name and clamps the calories', () => {
    expect(createQuickEntry({ kcal: 99999, meal: 'lunch', date: '2026-10-23' })).toMatchObject({ foodName: 'Quick add', energyKcal: 5000 });
  });
});

describe('withServings', () => {
  it('recalculates from the logged per-serving values without drift', () => {
    let entry = createEntry({ food: nasiLemak, servings: 2.5, meal: 'lunch', date: '2026-10-23', source: 'manual', addons: [telurMata] });
    entry = withServings(entry, 1.5);
    entry = withServings(entry, 1);
    expect(entry.energyKcal).toBe(389 + telurMata.energyKcal);
  });
});

describe('daily arithmetic', () => {
  const day = '2026-10-23';
  const entries = [
    createEntry({ food: rotiCanai, servings: 1, meal: 'breakfast', date: day, source: 'scan', confidence: 0.8 }),
    createEntry({ food: nasiLemak, servings: 1.5, meal: 'lunch', date: day, source: 'manual', addons: [ayamGoreng] }),
    createEntry({ food: tehTarik, servings: 1, meal: 'teatime', date: day, source: 'manual', sweetness: 'less' }),
    createQuickEntry({ kcal: 120, meal: 'supper', date: day }),
    createEntry({ food: nasiLemak, servings: 1, meal: 'lunch', date: '2026-10-22', source: 'manual' }),
  ];

  it('only counts entries on the selected day', () => {
    expect(entriesOn(entries, day)).toHaveLength(4);
  });

  it('day totals equal the sum of the entries shown', () => {
    const todays = entriesOn(entries, day);
    expect(sumNutrients(todays).energyKcal).toBe(todays.reduce((sum, e) => sum + e.energyKcal, 0));
  });

  it('meal subtotals add up to the day total across all five meals', () => {
    const todays = entriesOn(entries, day);
    const groups = byMeal(todays);
    expect(Object.keys(groups)).toEqual(['breakfast', 'lunch', 'teatime', 'dinner', 'supper']);
    const mealSum = Object.values(groups).reduce((sum, list) => sum + sumNutrients(list).energyKcal, 0);
    expect(mealSum).toBe(sumNutrients(todays).energyKcal);
    expect(groups.dinner).toEqual([]);
  });

  it('every food sums consistently at every serving step', () => {
    for (const food of FOODS) {
      for (let servings = 0.5; servings <= 5; servings += 0.5) {
        const a = nutrientsFor(servingNutrients(food, addonsFor(food)), servings);
        expect(sumNutrients([a, a]).energyKcal).toBe(a.energyKcal * 2);
      }
    }
  });
});

describe('balance', () => {
  it('reports remaining calories and flags going over', () => {
    expect(balance(2000, 1250)).toEqual({ targetKcal: 2000, eatenKcal: 1250, remainingKcal: 750, progress: 0.625, over: false });
    expect(balance(2000, 2150)).toMatchObject({ remainingKcal: -150, over: true });
    expect(balance(2000, 2000).over).toBe(false);
  });

  it('expresses a meal as a share of the target', () => {
    expect(shareOfTarget(389, 2000)).toBe(19);
    expect(shareOfTarget(100, 0)).toBe(0);
  });
});

describe('suggestedMeal', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 23, h, m);
  it('follows Malaysian meal times', () => {
    expect(suggestedMeal(at(7, 30))).toBe('breakfast');
    expect(suggestedMeal(at(12, 45))).toBe('lunch');
    expect(suggestedMeal(at(16))).toBe('teatime');
    expect(suggestedMeal(at(19, 30))).toBe('dinner');
    expect(suggestedMeal(at(23, 15))).toBe('supper');
    expect(suggestedMeal(at(2))).toBe('supper');
  });
});

describe('formatServings', () => {
  it('uses the Malay serving unit', () => {
    expect(formatServings(1, '1 bungkus')).toBe('1 bungkus');
    expect(formatServings(1.5, '1 pinggan')).toBe('1.5 × 1 pinggan');
  });
});

describe('loggingStreak', () => {
  const on = (date: string) => createQuickEntry({ kcal: 100, meal: 'lunch', date });

  it('counts consecutive days ending today', () => {
    expect(loggingStreak([on('2026-10-21'), on('2026-10-22'), on('2026-10-23')], '2026-10-23')).toBe(3);
  });

  it('keeps yesterday’s streak while today is still empty', () => {
    expect(loggingStreak([on('2026-10-21'), on('2026-10-22')], '2026-10-23')).toBe(2);
  });

  it('breaks on a missed day', () => {
    expect(loggingStreak([on('2026-10-20'), on('2026-10-23')], '2026-10-23')).toBe(1);
    expect(loggingStreak([], '2026-10-23')).toBe(0);
  });
});

describe('recentFoodIds', () => {
  it('lists distinct foods newest first and skips quick adds', () => {
    const entry = (foodId: string, loggedAt: string): DiaryEntry => ({
      ...createEntry({ food: findFood(foodId)!, servings: 1, meal: 'lunch', date: '2026-10-23', source: 'manual' }),
      loggedAt,
    });
    const quick = { ...createQuickEntry({ kcal: 100, meal: 'lunch', date: '2026-10-23' }), loggedAt: '2026-10-23T09:00:00Z' };
    const list = [entry('laksa', '2026-10-21T04:00:00Z'), entry('teh_tarik', '2026-10-23T01:00:00Z'), quick, entry('laksa', '2026-10-22T04:00:00Z')];
    expect(recentFoodIds(list)).toEqual(['teh_tarik', 'laksa']);
  });
});

describe('custom foods', () => {
  it('validates the essentials', () => {
    expect(validateCustomFood({})).toMatchObject({ name: expect.any(String), servingLabel: expect.any(String), energyKcal: expect.any(String) });
    expect(validateCustomFood({ name: 'Kuih bahulu', servingLabel: '3 biji', category: 'kuih', energyKcal: 0 }).energyKcal).toBeDefined();
    expect(validateCustomFood({ name: 'Kuih bahulu', servingLabel: '3 biji', category: 'kuih', energyKcal: 120, fatG: -1 }).fatG).toBeDefined();
    expect(validateCustomFood({ name: 'Kuih bahulu', servingLabel: '3 biji', category: 'kuih', energyKcal: 120 })).toEqual({});
  });

  it('creates a loggable food', () => {
    const food = createCustomFood({ name: ' Masak lemak cili api ', servingLabel: '1 mangkuk', category: 'mains', energyKcal: 320.4, proteinG: 24 });
    expect(food).toMatchObject({ name: 'Masak lemak cili api', custom: true, energyKcal: 320, proteinG: 24, fatG: 0 });
    expect(findFood(food.id, [food])).toBe(food);
    const entry = createEntry({ food, servings: 1, meal: 'dinner', date: '2026-10-23', source: 'manual' });
    expect(entry).toMatchObject({ servingLabel: '1 mangkuk', energyKcal: 320 });
  });
});

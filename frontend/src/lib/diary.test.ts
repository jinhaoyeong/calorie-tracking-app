import { describe, expect, it } from 'vitest';
import {
  balance,
  byMeal,
  clampServings,
  createEntry,
  entriesOn,
  nutrientsFor,
  shareOfTarget,
  suggestedMeal,
  sumNutrients,
  withServings,
} from './diary';
import { FOODS, findFood } from './foods';

const nasiLemak = findFood('nasi_lemak')!;
const rotiCanai = findFood('roti_canai')!;

describe('nutrientsFor', () => {
  it('scales a standard serving', () => {
    expect(nutrientsFor(nasiLemak, 1)).toEqual({ energyKcal: 389, carbohydrateG: 46, proteinG: 11, fatG: 18 });
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
  it('copies the food and its nutrients into the entry', () => {
    const entry = createEntry({
      food: nasiLemak,
      servings: 2,
      meal: 'breakfast',
      date: '2026-10-23',
      source: 'scan',
      confidence: 0.91,
    });
    expect(entry).toMatchObject({
      foodId: 'nasi_lemak',
      foodName: 'Nasi lemak',
      servingLabel: '1 packet',
      servings: 2,
      energyKcal: 778,
      source: 'scan',
      confidence: 0.91,
      date: '2026-10-23',
      meal: 'breakfast',
    });
    expect(entry.perServing.energyKcal).toBe(389);
  });

  it('gives each entry a unique id', () => {
    const make = () => createEntry({ food: rotiCanai, servings: 1, meal: 'snack', date: '2026-10-23', source: 'manual' });
    expect(make().id).not.toBe(make().id);
  });

  it('omits confidence for manual entries', () => {
    const entry = createEntry({ food: rotiCanai, servings: 1, meal: 'snack', date: '2026-10-23', source: 'manual' });
    expect('confidence' in entry).toBe(false);
  });
});

describe('withServings', () => {
  it('recalculates from the logged per-serving values without drift', () => {
    let entry = createEntry({ food: nasiLemak, servings: 2.5, meal: 'lunch', date: '2026-10-23', source: 'manual' });
    expect(entry.energyKcal).toBe(973);
    entry = withServings(entry, 1.5);
    entry = withServings(entry, 1);
    expect(entry.energyKcal).toBe(389);
    expect(entry.fatG).toBe(18);
  });
});

describe('daily arithmetic', () => {
  const day = '2026-10-23';
  const entries = [
    createEntry({ food: rotiCanai, servings: 1, meal: 'breakfast', date: day, source: 'scan', confidence: 0.8 }),
    createEntry({ food: nasiLemak, servings: 1.5, meal: 'lunch', date: day, source: 'manual' }),
    createEntry({ food: findFood('satay')!, servings: 0.5, meal: 'dinner', date: day, source: 'manual' }),
    createEntry({ food: nasiLemak, servings: 1, meal: 'lunch', date: '2026-10-22', source: 'manual' }),
  ];

  it('only counts entries on the selected day', () => {
    expect(entriesOn(entries, day)).toHaveLength(3);
  });

  it('day totals equal the sum of the entries shown', () => {
    const todays = entriesOn(entries, day);
    const totals = sumNutrients(todays);
    expect(totals.energyKcal).toBe(301 + 584 + 229);
    expect(totals.energyKcal).toBe(todays.reduce((sum, e) => sum + e.energyKcal, 0));
    expect(totals.proteinG).toBe(6 + 16.5 + 19);
  });

  it('meal subtotals add up to the day total', () => {
    const todays = entriesOn(entries, day);
    const groups = byMeal(todays);
    const mealSum = Object.values(groups).reduce((sum, list) => sum + sumNutrients(list).energyKcal, 0);
    expect(mealSum).toBe(sumNutrients(todays).energyKcal);
    expect(groups.snack).toEqual([]);
  });

  it('every food in the database sums consistently at every serving step', () => {
    for (const food of FOODS) {
      for (let servings = 0.5; servings <= 5; servings += 0.5) {
        const a = nutrientsFor(food, servings);
        const total = sumNutrients([a, a]);
        expect(total.energyKcal).toBe(a.energyKcal * 2);
      }
    }
  });
});

describe('balance', () => {
  it('reports remaining calories', () => {
    expect(balance(2000, 1250)).toEqual({ targetKcal: 2000, eatenKcal: 1250, remainingKcal: 750, progress: 0.625, over: false });
  });

  it('flags going over the target', () => {
    const result = balance(2000, 2150);
    expect(result.remainingKcal).toBe(-150);
    expect(result.over).toBe(true);
  });

  it('is exactly on target at zero remaining', () => {
    expect(balance(2000, 2000).over).toBe(false);
  });
});

describe('shareOfTarget', () => {
  it('rounds to a whole percent', () => {
    expect(shareOfTarget(389, 2000)).toBe(19);
    expect(shareOfTarget(100, 0)).toBe(0);
  });
});

describe('suggestedMeal', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 23, h, m);
  it('follows the time of day', () => {
    expect(suggestedMeal(at(7, 30))).toBe('breakfast');
    expect(suggestedMeal(at(12, 45))).toBe('lunch');
    expect(suggestedMeal(at(16))).toBe('snack');
    expect(suggestedMeal(at(19, 30))).toBe('dinner');
    expect(suggestedMeal(at(23, 15))).toBe('snack');
  });
});

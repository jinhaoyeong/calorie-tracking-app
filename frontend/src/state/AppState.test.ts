import { describe, expect, it } from 'vitest';
import { createQuickEntry } from '../lib/diary';
import { migrateEntry, trimPhotos } from './AppState';

describe('migrateEntry', () => {
  it('moves the old Snacks meal to Tea time and fills new fields', () => {
    const old = {
      id: 'a',
      date: '2026-10-20',
      meal: 'snack',
      foodId: 'roti_canai',
      foodName: 'Roti canai',
      servingLabel: '1 piece',
      servings: 1,
      perServing: { energyKcal: 301, carbohydrateG: 38, proteinG: 6, fatG: 14 },
      source: 'manual',
      loggedAt: '2026-10-20T08:00:00Z',
      energyKcal: 301,
      carbohydrateG: 38,
      proteinG: 6,
      fatG: 14,
    };
    expect(migrateEntry(old)).toMatchObject({ meal: 'teatime', addons: [], category: 'bread' });
  });

  it('rejects malformed entries', () => {
    expect(migrateEntry(null)).toBeNull();
    expect(migrateEntry({ id: 'x', date: '2026-10-20' })).toBeNull();
  });
});

describe('trimPhotos', () => {
  it('keeps photos only on the newest entries', () => {
    const entries = [1, 2, 3].map((n) => ({
      ...createQuickEntry({ kcal: 100, meal: 'lunch', date: '2026-10-23' }),
      photo: `data:${n}`,
      loggedAt: `2026-10-2${n}T00:00:00Z`,
    }));
    const trimmed = trimPhotos(entries, 2);
    expect(trimmed.map((e) => e.photo)).toEqual([undefined, 'data:2', 'data:3']);
    expect(trimmed).toHaveLength(3);
  });
});

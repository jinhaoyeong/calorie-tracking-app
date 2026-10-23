import { describe, expect, it } from 'vitest';
import { addDays, formatDayTitle, isDateKey, startOfWeek, toDateKey, weekDays } from './date';
import { FOODS, findFood, searchFoods } from './foods';
import { formatCompact, formatGrams, formatKcal, formatSigned } from './format';
import { checkImage, MAX_UPLOAD_BYTES, sniffImageKind } from './image';

describe('dates', () => {
  it('uses the local calendar day', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('starts weeks on Monday', () => {
    expect(startOfWeek('2026-10-23')).toBe('2026-10-19'); // Friday → Monday
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19'); // Sunday stays in the same week
    expect(weekDays('2026-10-23')).toHaveLength(7);
    expect(weekDays('2026-10-23')[6]).toBe('2026-10-25');
  });

  it('validates date keys', () => {
    expect(isDateKey('2026-10-23')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('23/10/2026')).toBe(false);
    expect(isDateKey(null)).toBe(false);
  });

  it('names nearby days', () => {
    expect(formatDayTitle('2026-10-23', '2026-10-23')).toBe('Today');
    expect(formatDayTitle('2026-10-22', '2026-10-23')).toBe('Yesterday');
    expect(formatDayTitle('2026-10-20', '2026-10-23')).toMatch(/20/);
  });
});

describe('food database', () => {
  it('contains exactly the ten proposal classes', () => {
    expect(FOODS.map((f) => f.id).sort()).toEqual(
      [
        'char_kuey_teow',
        'chicken_rice',
        'laksa',
        'mee_goreng_mamak',
        'nasi_goreng',
        'nasi_lemak',
        'rendang',
        'roti_canai',
        'satay',
        'thosai',
      ].sort(),
    );
  });

  it('returns undefined for a class with no nutrition entry', () => {
    expect(findFood('kuih_lapis')).toBeUndefined();
  });

  it('searches names, local names and descriptions', () => {
    expect(searchFoods('nasi ayam').map((f) => f.id)).toEqual(['chicken_rice']);
    expect(searchFoods('  ROTI ').map((f) => f.id)).toEqual(['roti_canai']);
    expect(searchFoods('')).toHaveLength(10);
    expect(searchFoods('pizza')).toEqual([]);
  });
});

describe('image checks', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const gif = new TextEncoder().encode('GIF89a..');

  it('recognises JPG and PNG signatures only', () => {
    expect(sniffImageKind(jpeg)).toBe('jpeg');
    expect(sniffImageKind(png)).toBe('png');
    expect(sniffImageKind(gif)).toBeNull();
    expect(sniffImageKind(new Uint8Array())).toBeNull();
  });

  it('rejects empty, oversized and unsupported files', () => {
    expect(checkImage(jpeg, 0)).toMatchObject({ ok: false });
    expect(checkImage(jpeg, MAX_UPLOAD_BYTES + 1)).toMatchObject({ ok: false, message: expect.stringMatching(/10 MB/) });
    expect(checkImage(gif, 2048)).toMatchObject({ ok: false, message: expect.stringMatching(/JPG or PNG/) });
    expect(checkImage(png, 2048)).toEqual({ ok: true, kind: 'png' });
  });
});

describe('formatting', () => {
  it('formats energy and grams', () => {
    expect(formatKcal(2759.6)).toBe('2,760');
    expect(formatGrams(3.5)).toBe('3.5 g');
    expect(formatGrams(46.4)).toBe('46 g');
  });

  it('formats signed and compact values', () => {
    expect(formatSigned(-500)).toBe('−500');
    expect(formatSigned(300)).toBe('+300');
    expect(formatCompact(1500)).toBe('1.5K');
    expect(formatCompact(500)).toBe('500');
  });

  it('keeps every food lookup by id stable', () => {
    for (const food of FOODS) expect(findFood(food.id)).toBe(food);
  });
});

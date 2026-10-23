import { describe, expect, it } from 'vitest';
import { addDays, formatDayTitle, greeting, isDateKey, startOfWeek, toDateKey, weekDays } from './date';
import { CATEGORIES, FOODS, findFood, isVisible, SCAN_FOODS, searchFoods } from './foods';
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

  it('greets in Malay by time of day', () => {
    expect(greeting(new Date(2026, 9, 23, 8))).toBe('Selamat pagi');
    expect(greeting(new Date(2026, 9, 23, 13))).toBe('Selamat tengah hari');
    expect(greeting(new Date(2026, 9, 23, 17))).toBe('Selamat petang');
    expect(greeting(new Date(2026, 9, 23, 22))).toBe('Selamat malam');
  });

  it('names nearby days', () => {
    expect(formatDayTitle('2026-10-23', '2026-10-23')).toBe('Today');
    expect(formatDayTitle('2026-10-22', '2026-10-23')).toBe('Yesterday');
    expect(formatDayTitle('2026-10-20', '2026-10-23')).toMatch(/20/);
  });
});

describe('food database', () => {
  it('marks exactly the ten proposal classes as scan-ready', () => {
    expect(SCAN_FOODS.map((f) => f.id).sort()).toEqual(
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

  it('covers everyday Malaysian food beyond the scan classes', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(70);
    const categories = new Set(FOODS.map((f) => f.category));
    for (const c of CATEGORIES) expect(categories.has(c.id)).toBe(true);
    for (const food of FOODS) expect(food.serving.localLabel).toBeTruthy();
  });

  it('returns undefined for a class with no nutrition entry', () => {
    expect(findFood('kuih_bahulu')).toBeUndefined();
  });

  it('finds food by English, Malay and common names', () => {
    expect(searchFoods('nasi ayam')[0].id).toBe('chicken_rice');
    expect(searchFoods('  ROTI ')[0].id).toBe('roti_canai');
    expect(searchFoods('abc')[0].id).toBe('ais_kacang');
    expect(searchFoods('kopi o')[0].id).toBe('kopi_o');
    expect(searchFoods('teh').map((f) => f.id)).toEqual(expect.arrayContaining(['teh_tarik', 'teh_o', 'teh_o_ais_limau']));
    expect(searchFoods('')).toHaveLength(FOODS.length);
    expect(searchFoods('pizza')).toEqual([]);
  });

  it('can hide food that usually contains pork', () => {
    const pork = FOODS.filter((f) => !isVisible(f, true)).map((f) => f.id);
    expect(pork).toEqual(expect.arrayContaining(['bak_kut_teh', 'char_siu_pau']));
    expect(pork).not.toContain('nasi_lemak');
    expect(FOODS.every((f) => isVisible(f, false))).toBe(true);
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

describe('formatConfidence', () => {
  it('never shows a real score as 0%', async () => {
    const { formatConfidence } = await import('./format');
    expect(formatConfidence(0.873)).toBe('87%');
    expect(formatConfidence(0.003)).toBe('<1%');
    expect(formatConfidence(0)).toBe('0%');
  });
});

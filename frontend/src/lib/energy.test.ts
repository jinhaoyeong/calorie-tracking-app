import { describe, expect, it } from 'vitest';
import { bmi, bmiBand, calculateTarget, isCompleteProfile, macroTargets, restingEnergy, validateProfile } from './energy';
import type { Profile } from './types';

const male: Profile = {
  name: 'Hafiz',
  sex: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
  updatedAt: '2026-10-23T00:00:00.000Z',
};

const female: Profile = { ...male, sex: 'female', age: 25, heightCm: 165, weightKg: 60, activity: 'sedentary' };

describe('restingEnergy (Mifflin–St Jeor)', () => {
  it('uses +5 for men', () => {
    // 10×80 + 6.25×180 − 5×30 + 5
    expect(restingEnergy(male)).toBe(1780);
  });

  it('uses −161 for women', () => {
    // 10×60 + 6.25×165 − 5×25 − 161
    expect(restingEnergy(female)).toBeCloseTo(1345.25);
  });
});

describe('calculateTarget', () => {
  it('multiplies resting energy by the activity factor for maintenance', () => {
    const result = calculateTarget(male);
    expect(result.restingKcal).toBe(1780);
    expect(result.activityMultiplier).toBe(1.55);
    expect(result.maintenanceKcal).toBe(2759);
    expect(result.goalAdjustmentKcal).toBe(0);
    expect(result.targetKcal).toBe(2760);
    expect(result.minimumApplied).toBe(false);
  });

  it('applies the goal adjustment', () => {
    expect(calculateTarget({ ...male, goal: 'lose' }).targetKcal).toBe(2260);
    expect(calculateTarget({ ...male, goal: 'gain' }).targetKcal).toBe(3060);
  });

  it('never goes below the minimum target', () => {
    const result = calculateTarget({ ...female, goal: 'lose' });
    expect(result.maintenanceKcal).toBe(1614);
    expect(result.minimumApplied).toBe(true);
    expect(result.targetKcal).toBe(1200);
  });

  it('rises with activity level', () => {
    const levels = (['sedentary', 'light', 'moderate', 'very', 'extra'] as const).map(
      (activity) => calculateTarget({ ...male, activity }).targetKcal,
    );
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
    expect(new Set(levels).size).toBe(5);
  });
});

describe('macroTargets', () => {
  it('sets protein by body weight, fat by energy share and carbs from the remainder', () => {
    const macros = macroTargets(80, 2760);
    expect(macros.proteinG).toBe(128);
    expect(macros.fatG).toBe(77);
    expect(macros.carbohydrateG).toBe(389);
    const kcal = macros.proteinG * 4 + macros.fatG * 9 + macros.carbohydrateG * 4;
    expect(Math.abs(kcal - 2760)).toBeLessThanOrEqual(4);
  });

  it('never returns negative carbohydrate', () => {
    expect(macroTargets(250, 1200).carbohydrateG).toBe(0);
  });
});

describe('BMI with Asian cut-offs', () => {
  it('calculates kg/m²', () => {
    expect(bmi(165, 58)).toBe(21.3);
    expect(bmi(180, 80)).toBe(24.7);
  });

  it('uses the Malaysian CPG bands', () => {
    expect(bmiBand(18.4).band).toBe('underweight');
    expect(bmiBand(22.9).band).toBe('healthy');
    expect(bmiBand(23).band).toBe('overweight');
    expect(bmiBand(27.4).band).toBe('overweight');
    expect(bmiBand(27.5).band).toBe('obese');
  });
});

describe('validateProfile', () => {
  it('accepts a complete adult profile', () => {
    expect(validateProfile(male)).toEqual({});
    expect(isCompleteProfile(male)).toBe(true);
  });

  it('limits age to the 18–65 study population', () => {
    expect(validateProfile({ ...male, age: 17 }).age).toMatch(/18 and 65/);
    expect(validateProfile({ ...male, age: 66 }).age).toMatch(/18 and 65/);
    expect(validateProfile({ ...male, age: 65 }).age).toBeUndefined();
  });

  it('reports every missing field', () => {
    expect(Object.keys(validateProfile({})).sort()).toEqual(
      ['activity', 'age', 'goal', 'heightCm', 'sex', 'weightKg'].sort(),
    );
  });

  it('allows an empty name but not a very long one', () => {
    expect(isCompleteProfile({ ...male, name: '' })).toBe(true);
    expect(validateProfile({ ...male, name: 'x'.repeat(31) }).name).toBeDefined();
  });

  it('rejects implausible measurements', () => {
    expect(validateProfile({ ...male, heightCm: 80 }).heightCm).toBeDefined();
    expect(validateProfile({ ...male, weightKg: Number.NaN }).weightKg).toBeDefined();
  });
});

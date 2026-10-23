import type { ActivityLevel, Goal, Profile, Sex } from './types';

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; detail: string; multiplier: number }> = {
  sedentary: { label: 'Mostly sitting', detail: 'Desk job, little structured exercise', multiplier: 1.2 },
  light: { label: 'Light training', detail: '1–3 sessions a week', multiplier: 1.375 },
  moderate: { label: 'Regular training', detail: '3–5 sessions a week', multiplier: 1.55 },
  very: { label: 'Hard training', detail: '6–7 sessions a week', multiplier: 1.725 },
  extra: { label: 'Athlete', detail: 'Twice-a-day sessions or a physical job', multiplier: 1.9 },
};

export const ACTIVITY_ORDER: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];

export const GOALS: Record<Goal, { label: string; detail: string; adjustmentKcal: number }> = {
  lose: { label: 'Cut', detail: 'Lose fat, about 0.5 kg a week · −500 kcal', adjustmentKcal: -500 },
  maintain: { label: 'Maintain', detail: 'Hold weight and recomp · ±0 kcal', adjustmentKcal: 0 },
  gain: { label: 'Lean bulk', detail: 'Build muscle with a small surplus · +300 kcal', adjustmentKcal: 300 },
};

export const GOAL_ORDER: Goal[] = ['lose', 'maintain', 'gain'];

/** Daily targets are never set below these floors, a common safety margin for adults. */
export const MINIMUM_TARGET_KCAL: Record<Sex, number> = { male: 1500, female: 1200 };

export const PROFILE_LIMITS = {
  age: { min: 18, max: 65 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 250 },
} as const;

/** Protein per kg of body weight, within the range commonly advised for people who train. */
export const PROTEIN_G_PER_KG = 1.6;
export const FAT_SHARE_OF_ENERGY = 0.25;

type BodyMetrics = Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg'>;

/** Resting energy expenditure, Mifflin–St Jeor (1990). */
export function restingEnergy({ sex, age, heightCm, weightKg }: BodyMetrics): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (sex === 'male' ? 5 : -161);
}

export interface TargetBreakdown {
  restingKcal: number;
  activityMultiplier: number;
  maintenanceKcal: number;
  goalAdjustmentKcal: number;
  minimumKcal: number;
  /** True when the goal adjustment would have gone below the minimum target. */
  minimumApplied: boolean;
  targetKcal: number;
}

export function calculateTarget(profile: Profile): TargetBreakdown {
  const restingKcal = Math.round(restingEnergy(profile));
  const activityMultiplier = ACTIVITY_LEVELS[profile.activity].multiplier;
  const maintenanceKcal = Math.round(restingKcal * activityMultiplier);
  const goalAdjustmentKcal = GOALS[profile.goal].adjustmentKcal;
  const minimumKcal = MINIMUM_TARGET_KCAL[profile.sex];
  const adjusted = maintenanceKcal + goalAdjustmentKcal;
  const minimumApplied = adjusted < minimumKcal;
  // Rounded to the nearest 10 kcal; finer precision would overstate the estimate.
  const targetKcal = Math.round(Math.max(adjusted, minimumKcal) / 10) * 10;
  return {
    restingKcal,
    activityMultiplier,
    maintenanceKcal,
    goalAdjustmentKcal,
    minimumKcal,
    minimumApplied,
    targetKcal,
  };
}

export interface MacroTargets {
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
}

export function macroTargets(weightKg: number, targetKcal: number): MacroTargets {
  const proteinG = Math.round(PROTEIN_G_PER_KG * weightKg);
  const fatG = Math.round((targetKcal * FAT_SHARE_OF_ENERGY) / 9);
  const carbohydrateG = Math.max(0, Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4));
  return { carbohydrateG, proteinG, fatG };
}

/** Body mass index, kg/m². */
export function bmi(heightCm: number, weightKg: number): number {
  const metres = heightCm / 100;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
}

export type BmiBand = 'underweight' | 'healthy' | 'overweight' | 'obese';

/**
 * Asian cut-offs used by the Malaysian Clinical Practice Guidelines on obesity:
 * overweight from 23.0 and obese from 27.5, lower than the WHO international bands.
 */
export function bmiBand(value: number): { band: BmiBand; label: string; range: string } {
  if (value < 18.5) return { band: 'underweight', label: 'Underweight', range: 'below 18.5' };
  if (value < 23) return { band: 'healthy', label: 'Healthy', range: '18.5–22.9' };
  if (value < 27.5) return { band: 'overweight', label: 'Overweight', range: '23.0–27.4' };
  return { band: 'obese', label: 'Obese', range: '27.5 and above' };
}

export const NAME_MAX_LENGTH = 30;

export type ProfileDraft = Partial<Omit<Profile, 'updatedAt'>>;
export type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;

export function validateProfile(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};
  if (draft.name !== undefined && draft.name.trim().length > NAME_MAX_LENGTH) {
    errors.name = `Keep it under ${NAME_MAX_LENGTH} characters.`;
  }
  if (!draft.sex) errors.sex = 'Choose one to continue.';
  const ranges: [keyof typeof PROFILE_LIMITS, string, string][] = [
    ['age', 'Age', 'years'],
    ['heightCm', 'Height', 'cm'],
    ['weightKg', 'Weight', 'kg'],
  ];
  for (const [key, label, unit] of ranges) {
    const value = draft[key];
    const { min, max } = PROFILE_LIMITS[key];
    if (value === undefined || !Number.isFinite(value)) {
      errors[key] = `Enter your ${label.toLowerCase()}.`;
    } else if (value < min || value > max) {
      errors[key] = `${label} must be between ${min} and ${max} ${unit}.`;
    }
  }
  if (!draft.activity) errors.activity = 'Choose an activity level.';
  if (!draft.goal) errors.goal = 'Choose a goal.';
  return errors;
}

export function isCompleteProfile(draft: ProfileDraft): draft is Omit<Profile, 'updatedAt'> {
  return typeof draft.name === 'string' && Object.keys(validateProfile(draft)).length === 0;
}

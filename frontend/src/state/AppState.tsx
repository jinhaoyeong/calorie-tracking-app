import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { calculateTarget, isCompleteProfile, macroTargets, type MacroTargets, type TargetBreakdown } from '../lib/energy';
import { FOODS, findFood } from '../lib/foods';
import { readJson, removeKey, writeJson } from '../lib/storage';
import type { DiaryEntry, Food, MealType, Preferences, Profile } from '../lib/types';

/** Everything stays on this device; only photos to classify are sent to the server. */
const STORAGE_KEYS = {
  profile: 'pinggan.profile.v1',
  entries: 'pinggan.entries.v1',
  preferences: 'pinggan.preferences.v1',
  customFoods: 'pinggan.custom-foods.v1',
} as const;

/** Meal photos are kept only for the most recent entries so local storage stays small. */
export const MAX_SAVED_PHOTOS = 60;

export const DEFAULT_PREFERENCES: Preferences = { halalOnly: false, savePhotos: true };

interface State {
  profile: Profile | null;
  entries: DiaryEntry[];
  preferences: Preferences;
  customFoods: Food[];
}

type Action =
  | { type: 'setProfile'; profile: Profile }
  | { type: 'addEntry'; entry: DiaryEntry }
  | { type: 'updateEntry'; entry: DiaryEntry }
  | { type: 'removeEntry'; id: string }
  | { type: 'setPreferences'; preferences: Preferences }
  | { type: 'addCustomFood'; food: Food }
  | { type: 'removeCustomFood'; id: string }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setProfile':
      return { ...state, profile: action.profile };
    case 'addEntry':
      return { ...state, entries: [...state.entries, action.entry] };
    case 'updateEntry':
      return { ...state, entries: state.entries.map((e) => (e.id === action.entry.id ? action.entry : e)) };
    case 'removeEntry':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };
    case 'setPreferences':
      return { ...state, preferences: action.preferences };
    case 'addCustomFood':
      return { ...state, customFoods: [...state.customFoods, action.food] };
    case 'removeCustomFood':
      return { ...state, customFoods: state.customFoods.filter((f) => f.id !== action.id) };
    case 'reset':
      return { profile: null, entries: [], preferences: DEFAULT_PREFERENCES, customFoods: [] };
  }
}

const LEGACY_MEALS: Record<string, MealType> = { snack: 'teatime' };

/** Accepts entries saved by earlier versions of the app and fills in fields added since. */
export function migrateEntry(value: unknown): DiaryEntry | null {
  const entry = value as Partial<DiaryEntry> & { meal?: string };
  if (
    typeof entry?.id !== 'string' ||
    typeof entry.date !== 'string' ||
    typeof entry.energyKcal !== 'number' ||
    typeof entry.servings !== 'number' ||
    typeof entry.perServing?.energyKcal !== 'number'
  ) {
    return null;
  }
  const meal = (LEGACY_MEALS[entry.meal ?? ''] ?? entry.meal) as MealType;
  return {
    ...(entry as DiaryEntry),
    meal,
    addons: Array.isArray(entry.addons) ? entry.addons : [],
    category: entry.category ?? findFood(entry.foodId ?? '')?.category ?? 'custom',
  };
}

function loadInitialState(): State {
  const profile = readJson<Profile | null>(STORAGE_KEYS.profile, null);
  const entries = readJson<unknown>(STORAGE_KEYS.entries, []);
  const preferences = readJson<Partial<Preferences>>(STORAGE_KEYS.preferences, {});
  const customFoods = readJson<unknown>(STORAGE_KEYS.customFoods, []);
  const migratedProfile = profile ? { ...profile, name: profile.name ?? '' } : null;
  return {
    profile: migratedProfile && isCompleteProfile(migratedProfile) ? migratedProfile : null,
    entries: Array.isArray(entries) ? entries.map(migrateEntry).filter((e): e is DiaryEntry => e !== null) : [],
    preferences: { ...DEFAULT_PREFERENCES, ...preferences },
    customFoods: Array.isArray(customFoods) ? (customFoods as Food[]).filter((f) => typeof f?.id === 'string' && f.custom) : [],
  };
}

/** Drops photos from all but the newest entries before saving. */
export function trimPhotos(entries: DiaryEntry[], keep = MAX_SAVED_PHOTOS): DiaryEntry[] {
  const withPhotos = entries
    .filter((e) => e.photo)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
    .slice(0, keep)
    .map((e) => e.id);
  const allowed = new Set(withPhotos);
  return entries.map((e) => {
    if (!e.photo || allowed.has(e.id)) return e;
    const withoutPhoto = { ...e };
    delete withoutPhoto.photo;
    return withoutPhoto;
  });
}

interface AppContextValue extends State {
  target: TargetBreakdown | null;
  macros: MacroTargets | null;
  /** Built-in foods followed by the user's own foods. */
  allFoods: Food[];
  saveProfile: (profile: Omit<Profile, 'updatedAt'>) => void;
  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (entry: DiaryEntry) => void;
  removeEntry: (id: string) => void;
  setPreferences: (preferences: Preferences) => void;
  addCustomFood: (food: Food) => void;
  removeCustomFood: (id: string) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    if (state.profile) writeJson(STORAGE_KEYS.profile, state.profile);
    else removeKey(STORAGE_KEYS.profile);
  }, [state.profile]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.entries, trimPhotos(state.entries));
  }, [state.entries]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.preferences, state.preferences);
  }, [state.preferences]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.customFoods, state.customFoods);
  }, [state.customFoods]);

  const value = useMemo<AppContextValue>(() => {
    const target = state.profile ? calculateTarget(state.profile) : null;
    return {
      ...state,
      target,
      macros: state.profile && target ? macroTargets(state.profile.weightKg, target.targetKcal) : null,
      allFoods: [...FOODS, ...state.customFoods],
      saveProfile: (profile) =>
        dispatch({ type: 'setProfile', profile: { ...profile, updatedAt: new Date().toISOString() } }),
      addEntry: (entry) => dispatch({ type: 'addEntry', entry }),
      updateEntry: (entry) => dispatch({ type: 'updateEntry', entry }),
      removeEntry: (id) => dispatch({ type: 'removeEntry', id }),
      setPreferences: (preferences) => dispatch({ type: 'setPreferences', preferences }),
      addCustomFood: (food) => dispatch({ type: 'addCustomFood', food }),
      removeCustomFood: (id) => dispatch({ type: 'removeCustomFood', id }),
      resetAll: () => dispatch({ type: 'reset' }),
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppStateProvider');
  return value;
}

/** For screens that only render after onboarding, where a profile and target always exist. */
export function useProfile() {
  const app = useApp();
  if (!app.profile || !app.target || !app.macros) throw new Error('Profile required');
  return { ...app, profile: app.profile, target: app.target, macros: app.macros };
}

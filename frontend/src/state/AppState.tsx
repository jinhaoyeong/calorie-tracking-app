import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { calculateTarget, isCompleteProfile, macroTargets, type MacroTargets, type TargetBreakdown } from '../lib/energy';
import { readJson, removeKey, writeJson } from '../lib/storage';
import type { DiaryEntry, Profile } from '../lib/types';

/** Profile and diary stay on this device; nothing is sent to the server except photos to classify. */
const STORAGE_KEYS = {
  profile: 'pinggan.profile.v1',
  entries: 'pinggan.entries.v1',
} as const;

interface State {
  profile: Profile | null;
  entries: DiaryEntry[];
}

type Action =
  | { type: 'setProfile'; profile: Profile }
  | { type: 'addEntry'; entry: DiaryEntry }
  | { type: 'updateEntry'; entry: DiaryEntry }
  | { type: 'removeEntry'; id: string }
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
    case 'reset':
      return { profile: null, entries: [] };
  }
}

function isEntry(value: unknown): value is DiaryEntry {
  const entry = value as DiaryEntry;
  return (
    typeof entry?.id === 'string' &&
    typeof entry.date === 'string' &&
    typeof entry.energyKcal === 'number' &&
    typeof entry.servings === 'number' &&
    typeof entry.perServing?.energyKcal === 'number'
  );
}

function loadInitialState(): State {
  const profile = readJson<Profile | null>(STORAGE_KEYS.profile, null);
  const entries = readJson<unknown>(STORAGE_KEYS.entries, []);
  return {
    profile: profile && isCompleteProfile(profile) ? profile : null,
    entries: Array.isArray(entries) ? entries.filter(isEntry) : [],
  };
}

interface AppContextValue extends State {
  target: TargetBreakdown | null;
  macros: MacroTargets | null;
  saveProfile: (profile: Omit<Profile, 'updatedAt'>) => void;
  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (entry: DiaryEntry) => void;
  removeEntry: (id: string) => void;
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
    writeJson(STORAGE_KEYS.entries, state.entries);
  }, [state.entries]);

  const value = useMemo<AppContextValue>(() => {
    const target = state.profile ? calculateTarget(state.profile) : null;
    return {
      ...state,
      target,
      macros: state.profile && target ? macroTargets(state.profile.weightKg, target.targetKcal) : null,
      saveProfile: (profile) =>
        dispatch({ type: 'setProfile', profile: { ...profile, updatedAt: new Date().toISOString() } }),
      addEntry: (entry) => dispatch({ type: 'addEntry', entry }),
      updateEntry: (entry) => dispatch({ type: 'updateEntry', entry }),
      removeEntry: (id) => dispatch({ type: 'removeEntry', id }),
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

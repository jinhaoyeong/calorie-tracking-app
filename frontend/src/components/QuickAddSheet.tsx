import { useState } from 'react';
import { createQuickEntry, MEAL_LABEL, QUICK_ADD_LIMIT } from '../lib/diary';
import type { MealType } from '../lib/types';
import { useProfile } from '../state/AppState';
import { useToast } from '../state/Toast';
import { BottomSheet } from './BottomSheet';
import { MealPicker } from './Controls';
import { Field } from './ProfileFields';

interface Props {
  date: string;
  initialMeal: MealType;
  onClose: () => void;
  onAdded?: () => void;
}

/** Calories only, for home cooking or a stall dish that isn't in the list. */
export function QuickAddSheet({ date, initialMeal, onClose, onAdded }: Props) {
  const { addEntry, removeEntry } = useProfile();
  const toast = useToast();
  const [kcal, setKcal] = useState('');
  const [name, setName] = useState('');
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [error, setError] = useState<string>();

  const save = () => {
    const value = Number(kcal.replace(',', '.'));
    if (!kcal.trim() || !Number.isFinite(value) || value < QUICK_ADD_LIMIT.min || value > QUICK_ADD_LIMIT.max) {
      setError(`Enter between ${QUICK_ADD_LIMIT.min} and ${QUICK_ADD_LIMIT.max.toLocaleString('en-MY')} kcal.`);
      return;
    }
    const entry = createQuickEntry({ kcal: value, name, meal, date });
    addEntry(entry);
    toast({
      message: `${entry.energyKcal} kcal added to ${MEAL_LABEL[meal].toLowerCase()}`,
      action: { label: 'Undo', onClick: () => removeEntry(entry.id) },
    });
    onClose();
    onAdded?.();
  };

  return (
    <BottomSheet
      title="Quick add"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary" onClick={save}>
          Add calories
        </button>
      }
    >
      <p className="sheet-lede">For home cooking or a dish that isn’t in the list. Only calories are counted.</p>
      <Field
        id="quick-kcal"
        label="Calories"
        unit="kcal"
        value={kcal}
        onChange={(value) => {
          setKcal(value);
          setError(undefined);
        }}
        error={error}
        placeholder="e.g. 350"
      />
      <Field id="quick-name" label="What was it? (optional)" value={name} onChange={setName} text placeholder="e.g. Masak lemak cili api" />
      <h3 className="sheet-label">Meal</h3>
      <MealPicker value={meal} onChange={setMeal} />
    </BottomSheet>
  );
}

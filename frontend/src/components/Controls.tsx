import { MEALS, SERVINGS } from '../lib/diary';
import type { MealType } from '../lib/types';
import { Icon } from './Icon';
import './Controls.css';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export function ServingStepper({ value, onChange, label }: StepperProps) {
  const set = (next: number) => onChange(Math.min(SERVINGS.max, Math.max(SERVINGS.min, next)));
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__button"
        onClick={() => set(value - SERVINGS.step)}
        disabled={value <= SERVINGS.min}
        aria-label="Fewer servings"
      >
        <Icon name="minus" size={20} strokeWidth={2} />
      </button>
      <output className="stepper__value num" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="stepper__button"
        onClick={() => set(value + SERVINGS.step)}
        disabled={value >= SERVINGS.max}
        aria-label="More servings"
      >
        <Icon name="plus" size={20} strokeWidth={2} />
      </button>
    </div>
  );
}

interface MealPickerProps {
  value: MealType;
  onChange: (meal: MealType) => void;
}

export function MealPicker({ value, onChange }: MealPickerProps) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Meal">
      {MEALS.map((meal) => (
        <button
          key={meal.id}
          type="button"
          role="radio"
          aria-checked={value === meal.id}
          className="segmented__option"
          onClick={() => onChange(meal.id)}
        >
          {meal.label}
        </button>
      ))}
    </div>
  );
}

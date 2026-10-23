import { Minus, Plus } from '@phosphor-icons/react';
import { MEALS, SERVINGS } from '../lib/diary';
import type { MealType } from '../lib/types';
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
        aria-label="Less"
      >
        <Minus size={18} weight="bold" />
      </button>
      <output className="stepper__value num" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="stepper__button"
        onClick={() => set(value + SERVINGS.step)}
        disabled={value >= SERVINGS.max}
        aria-label="More"
      >
        <Plus size={18} weight="bold" />
      </button>
    </div>
  );
}

export function MealPicker({ value, onChange }: { value: MealType; onChange: (meal: MealType) => void }) {
  return (
    <div className="chips chips--scroll" role="radiogroup" aria-label="Meal">
      {MEALS.map((meal) => (
        <button
          key={meal.id}
          type="button"
          role="radio"
          aria-checked={value === meal.id}
          className="chip"
          onClick={() => onChange(meal.id)}
        >
          {meal.label}
        </button>
      ))}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className="segmented__option"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch__thumb" />
    </button>
  );
}

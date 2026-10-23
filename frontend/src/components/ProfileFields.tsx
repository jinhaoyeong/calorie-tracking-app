import type { ReactNode } from 'react';
import { ACTIVITY_LEVELS, ACTIVITY_ORDER, GOAL_ORDER, GOALS, type ProfileDraft } from '../lib/energy';
import type { ActivityLevel, Goal, Sex } from '../lib/types';

/** Text inputs keep the raw string so partially typed values (e.g. "1.") aren't rewritten. */
export interface ProfileForm {
  sex?: Sex;
  age: string;
  heightCm: string;
  weightKg: string;
  activity?: ActivityLevel;
  goal?: Goal;
}

export function toDraft(form: ProfileForm): ProfileDraft {
  const parse = (value: string) => (value.trim() === '' ? undefined : Number(value.replace(',', '.')));
  return {
    sex: form.sex,
    age: parse(form.age),
    heightCm: parse(form.heightCm),
    weightKg: parse(form.weightKg),
    activity: form.activity,
    goal: form.goal,
  };
}

interface OptionProps {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail?: string;
}

function Option({ checked, onSelect, title, detail }: OptionProps) {
  return (
    <button type="button" role="radio" aria-checked={checked} className="option" onClick={onSelect}>
      <span className="option__text">
        <span className="option__title">{title}</span>
        {detail && <span className="option__detail">{detail}</span>}
      </span>
      <span className="option__radio" aria-hidden="true" />
    </button>
  );
}

export function SexChoice({ value, onChange }: { value?: Sex; onChange: (sex: Sex) => void }) {
  return (
    <div className="options options--pair" role="radiogroup" aria-label="Sex">
      <Option checked={value === 'female'} onSelect={() => onChange('female')} title="Female" />
      <Option checked={value === 'male'} onSelect={() => onChange('male')} title="Male" />
    </div>
  );
}

export function ActivityChoice({ value, onChange }: { value?: ActivityLevel; onChange: (level: ActivityLevel) => void }) {
  return (
    <div className="options" role="radiogroup" aria-label="Activity level">
      {ACTIVITY_ORDER.map((level) => (
        <Option
          key={level}
          checked={value === level}
          onSelect={() => onChange(level)}
          title={ACTIVITY_LEVELS[level].label}
          detail={ACTIVITY_LEVELS[level].detail}
        />
      ))}
    </div>
  );
}

export function GoalChoice({ value, onChange }: { value?: Goal; onChange: (goal: Goal) => void }) {
  return (
    <div className="options" role="radiogroup" aria-label="Goal">
      {GOAL_ORDER.map((goal) => (
        <Option
          key={goal}
          checked={value === goal}
          onSelect={() => onChange(goal)}
          title={GOALS[goal].label}
          detail={GOALS[goal].detail}
        />
      ))}
    </div>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  decimal?: boolean;
  hint?: ReactNode;
}

export function NumberField({ id, label, unit, value, onChange, error, decimal, hint }: NumberFieldProps) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        <input
          id={id}
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d.,]/g, ''))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="field__unit">{unit}</span>
      </div>
      {error ? (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : (
        hint
      )}
    </div>
  );
}

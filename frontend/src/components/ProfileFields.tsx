import {
  Armchair,
  Barbell,
  CheckCircle,
  Equals,
  GenderFemale,
  GenderMale,
  Lightning,
  PersonSimpleRun,
  PersonSimpleWalk,
  TrendDown,
  TrendUp,
  type Icon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ACTIVITY_LEVELS, ACTIVITY_ORDER, GOAL_ORDER, GOALS, type ProfileDraft } from '../lib/energy';
import type { ActivityLevel, Goal, Sex } from '../lib/types';

/** Text inputs keep the raw string so partially typed values (e.g. "1.") aren't rewritten. */
export interface ProfileForm {
  name: string;
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
    name: form.name.trim(),
    sex: form.sex,
    age: parse(form.age),
    heightCm: parse(form.heightCm),
    weightKg: parse(form.weightKg),
    activity: form.activity,
    goal: form.goal,
  };
}

const ACTIVITY_ICON: Record<ActivityLevel, Icon> = {
  sedentary: Armchair,
  light: PersonSimpleWalk,
  moderate: PersonSimpleRun,
  very: Barbell,
  extra: Lightning,
};

const GOAL_ICON: Record<Goal, Icon> = { lose: TrendDown, maintain: Equals, gain: TrendUp };

interface OptionProps {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail?: string;
  icon: Icon;
}

function Option({ checked, onSelect, title, detail, icon: OptionIcon }: OptionProps) {
  return (
    <button type="button" role="radio" aria-checked={checked} className="option" onClick={onSelect}>
      <span className="option__icon">
        <OptionIcon size={24} weight={checked ? 'fill' : 'regular'} />
      </span>
      <span className="option__text">
        <span className="option__title">{title}</span>
        {detail && <span className="option__detail">{detail}</span>}
      </span>
      {checked && <CheckCircle size={24} weight="fill" className="option__check" />}
    </button>
  );
}

export function SexChoice({ value, onChange }: { value?: Sex; onChange: (sex: Sex) => void }) {
  return (
    <div className="options options--pair" role="radiogroup" aria-label="Sex">
      <Option checked={value === 'female'} onSelect={() => onChange('female')} title="Female" icon={GenderFemale} />
      <Option checked={value === 'male'} onSelect={() => onChange('male')} title="Male" icon={GenderMale} />
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
          icon={ACTIVITY_ICON[level]}
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
          icon={GOAL_ICON[goal]}
        />
      ))}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  unit?: string;
  decimal?: boolean;
  text?: boolean;
  placeholder?: string;
}

export function Field({ id, label, unit, value, onChange, error, decimal, text, hint, placeholder }: FieldProps) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        <input
          id={id}
          type="text"
          inputMode={text ? 'text' : decimal ? 'decimal' : 'numeric'}
          autoComplete={text ? 'given-name' : 'off'}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(text ? event.target.value : event.target.value.replace(/[^\d.,]/g, ''))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {unit && <span className="field__unit">{unit}</span>}
      </div>
      {error ? (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
}

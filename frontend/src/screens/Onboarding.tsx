import { CaretLeft, ShieldCheck } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FoodArt } from '../art/FoodArt';
import { ActivityChoice, Field, GoalChoice, SexChoice, toDraft, type ProfileForm } from '../components/ProfileFields';
import { TargetBreakdown } from '../components/TargetBreakdown';
import {
  bmi,
  bmiBand,
  calculateTarget,
  isCompleteProfile,
  macroTargets,
  validateProfile,
  type ProfileErrors,
} from '../lib/energy';
import { FOODS } from '../lib/foods';
import { formatKcal } from '../lib/format';
import type { FoodCategory } from '../lib/types';
import { useApp } from '../state/AppState';
import './Onboarding.css';

const STEPS = ['name', 'about', 'body', 'activity', 'goal', 'target'] as const;
type Step = (typeof STEPS)[number];

const STEP_FIELDS: Record<Step, (keyof ProfileErrors)[]> = {
  name: ['name'],
  about: ['sex', 'age'],
  body: ['heightCm', 'weightKg'],
  activity: ['activity'],
  goal: ['goal'],
  target: [],
};

/** Collage on the welcome screen: [food, category, size, x%, y%, rotation]. */
const COLLAGE: [string, FoodCategory, number, number, number, number][] = [
  ['nasi_lemak', 'rice', 150, 50, 34, -6],
  ['roti_canai', 'bread', 104, 14, 14, 8],
  ['teh_tarik', 'drinks', 86, 86, 12, -10],
  ['satay', 'mains', 108, 86, 60, 12],
  ['laksa', 'noodles', 112, 13, 64, -8],
  ['kuih_lapis', 'kuih', 76, 38, 78, 10],
  ['cendol', 'dessert', 84, 64, 82, -6],
];

export function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile } = useApp();
  const [stepIndex, setStepIndex] = useState(-1);
  const [form, setForm] = useState<ProfileForm>({ name: '', age: '', heightCm: '', weightKg: '' });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [acknowledged, setAcknowledged] = useState(false);

  const update = (patch: Partial<ProfileForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key as keyof ProfileErrors];
      return next;
    });
  };

  if (stepIndex < 0) {
    return (
      <main className="welcome">
        <div className="welcome__collage" aria-hidden="true">
          {COLLAGE.map(([id, category, size, x, y, rotate]) => (
            <span key={id} className="welcome__food" style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotate}deg)` }}>
              <FoodArt foodId={id} category={category} size={size} tile={false} />
            </span>
          ))}
        </div>
        <div className="welcome__content">
          <div className="welcome__brand">
            <img src="/icon.svg" alt="" width={36} height={36} />
            <span>Pinggan</span>
          </div>
          <h1 className="welcome__headline">Kira kalori, cara Malaysia.</h1>
          <p className="welcome__lede">
            Snap your nasi lemak, roti canai or teh tarik and see how it fits into your day. {FOODS.length} local foods,
            kurang manis included.
          </p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setStepIndex(0)}>
            Get started
          </button>
          <p className="welcome__privacy">
            <ShieldCheck size={16} weight="fill" /> Your details stay on this phone
          </p>
        </div>
      </main>
    );
  }

  const step = STEPS[stepIndex];
  const draft = toDraft(form);

  const next = () => {
    const stepErrors = validateProfile(draft);
    const relevant: ProfileErrors = {};
    for (const key of STEP_FIELDS[step]) if (stepErrors[key]) relevant[key] = stepErrors[key];
    setErrors(relevant);
    if (Object.keys(relevant).length === 0) setStepIndex(stepIndex + 1);
  };

  const finish = () => {
    if (!isCompleteProfile(draft)) return;
    saveProfile(draft);
    navigate('/', { replace: true });
  };

  const previewProfile = isCompleteProfile(draft) ? { ...draft, updatedAt: '' } : null;
  const previewTarget = previewProfile ? calculateTarget(previewProfile) : null;
  const liveBmi = draft.heightCm && draft.weightKg && draft.heightCm >= 120 && draft.weightKg >= 30 ? bmi(draft.heightCm, draft.weightKg) : null;

  return (
    <main className="screen screen--cta onboarding">
      <div className="topbar">
        <button type="button" className="round-button" onClick={() => setStepIndex(stepIndex - 1)} aria-label="Back">
          <CaretLeft size={20} weight="bold" />
        </button>
        <div className="onboarding__progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIndex + 1}>
          <span style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className="onboarding__count num">
          {stepIndex + 1}/{STEPS.length}
        </span>
      </div>

      {step === 'name' && (
        <>
          <h1 className="onboarding__title">Hai! What should we call you?</h1>
          <p className="onboarding__lede">We’ll use it to greet you. You can leave it blank.</p>
          <div className="onboarding__fields">
            <Field id="name" label="Name" value={form.name} onChange={(name) => update({ name })} error={errors.name} text placeholder="e.g. Aina" />
          </div>
        </>
      )}

      {step === 'about' && (
        <>
          <h1 className="onboarding__title">About you</h1>
          <p className="onboarding__lede">Sex and age are part of the resting energy formula.</p>
          <div className="onboarding__fields">
            <SexChoice value={form.sex} onChange={(sex) => update({ sex })} />
            {errors.sex && <p className="field__error onboarding__error">{errors.sex}</p>}
            <div className="onboarding__gap" />
            <Field id="age" label="Age" unit="years" value={form.age} onChange={(age) => update({ age })} error={errors.age} />
          </div>
        </>
      )}

      {step === 'body' && (
        <>
          <h1 className="onboarding__title">Height and weight</h1>
          <p className="onboarding__lede">Use your current weight. You can update it any time.</p>
          <div className="onboarding__fields">
            <Field id="height" label="Height" unit="cm" value={form.heightCm} onChange={(heightCm) => update({ heightCm })} error={errors.heightCm} decimal />
            <Field id="weight" label="Weight" unit="kg" value={form.weightKg} onChange={(weightKg) => update({ weightKg })} error={errors.weightKg} decimal />
            {liveBmi !== null && (
              <div className={`onboarding__bmi onboarding__bmi--${bmiBand(liveBmi).band}`}>
                <span>BMI</span>
                <strong className="num">{liveBmi}</strong>
                <em>{bmiBand(liveBmi).label}</em>
                <small>Asian cut-offs</small>
              </div>
            )}
          </div>
        </>
      )}

      {step === 'activity' && (
        <>
          <h1 className="onboarding__title">How active are you?</h1>
          <p className="onboarding__lede">Think about a usual week, including training and your job.</p>
          <div className="onboarding__fields">
            <ActivityChoice value={form.activity} onChange={(activity) => update({ activity })} />
            {errors.activity && <p className="field__error onboarding__error">{errors.activity}</p>}
          </div>
        </>
      )}

      {step === 'goal' && (
        <>
          <h1 className="onboarding__title">What’s your goal?</h1>
          <p className="onboarding__lede">This moves your target up or down from maintenance.</p>
          <div className="onboarding__fields">
            <GoalChoice value={form.goal} onChange={(goal) => update({ goal })} />
            {errors.goal && <p className="field__error onboarding__error">{errors.goal}</p>}
          </div>
        </>
      )}

      {step === 'target' && previewProfile && previewTarget && (
        <>
          <div className="onboarding__result">
            <p className="onboarding__result-label">{form.name.trim() ? `${form.name.trim()}, your` : 'Your'} daily target</p>
            <p className="onboarding__result-value num">
              {formatKcal(previewTarget.targetKcal)}
              <span>kcal</span>
            </p>
            <p className="onboarding__result-hint">
              About {Math.round(previewTarget.targetKcal / 389)} plates of nasi lemak, if that’s all you ate.
            </p>
          </div>
          <div className="card">
            <TargetBreakdown profile={previewProfile} target={previewTarget} macros={macroTargets(previewProfile.weightKg, previewTarget.targetKcal)} />
          </div>
          <label className="onboarding__ack">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            <span>I understand this is an estimate for general guidance, not medical or dietary advice.</span>
          </label>
        </>
      )}

      <div className="cta-bar">
        {step === 'target' ? (
          <button type="button" className="btn btn--primary" onClick={finish} disabled={!acknowledged}>
            Start tracking
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={next}>
            {step === 'name' && !form.name.trim() ? 'Skip' : 'Continue'}
          </button>
        )}
      </div>
    </main>
  );
}

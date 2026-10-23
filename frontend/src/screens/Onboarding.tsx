import { CaretLeft, ShieldCheck } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeInstall } from '../components/InstallApp';
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
import { FOODS, SCAN_FOODS } from '../lib/foods';
import { formatKcal } from '../lib/format';
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

/** Product visual for the welcome screen: calorie and macro rings as they appear in the app. */
function RingsVisual() {
  const rings = [
    { r: 104, value: 0.72, color: 'var(--accent)' },
    { r: 84, value: 0.86, color: 'var(--protein)' },
    { r: 64, value: 0.58, color: 'var(--carbs)' },
    { r: 44, value: 0.47, color: 'var(--fat)' },
  ];
  return (
    <svg className="welcome__rings" viewBox="0 0 240 240" aria-hidden="true">
      {rings.map(({ r, value, color }) => {
        const c = 2 * Math.PI * r;
        return (
          <g key={r}>
            <circle cx="120" cy="120" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
            <circle
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${c * value} ${c}`}
              transform="rotate(-90 120 120)"
            />
          </g>
        );
      })}
    </svg>
  );
}

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
        <div className="welcome__brand">
          <img src="/icon.svg" alt="" width={32} height={32} />
          <span>Pinggan</span>
        </div>
        <div className="welcome__visual">
          <RingsVisual />
          <dl className="welcome__legend">
            <div>
              <dt>
                <span className="welcome__key welcome__key--kcal" /> Calories
              </dt>
              <dd className="display">1,512 left</dd>
            </div>
            <div>
              <dt>
                <span className="welcome__key welcome__key--protein" /> Protein
              </dt>
              <dd className="display">104 / 120 g</dd>
            </div>
          </dl>
        </div>
        <div className="welcome__content">
          <p className="eyebrow">Calorie & macro tracking · Malaysia</p>
          <h1 className="welcome__headline">Fuel your training.</h1>
          <p className="welcome__lede">
            Scan your nasi lemak or roti canai, hit your protein and stay on target, with nutrition data for {FOODS.length}{' '}
            Malaysian foods and drinks.
          </p>
          <ul className="welcome__facts">
            <li>
              <strong className="display">{FOODS.length}</strong>
              <span>Local foods</span>
            </li>
            <li>
              <strong className="display">{SCAN_FOODS.length}</strong>
              <span>Dishes by camera</span>
            </li>
            <li>
              <strong className="display">P·C·F</strong>
              <span>Macro targets</span>
            </li>
          </ul>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setStepIndex(0)}>
            Get started
          </button>
          <WelcomeInstall />
          <p className="welcome__privacy">
            <ShieldCheck size={14} weight="fill" /> Your data stays on this device
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
        <button type="button" className="icon-button" onClick={() => setStepIndex(stepIndex - 1)} aria-label="Back">
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
          <h1 className="onboarding__title">What should we call you?</h1>
          <p className="onboarding__lede">Used to personalise the app. Optional.</p>
          <div className="onboarding__fields">
            <Field id="name" label="Name" value={form.name} onChange={(name) => update({ name })} error={errors.name} text placeholder="e.g. Aina" />
          </div>
        </>
      )}

      {step === 'about' && (
        <>
          <h1 className="onboarding__title">About you</h1>
          <p className="onboarding__lede">Sex and age feed the resting energy equation.</p>
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
          <h1 className="onboarding__title">Training load</h1>
          <p className="onboarding__lede">Pick what a normal week looks like, including your job.</p>
          <div className="onboarding__fields">
            <ActivityChoice value={form.activity} onChange={(activity) => update({ activity })} />
            {errors.activity && <p className="field__error onboarding__error">{errors.activity}</p>}
          </div>
        </>
      )}

      {step === 'goal' && (
        <>
          <h1 className="onboarding__title">Your goal</h1>
          <p className="onboarding__lede">Sets your calorie target relative to maintenance.</p>
          <div className="onboarding__fields">
            <GoalChoice value={form.goal} onChange={(goal) => update({ goal })} />
            {errors.goal && <p className="field__error onboarding__error">{errors.goal}</p>}
          </div>
        </>
      )}

      {step === 'target' && previewProfile && previewTarget && (
        <>
          <div className="onboarding__result">
            <p className="eyebrow">Daily target</p>
            <p className="onboarding__result-value display">
              {formatKcal(previewTarget.targetKcal)}
              <span>kcal</span>
            </p>
          </div>
          <div className="card">
            <TargetBreakdown profile={previewProfile} target={previewTarget} macros={macroTargets(previewProfile.weightKg, previewTarget.targetKcal)} />
          </div>
          <label className="onboarding__ack">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            <span>I understand these targets are estimates for general guidance, not medical or dietary advice.</span>
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

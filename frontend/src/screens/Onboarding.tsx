import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FoodGlyph } from '../components/FoodGlyph';
import { Icon, type IconName } from '../components/Icon';
import {
  ActivityChoice,
  GoalChoice,
  NumberField,
  SexChoice,
  toDraft,
  type ProfileForm,
} from '../components/ProfileFields';
import { TargetBreakdown } from '../components/TargetBreakdown';
import { calculateTarget, isCompleteProfile, macroTargets, validateProfile, type ProfileErrors } from '../lib/energy';
import { formatKcal } from '../lib/format';
import { useApp } from '../state/AppState';
import './Onboarding.css';

const STEPS = ['about', 'body', 'activity', 'goal', 'target'] as const;
type Step = (typeof STEPS)[number];

const STEP_FIELDS: Record<Step, (keyof ProfileErrors)[]> = {
  about: ['sex', 'age'],
  body: ['heightCm', 'weightKg'],
  activity: ['activity'],
  goal: ['goal'],
  target: [],
};

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'camera', title: 'Snap a dish', text: 'Recognises 10 Malaysian favourites, from nasi lemak to thosai.' },
  { icon: 'book', title: 'Standard-serving calories', text: 'Energy, carbs, protein and fat from a referenced table.' },
  { icon: 'single', title: 'A target that fits you', text: 'Worked out from your age, body, activity and goal.' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile } = useApp();
  const [stepIndex, setStepIndex] = useState(-1);
  const [form, setForm] = useState<ProfileForm>({ age: '', heightCm: '', weightKg: '' });
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
      <main className="screen screen--plain welcome">
        <div className="welcome__brand">
          <img src="/icon.svg" alt="" width={44} height={44} />
          <span>Pinggan</span>
        </div>
        <h1 className="welcome__headline">Calories for the food you actually eat.</h1>
        <p className="welcome__lede">
          Take a photo of your plate, confirm the dish and see how it fits into your day.
        </p>

        <div className="welcome__preview" aria-hidden="true">
          <FoodGlyph category="rice" size={44} />
          <div>
            <strong>Nasi lemak</strong>
            <span>1 packet · about 200 g</span>
          </div>
          <span className="welcome__preview-kcal num">389 kcal</span>
        </div>

        <ul className="welcome__features">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <span className="welcome__feature-icon">
                <Icon name={feature.icon} size={20} />
              </span>
              <div>
                <strong>{feature.title}</strong>
                <span>{feature.text}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="welcome__actions">
          <button type="button" className="btn btn--primary btn--block" onClick={() => setStepIndex(0)}>
            Set up my daily target
          </button>
          <p className="welcome__privacy">
            <Icon name="shield" size={16} /> Your details stay on this phone.
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

  return (
    <main className="screen screen--cta onboarding">
      <div className="topbar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setStepIndex(stepIndex - 1)}
          aria-label="Back"
        >
          <Icon name="chevronLeft" />
        </button>
        <div className="onboarding__progress" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span key={s} className={i <= stepIndex ? 'is-done' : undefined} />
          ))}
        </div>
        <span />
      </div>

      {step === 'about' && (
        <>
          <h1 className="onboarding__title">About you</h1>
          <p className="onboarding__lede">Sex and age are part of the resting energy formula.</p>
          <h2 className="section-label">Sex</h2>
          <SexChoice value={form.sex} onChange={(sex) => update({ sex })} />
          {errors.sex && <p className="field__error onboarding__error">{errors.sex}</p>}
          <div className="onboarding__fields">
            <NumberField id="age" label="Age" unit="years" value={form.age} onChange={(age) => update({ age })} error={errors.age} />
          </div>
        </>
      )}

      {step === 'body' && (
        <>
          <h1 className="onboarding__title">Height and weight</h1>
          <p className="onboarding__lede">Use your current weight. You can update it any time.</p>
          <div className="onboarding__fields">
            <NumberField
              id="height"
              label="Height"
              unit="cm"
              value={form.heightCm}
              onChange={(heightCm) => update({ heightCm })}
              error={errors.heightCm}
              decimal
            />
            <NumberField
              id="weight"
              label="Weight"
              unit="kg"
              value={form.weightKg}
              onChange={(weightKg) => update({ weightKg })}
              error={errors.weightKg}
              decimal
            />
          </div>
        </>
      )}

      {step === 'activity' && (
        <>
          <h1 className="onboarding__title">How active are you?</h1>
          <p className="onboarding__lede">Think about a typical week, including training and your job.</p>
          <div className="onboarding__fields">
            <ActivityChoice value={form.activity} onChange={(activity) => update({ activity })} />
            {errors.activity && <p className="field__error onboarding__error">{errors.activity}</p>}
          </div>
        </>
      )}

      {step === 'goal' && (
        <>
          <h1 className="onboarding__title">What’s your goal?</h1>
          <p className="onboarding__lede">This adjusts your target up or down from maintenance.</p>
          <div className="onboarding__fields">
            <GoalChoice value={form.goal} onChange={(goal) => update({ goal })} />
            {errors.goal && <p className="field__error onboarding__error">{errors.goal}</p>}
          </div>
        </>
      )}

      {step === 'target' && previewProfile && previewTarget && (
        <>
          <div className="onboarding__result">
            <p className="onboarding__result-label">Your daily target</p>
            <p className="onboarding__result-value num">
              {formatKcal(previewTarget.targetKcal)}
              <span> kcal</span>
            </p>
          </div>
          <div className="card">
            <TargetBreakdown
              profile={previewProfile}
              target={previewTarget}
              macros={macroTargets(previewProfile.weightKg, previewTarget.targetKcal)}
            />
          </div>
          <label className="onboarding__ack">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            <span>
              I understand this is an estimate for general guidance and not medical or dietary advice.
            </span>
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
            Continue
          </button>
        )}
      </div>
    </main>
  );
}

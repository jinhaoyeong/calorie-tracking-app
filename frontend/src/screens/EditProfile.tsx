import { CaretLeft } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityChoice, Field, GoalChoice, SexChoice, toDraft, type ProfileForm } from '../components/ProfileFields';
import { calculateTarget, isCompleteProfile, validateProfile, type ProfileErrors } from '../lib/energy';
import { formatKcal } from '../lib/format';
import { useProfile } from '../state/AppState';
import { useToast } from '../state/Toast';

export function EditProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, saveProfile } = useProfile();
  const [form, setForm] = useState<ProfileForm>({
    name: profile.name,
    sex: profile.sex,
    age: String(profile.age),
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    activity: profile.activity,
    goal: profile.goal,
  });
  const [errors, setErrors] = useState<ProfileErrors>({});

  const update = (patch: Partial<ProfileForm>) => setForm((current) => ({ ...current, ...patch }));

  const save = () => {
    const draft = toDraft(form);
    setErrors(validateProfile(draft));
    if (!isCompleteProfile(draft)) return;
    saveProfile(draft);
    const { targetKcal } = calculateTarget({ ...draft, updatedAt: '' });
    toast({ message: `Saved. Your target is now ${formatKcal(targetKcal)} kcal.` });
    navigate('/me', { replace: true });
  };

  return (
    <main className="screen screen--cta">
      <div className="topbar">
        <button type="button" className="round-button" onClick={() => navigate(-1)} aria-label="Back">
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="topbar__title">Edit profile</h1>
        <span />
      </div>

      <Field id="name" label="Name" value={form.name} onChange={(name) => update({ name })} error={errors.name} text placeholder="Optional" />

      <h2 className="section-label">Sex</h2>
      <SexChoice value={form.sex} onChange={(sex) => update({ sex })} />

      <h2 className="section-label">Body</h2>
      <div className="edit__row">
        <Field id="age" label="Age" unit="yrs" value={form.age} onChange={(age) => update({ age })} error={errors.age} />
        <Field id="height" label="Height" unit="cm" value={form.heightCm} onChange={(heightCm) => update({ heightCm })} error={errors.heightCm} decimal />
        <Field id="weight" label="Weight" unit="kg" value={form.weightKg} onChange={(weightKg) => update({ weightKg })} error={errors.weightKg} decimal />
      </div>

      <h2 className="section-label">Activity level</h2>
      <ActivityChoice value={form.activity} onChange={(activity) => update({ activity })} />

      <h2 className="section-label">Goal</h2>
      <GoalChoice value={form.goal} onChange={(goal) => update({ goal })} />

      <div className="cta-bar">
        <button type="button" className="btn btn--primary" onClick={save}>
          Save changes
        </button>
      </div>
    </main>
  );
}

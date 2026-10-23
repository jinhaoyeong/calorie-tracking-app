import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import {
  ActivityChoice,
  GoalChoice,
  NumberField,
  SexChoice,
  toDraft,
  type ProfileForm,
} from '../components/ProfileFields';
import { calculateTarget, isCompleteProfile, validateProfile, type ProfileErrors } from '../lib/energy';
import { formatKcal } from '../lib/format';
import { useProfile } from '../state/AppState';
import { useToast } from '../state/Toast';

export function EditProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, saveProfile } = useProfile();
  const [form, setForm] = useState<ProfileForm>({
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
    const found = validateProfile(draft);
    setErrors(found);
    if (!isCompleteProfile(draft)) return;
    saveProfile(draft);
    const { targetKcal } = calculateTarget({ ...draft, updatedAt: '' });
    toast({ message: `Profile saved. Daily target is now ${formatKcal(targetKcal)} kcal.` });
    navigate('/profile', { replace: true });
  };

  return (
    <main className="screen screen--cta">
      <div className="topbar">
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <h1 className="topbar__title">Edit profile</h1>
        <span />
      </div>

      <h2 className="section-label">Sex</h2>
      <SexChoice value={form.sex} onChange={(sex) => update({ sex })} />

      <h2 className="section-label">Body</h2>
      <NumberField id="age" label="Age" unit="years" value={form.age} onChange={(age) => update({ age })} error={errors.age} />
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

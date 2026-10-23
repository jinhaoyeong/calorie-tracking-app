import { CaretRight, Cpu, Images, NotePencil, PencilSimple, SealCheck, ShieldCheck, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Switch } from '../components/Controls';
import { TargetBreakdown } from '../components/TargetBreakdown';
import { bmi, bmiBand, GOALS } from '../lib/energy';
import { FOODS, NUTRITION_SOURCE_URL, NUTRITION_VERSION, SCAN_FOODS } from '../lib/foods';
import { formatKcal } from '../lib/format';
import { useProfile } from '../state/AppState';
import { useHealth } from '../state/useHealth';
import './Me.css';

export function Me() {
  const navigate = useNavigate();
  const { profile, target, macros, entries, preferences, setPreferences, customFoods, resetAll } = useProfile();
  const health = useHealth();
  const [confirming, setConfirming] = useState(false);
  const bmiValue = bmi(profile.heightCm, profile.weightKg);
  const band = bmiBand(bmiValue);
  const initials = (profile.name || 'Kawan')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const deleteAll = () => {
    resetAll();
    navigate('/welcome', { replace: true });
  };

  return (
    <main className="screen me">
      <header className="me__head">
        <span className="me__avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="me__who">
          <h1>{profile.name || 'Kawan'}</h1>
          <p>
            {GOALS[profile.goal].label} · {formatKcal(target.targetKcal)} kcal a day
          </p>
        </div>
        <Link to="/me/edit" className="round-button" aria-label="Edit profile">
          <PencilSimple size={20} weight="bold" />
        </Link>
      </header>

      <div className="me__stats">
        <div className="me__stat">
          <span>Age</span>
          <strong className="num">{profile.age}</strong>
          <small>years</small>
        </div>
        <div className="me__stat">
          <span>Height</span>
          <strong className="num">{profile.heightCm}</strong>
          <small>cm</small>
        </div>
        <div className="me__stat">
          <span>Weight</span>
          <strong className="num">{profile.weightKg}</strong>
          <small>kg</small>
        </div>
        <div className={`me__stat me__stat--bmi me__stat--${band.band}`}>
          <span>BMI</span>
          <strong className="num">{bmiValue}</strong>
          <small>{band.label}</small>
        </div>
      </div>
      <p className="me__note">BMI uses the Asian cut-offs in Malaysia’s clinical guidelines: healthy is 18.5–22.9.</p>

      <div className="section-head">
        <h2 className="section-title">Your daily target</h2>
      </div>
      <section className="card">
        <TargetBreakdown profile={profile} target={target} macros={macros} />
      </section>

      <div className="section-head">
        <h2 className="section-title">Settings</h2>
      </div>
      <ul className="card list">
        <li>
          <div className="list-row">
            <span className="list-row__icon">
              <SealCheck size={20} weight="fill" />
            </span>
            <span className="list-row__text">
              <span className="list-row__title">Halal-friendly foods only</span>
              <span className="list-row__sub">Hide dishes that usually contain pork</span>
            </span>
            <Switch checked={preferences.halalOnly} onChange={(halalOnly) => setPreferences({ ...preferences, halalOnly })} label="Halal-friendly foods only" />
          </div>
        </li>
        <li>
          <div className="list-row">
            <span className="list-row__icon">
              <Images size={20} weight="fill" />
            </span>
            <span className="list-row__text">
              <span className="list-row__title">Keep meal photos</span>
              <span className="list-row__sub">Small thumbnails, on this phone only</span>
            </span>
            <Switch checked={preferences.savePhotos} onChange={(savePhotos) => setPreferences({ ...preferences, savePhotos })} label="Keep meal photos" />
          </div>
        </li>
        <li>
          <Link className="list-row" to="/foods?category=mine">
            <span className="list-row__icon">
              <NotePencil size={20} weight="fill" />
            </span>
            <span className="list-row__text">
              <span className="list-row__title">My foods</span>
              <span className="list-row__sub">Home cooking and stall favourites you added</span>
            </span>
            <span className="list-row__value num">{customFoods.length}</span>
            <CaretRight size={16} weight="bold" className="list-row__chevron" />
          </Link>
        </li>
      </ul>

      <div className="section-head">
        <h2 className="section-title">Food recognition</h2>
      </div>
      <section className="card">
        <ul className="list">
          <li className="list-row">
            <span className="list-row__icon">
              <Cpu size={20} weight="fill" />
            </span>
            <span className="list-row__text">
              <span className="list-row__title">
                {health.status === 'online'
                  ? health.health.model.mode === 'demo'
                    ? 'Demo classifier'
                    : health.health.model.name
                  : 'Recognition service'}
              </span>
              <span className="list-row__sub">
                {SCAN_FOODS.length} dishes · low-confidence warning below{' '}
                {health.status === 'online' ? `${Math.round(health.health.confidenceThreshold * 100)}%` : '60%'}
              </span>
            </span>
            <span className={`status status--${health.status}`}>
              {health.status === 'loading' ? 'Checking' : health.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </li>
        </ul>
        {health.status === 'online' && health.health.model.mode === 'demo' && (
          <p className="me__model-note">
            No trained model is loaded yet. Suggestions are placeholders until the selected MobileNetV3, EfficientNet-B0 or
            ResNet50 model is exported to the server.
          </p>
        )}
      </section>

      <div className="section-head">
        <h2 className="section-title">Privacy</h2>
      </div>
      <section className="card card--pad me__privacy">
        <p>
          <ShieldCheck size={20} weight="fill" />
          <span>
            Photos are sent only to identify the dish and are discarded straight away. Your profile and diary ({entries.length}{' '}
            {entries.length === 1 ? 'entry' : 'entries'}) stay on this phone.
          </span>
        </p>
        <button type="button" className="btn btn--danger btn--block" onClick={() => setConfirming(true)}>
          <Trash size={20} weight="bold" /> Delete all my data
        </button>
      </section>

      <section className="me__about">
        <p>
          Pinggan is a research prototype for Malaysian food. Targets use the Mifflin–St Jeor equation (Mifflin et al., 1990)
          with an activity multiplier. Nutrition values for the {FOODS.length} foods are per standard serving and will be
          checked against the{' '}
          <a href={NUTRITION_SOURCE_URL} target="_blank" rel="noreferrer">
            Malaysian Food Composition Database
          </a>{' '}
          (table {NUTRITION_VERSION}).
        </p>
        <p>An educational monitoring aid, not a clinical dietary assessment tool. Not medical or dietary advice.</p>
        <p className="me__version">Pinggan 0.2.0 · mobile web prototype</p>
      </section>

      {confirming && (
        <BottomSheet
          title="Delete all data?"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button type="button" className="btn me__delete" onClick={deleteAll}>
                Delete
              </button>
            </>
          }
        >
          <p className="sheet-lede">
            This removes your profile, diary, saved photos and your own foods from this phone. It can’t be undone.
          </p>
        </BottomSheet>
      )}
    </main>
  );
}

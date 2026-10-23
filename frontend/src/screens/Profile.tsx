import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';
import { TargetBreakdown } from '../components/TargetBreakdown';
import { GOALS } from '../lib/energy';
import { FOODS, NUTRITION_SOURCE_URL, NUTRITION_VERSION } from '../lib/foods';
import { formatPercent } from '../lib/format';
import { useProfile } from '../state/AppState';
import { useHealth } from '../state/useHealth';
import './Profile.css';

export function Profile() {
  const navigate = useNavigate();
  const { profile, target, macros, entries, resetAll } = useProfile();
  const health = useHealth();
  const [confirming, setConfirming] = useState(false);

  const deleteAll = () => {
    resetAll();
    navigate('/welcome', { replace: true });
  };

  return (
    <main className="screen profile">
      <h1 className="page-title">Profile</h1>

      <section className="card profile__summary">
        <span className="profile__avatar" aria-hidden="true">
          <Icon name="profile" size={26} />
        </span>
        <div className="profile__facts">
          <strong>{GOALS[profile.goal].label}</strong>
          <span className="num">
            {[
              profile.sex === 'male' ? 'Male' : 'Female',
              `${profile.age}\u00a0years`,
              `${profile.heightCm}\u00a0cm`,
              `${profile.weightKg}\u00a0kg`,
            ].join(' · ')}
          </span>
        </div>
        <Link to="/profile/edit" className="profile__edit" aria-label="Edit profile">
          <Icon name="edit" size={20} />
        </Link>
      </section>

      <h2 className="section-label">How your daily target is worked out</h2>
      <section className="card">
        <TargetBreakdown profile={profile} target={target} macros={macros} />
      </section>

      <h2 className="section-label">Dish recognition</h2>
      <section className="card">
        <ul className="rows">
          <li className="row">
            <span className="row__label">Status</span>
            <span className="row__value">
              {health.status === 'loading' && 'Checking…'}
              {health.status === 'offline' && (
                <span className="status status--offline">
                  <Icon name="alert" size={16} /> Offline
                </span>
              )}
              {health.status === 'online' && (
                <span className="status status--online">
                  <Icon name="check" size={16} strokeWidth={2.2} /> Connected
                </span>
              )}
            </span>
          </li>
          <li className="row">
            <span className="row__label">Model</span>
            <span className="row__value">
              {health.status === 'online'
                ? health.health.model.mode === 'demo'
                  ? 'Demo classifier'
                  : health.health.model.name
                : '–'}
            </span>
          </li>
          <li className="row">
            <span className="row__label">Low-confidence warning</span>
            <span className="row__value">
              {health.status === 'online' ? `Below ${formatPercent(health.health.confidenceThreshold)}` : '–'}
            </span>
          </li>
          <li className="row">
            <span className="row__label">Supported dishes</span>
            <span className="row__value">{FOODS.length}</span>
          </li>
        </ul>
        {health.status === 'online' && health.health.model.mode === 'demo' && (
          <p className="profile__model-note">
            No trained model is loaded yet. Suggestions are placeholders until the selected MobileNetV3, EfficientNet-B0
            or ResNet50 model is exported to the server.
          </p>
        )}
      </section>

      <h2 className="section-label">Privacy</h2>
      <section className="card card__pad profile__privacy">
        <p>
          <Icon name="shield" size={18} />
          <span>
            Photos are sent only to identify the dish and are discarded straight away. Your profile and diary (
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}) are stored on this device only.
          </span>
        </p>
        <button type="button" className="btn btn--danger btn--block" onClick={() => setConfirming(true)}>
          <Icon name="trash" size={20} /> Delete all my data
        </button>
      </section>

      <h2 className="section-label">About</h2>
      <section className="card card__pad profile__about">
        <p>
          Pinggan is a research prototype. Daily targets use the Mifflin–St Jeor equation (Mifflin et al., 1990) with an
          activity multiplier. Nutrition values are for standard servings and will be checked against the{' '}
          <a href={NUTRITION_SOURCE_URL} target="_blank" rel="noreferrer">
            Malaysian Food Composition Database
          </a>{' '}
          (table version {NUTRITION_VERSION}).
        </p>
        <p>
          It is an educational monitoring aid, not a clinical dietary assessment tool, and does not give medical or dietary
          advice.
        </p>
      </section>

      <p className="profile__version">Pinggan 0.1.0 · mobile web prototype</p>

      {confirming && (
        <BottomSheet
          title="Delete all data?"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary profile__confirm-delete" onClick={deleteAll}>
                Delete
              </button>
            </>
          }
        >
          <p className="profile__confirm-text">
            This removes your profile and every diary entry from this device. It can’t be undone.
          </p>
        </BottomSheet>
      )}
    </main>
  );
}

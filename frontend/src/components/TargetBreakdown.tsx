import { ACTIVITY_LEVELS, GOALS, type MacroTargets, type TargetBreakdown as Breakdown } from '../lib/energy';
import { formatKcal, formatSigned } from '../lib/format';
import type { Profile } from '../lib/types';
import { MacroDot } from './MacroMeter';
import './TargetBreakdown.css';

interface Props {
  profile: Profile;
  target: Breakdown;
  macros: MacroTargets;
}

/** Shows every step of the daily target so the estimate is transparent rather than a black box. */
export function TargetBreakdown({ profile, target, macros }: Props) {
  const nb = (text: string) => text.replace(/ /g, ' ');
  const formula = [
    nb(`10 × ${profile.weightKg} kg`),
    nb(`+ 6.25 × ${profile.heightCm} cm`),
    nb(`− 5 × ${profile.age}`),
    nb(profile.sex === 'male' ? '+ 5' : '− 161'),
  ].join(' ');
  return (
    <div className="breakdown">
      <ol className="breakdown__steps">
        <li>
          <span className="breakdown__step">1</span>
          <div className="breakdown__text">
            <span className="breakdown__label">Resting energy</span>
            <span className="breakdown__detail num">{formula}</span>
          </div>
          <span className="breakdown__value num">{formatKcal(target.restingKcal)}</span>
        </li>
        <li>
          <span className="breakdown__step">2</span>
          <div className="breakdown__text">
            <span className="breakdown__label">× Activity</span>
            <span className="breakdown__detail">{ACTIVITY_LEVELS[profile.activity].label}</span>
          </div>
          <span className="breakdown__value num">× {target.activityMultiplier}</span>
        </li>
        <li>
          <span className="breakdown__step">3</span>
          <div className="breakdown__text">
            <span className="breakdown__label">= Maintenance</span>
            <span className="breakdown__detail">Energy you use in a day</span>
          </div>
          <span className="breakdown__value num">{formatKcal(target.maintenanceKcal)}</span>
        </li>
        <li>
          <span className="breakdown__step">4</span>
          <div className="breakdown__text">
            <span className="breakdown__label">Goal</span>
            <span className="breakdown__detail">{GOALS[profile.goal].label}</span>
          </div>
          <span className="breakdown__value num">{formatSigned(target.goalAdjustmentKcal)}</span>
        </li>
      </ol>
      <div className="breakdown__total">
        <div>
          <span className="breakdown__total-label">Daily target</span>
          {target.minimumApplied && (
            <span className="breakdown__detail">Raised to the {formatKcal(target.minimumKcal)} kcal minimum</span>
          )}
        </div>
        <span className="breakdown__total-value num">
          {formatKcal(target.targetKcal)}
          <small> kcal</small>
        </span>
      </div>
      <dl className="breakdown__macros">
        <div>
          <dt>
            <MacroDot macro="carbs" /> Carbs
          </dt>
          <dd className="num">{macros.carbohydrateG} g</dd>
        </div>
        <div>
          <dt>
            <MacroDot macro="protein" /> Protein
          </dt>
          <dd className="num">{macros.proteinG} g</dd>
        </div>
        <div>
          <dt>
            <MacroDot macro="fat" /> Fat
          </dt>
          <dd className="num">{macros.fatG} g</dd>
        </div>
      </dl>
      <p className="breakdown__footnote">
        Mifflin–St Jeor equation with an activity multiplier. Protein 1.6 g per kg body weight, fat 25% of energy, carbs
        the rest.
      </p>
    </div>
  );
}

import { formatKcal } from '../lib/format';
import './CalorieRing.css';

interface Props {
  targetKcal: number;
  eatenKcal: number;
  size?: number;
}

const STROKE = 11;

export function CalorieRing({ targetKcal, eatenKcal, size = 168 }: Props) {
  const remaining = targetKcal - eatenKcal;
  const over = remaining < 0;
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = targetKcal > 0 ? Math.min(eatenKcal / targetKcal, 1) : 0;

  return (
    <div
      className={`ring${over ? ' ring--over' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        over
          ? `${formatKcal(-remaining)} kcal over your ${formatKcal(targetKcal)} kcal target`
          : `${formatKcal(remaining)} of ${formatKcal(targetKcal)} kcal remaining`
      }
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={STROKE} />
        {fraction > 0 && (
          <circle
            className="ring__value"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={STROKE}
            strokeDasharray={`${circumference * fraction} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <div className="ring__center">
        <span className="ring__value-text">{formatKcal(Math.abs(remaining))}</span>
        <span className="ring__caption">{over ? 'kcal over' : 'kcal left'}</span>
      </div>
    </div>
  );
}

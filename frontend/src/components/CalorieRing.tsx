import type { ReactNode } from 'react';
import './CalorieRing.css';

interface Props {
  /** Eaten as a fraction of the target; values above 1 draw a full ring in the over-target colour. */
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
}

export function CalorieRing({ progress, size = 128, stroke = 12, label, children }: Props) {
  const over = progress > 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.min(Math.max(progress, 0), 1);
  return (
    <div className={`ring${over ? ' ring--over' : ''}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        {fraction > 0 && (
          <circle
            className="ring__value"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={`${circumference * fraction} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <div className="ring__center">{children}</div>
    </div>
  );
}

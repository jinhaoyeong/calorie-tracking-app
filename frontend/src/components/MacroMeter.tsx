import { formatGrams } from '../lib/format';
import { Icon } from './Icon';
import './MacroMeter.css';

export type Macro = 'carbs' | 'protein' | 'fat';

export const MACRO_LABEL: Record<Macro, string> = { carbs: 'Carbs', protein: 'Protein', fat: 'Fat' };

interface Props {
  macro: Macro;
  grams: number;
  targetGrams: number;
}

export function MacroMeter({ macro, grams, targetGrams }: Props) {
  const fraction = targetGrams > 0 ? Math.min(grams / targetGrams, 1) : 0;
  const over = grams > targetGrams;
  return (
    <div className={`macro macro--${macro}${over ? ' macro--over' : ''}`}>
      <div className="macro__label">{MACRO_LABEL[macro]}</div>
      <div
        className="macro__track"
        role="meter"
        aria-label={`${MACRO_LABEL[macro]}`}
        aria-valuemin={0}
        aria-valuemax={targetGrams}
        aria-valuenow={Math.min(grams, targetGrams)}
        aria-valuetext={`${formatGrams(grams)} of ${formatGrams(targetGrams)}${over ? ', over target' : ''}`}
      >
        <div className="macro__fill" style={{ width: `${fraction * 100}%` }} />
      </div>
      <div className="macro__value num">
        {over && <Icon name="alert" size={13} strokeWidth={2} className="macro__over-icon" />}
        <strong>{Math.round(grams)}</strong>
        <span> / {Math.round(targetGrams)} g</span>
      </div>
    </div>
  );
}

/** Small coloured key used next to gram values. */
export function MacroDot({ macro }: { macro: Macro }) {
  return <span className={`macro-dot macro-dot--${macro}`} aria-hidden="true" />;
}

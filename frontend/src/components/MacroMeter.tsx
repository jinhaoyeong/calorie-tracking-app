import { Warning } from '@phosphor-icons/react';
import { formatGrams } from '../lib/format';
import { MACRO_LABEL, type Macro } from './MacroCharts';
import './MacroMeter.css';

interface Props {
  macro: Macro;
  grams: number;
  targetGrams: number;
}

/** Progress towards a daily macro target. */
export function MacroMeter({ macro, grams, targetGrams }: Props) {
  const fraction = targetGrams > 0 ? Math.min(grams / targetGrams, 1) : 0;
  const over = grams > targetGrams;
  return (
    <div className={`macro macro--${macro}${over ? ' macro--over' : ''}`}>
      <div className="macro__label">{MACRO_LABEL[macro]}</div>
      <div className="macro__value num">
        <strong className="display">{Math.round(grams)}</strong>
        <span>/ {Math.round(targetGrams)} g</span>
        {over && <Warning size={13} weight="bold" className="macro__over-icon" aria-label="over target" />}
      </div>
      <div
        className="macro__track"
        role="meter"
        aria-label={MACRO_LABEL[macro]}
        aria-valuemin={0}
        aria-valuemax={targetGrams}
        aria-valuenow={Math.min(grams, targetGrams)}
        aria-valuetext={`${formatGrams(grams)} of ${formatGrams(targetGrams)}${over ? ', over target' : ''}`}
      >
        <div className="macro__fill" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
}

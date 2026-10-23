import type { Nutrients } from '../lib/types';
import './MacroCharts.css';

export type Macro = 'protein' | 'carbs' | 'fat';

/** Protein first: the macro people who train watch most closely. */
export const MACROS: Macro[] = ['protein', 'carbs', 'fat'];

export const MACRO_LABEL: Record<Macro, string> = { protein: 'Protein', carbs: 'Carbs', fat: 'Fat' };
export const MACRO_SHORT: Record<Macro, string> = { protein: 'P', carbs: 'C', fat: 'F' };

export function gramsOf(nutrients: Nutrients, macro: Macro): number {
  return macro === 'protein' ? nutrients.proteinG : macro === 'carbs' ? nutrients.carbohydrateG : nutrients.fatG;
}

/** Energy from each macro (Atwater 4/4/9 kcal per gram). */
export function energyOf(nutrients: Nutrients, macro: Macro): number {
  return gramsOf(nutrients, macro) * (macro === 'fat' ? 9 : 4);
}

export function energyShares(nutrients: Nutrients): Record<Macro, number> {
  const total = MACROS.reduce((sum, m) => sum + energyOf(nutrients, m), 0);
  return {
    protein: total ? energyOf(nutrients, 'protein') / total : 0,
    carbs: total ? energyOf(nutrients, 'carbs') / total : 0,
    fat: total ? energyOf(nutrients, 'fat') / total : 0,
  };
}

export function MacroDot({ macro }: { macro: Macro }) {
  return <span className={`macro-dot macro-dot--${macro}`} aria-hidden="true" />;
}

/** Thin stacked bar of where a food's energy comes from, used in list rows. */
export function MacroSplitBar({ nutrients, width = 56 }: { nutrients: Nutrients; width?: number }) {
  const shares = energyShares(nutrients);
  if (!shares.protein && !shares.carbs && !shares.fat) return null;
  return (
    <span className="split-bar" style={{ width }} aria-hidden="true">
      {MACROS.map((m) => shares[m] > 0 && <span key={m} className={`split-bar__part split-bar__part--${m}`} style={{ flexGrow: shares[m] }} />)}
    </span>
  );
}

/** Donut of energy by macro with a 2px gap between segments and the kcal in the middle. */
export function MacroDonut({ nutrients, size = 132, label }: { nutrients: Nutrients; size?: number; label?: string }) {
  const shares = energyShares(nutrients);
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 3;
  let offset = 0;
  const parts = MACROS.filter((m) => shares[m] > 0);
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? 'Energy by macronutrient'}>
        <circle cx={size / 2} cy={size / 2} r={radius} className="donut__track" strokeWidth={stroke} />
        {parts.map((m) => {
          const length = Math.max(shares[m] * circumference - (parts.length > 1 ? gap : 0), 0.5);
          const segment = (
            <circle
              key={m}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`donut__part donut__part--${m}`}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += shares[m] * circumference;
          return segment;
        })}
      </svg>
      <div className="donut__center">
        <span className="donut__value display">{Math.round(nutrients.energyKcal).toLocaleString('en-MY')}</span>
        <span className="donut__unit">kcal</span>
      </div>
    </div>
  );
}

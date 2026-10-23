import { Camera, CaretRight } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { formatKcal } from '../lib/format';
import type { Food } from '../lib/types';
import { FoodThumb } from './FoodThumb';
import { MacroSplitBar } from './MacroCharts';
import './FoodRow.css';

/** Row content for a food in lists; the caller wraps it in a link or button with class "food-row". */
export function FoodRowContent({ food, trailing }: { food: Food; trailing?: ReactNode }) {
  return (
    <>
      <FoodThumb category={food.category} />
      <span className="food-row__text">
        <span className="food-row__name">
          {food.name}
          {food.scan && <Camera size={13} weight="fill" className="food-row__scan" aria-label="Camera recognises this dish" />}
        </span>
        <span className="food-row__meta">
          {food.serving.localLabel} · P {Math.round(food.proteinG)} · C {Math.round(food.carbohydrateG)} · F {Math.round(food.fatG)}
        </span>
      </span>
      <span className="food-row__kcal">
        <span className="display num">{formatKcal(food.energyKcal)}</span>
        <MacroSplitBar nutrients={food} width={44} />
      </span>
      {trailing ?? <CaretRight size={14} weight="bold" className="food-row__chevron" />}
    </>
  );
}

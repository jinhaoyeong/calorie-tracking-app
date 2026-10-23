import { Camera, CaretRight } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { FoodArt } from '../art/FoodArt';
import { formatKcal } from '../lib/format';
import type { Food } from '../lib/types';
import './FoodRow.css';

/** Row content for a food in lists; the caller wraps it in a link or button with class "food-row". */
export function FoodRowContent({ food, trailing }: { food: Food; trailing?: ReactNode }) {
  return (
    <>
      <FoodArt foodId={food.id} category={food.category} size={52} />
      <span className="food-row__text">
        <span className="food-row__name">
          {food.name}
          {food.scan && <Camera size={14} weight="fill" className="food-row__scan" aria-label="Scan-ready" />}
        </span>
        <span className="food-row__meta">
          {food.localName && food.localName !== food.name ? `${food.localName} · ` : ''}
          {food.serving.localLabel}
        </span>
      </span>
      <span className="food-row__kcal num">
        {formatKcal(food.energyKcal)}
        <small>kcal</small>
      </span>
      {trailing ?? <CaretRight size={16} weight="bold" className="food-row__chevron" />}
    </>
  );
}

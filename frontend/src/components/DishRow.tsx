import type { ReactNode } from 'react';
import { formatKcal } from '../lib/format';
import type { Food } from '../lib/types';
import { FoodGlyph } from './FoodGlyph';
import { Icon } from './Icon';
import './DishRow.css';

interface Props {
  food: Food;
  trailing?: ReactNode;
}

/** Row content for a dish; the caller wraps it in a link or button. */
export function DishRowContent({ food, trailing }: Props) {
  return (
    <>
      <FoodGlyph category={food.category} size={42} />
      <span className="dish-row__text">
        <span className="dish-row__name">{food.name}</span>
        <span className="dish-row__meta">
          {food.serving.label} · {food.serving.grams} g
        </span>
      </span>
      <span className="dish-row__kcal num">
        {formatKcal(food.energyKcal)}
        <span> kcal</span>
      </span>
      {trailing ?? <Icon name="chevronRight" size={18} className="dish-row__chevron" />}
    </>
  );
}

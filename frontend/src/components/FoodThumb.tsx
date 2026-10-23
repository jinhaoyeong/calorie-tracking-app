import { Bread, BowlFood, BowlSteam, Coffee, CookingPot, Cookie, ForkKnife, IceCream, OrangeSlice, type Icon } from '@phosphor-icons/react';
import type { FoodCategory } from '../lib/types';
import './FoodThumb.css';

export const CATEGORY_ICON: Record<FoodCategory, Icon> = {
  rice: BowlFood,
  noodles: BowlSteam,
  bread: Bread,
  mains: CookingPot,
  kuih: Cookie,
  dessert: IceCream,
  drinks: Coffee,
  fruit: OrangeSlice,
  custom: ForkKnife,
};

interface Props {
  category: FoodCategory;
  size?: number;
  /** A meal photo the user chose to keep; shown instead of the category icon. */
  photo?: string;
}

export function FoodThumb({ category, size = 42, photo }: Props) {
  if (photo) {
    return <img className="thumb thumb--photo" src={photo} alt="" width={size} height={size} style={{ width: size, height: size }} />;
  }
  const CategoryIcon = CATEGORY_ICON[category] ?? ForkKnife;
  return (
    <span className="thumb" style={{ width: size, height: size }} aria-hidden="true">
      <CategoryIcon size={Math.round(size * 0.5)} weight="duotone" />
    </span>
  );
}

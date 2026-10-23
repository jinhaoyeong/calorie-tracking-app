import type { FoodCategory } from '../lib/types';
import './FoodGlyph.css';

const GLYPHS: Record<FoodCategory, JSX.Element> = {
  rice: (
    <>
      <path d="M4 12.5h16a8 6.75 0 0 1-16 0z" />
      <path d="M6.75 12.5c.7-3 2.8-4.75 5.25-4.75s4.55 1.75 5.25 4.75" />
    </>
  ),
  noodles: (
    <>
      <path d="M4 12.5h16a8 6.75 0 0 1-16 0z" />
      <path d="M10 12.5L16.5 3.5M13 12.5L19.5 5" />
      <path d="M7 12.5c.4-1.6 1.4-1.6 1.8 0" />
    </>
  ),
  bread: (
    <>
      <ellipse cx="12" cy="13" rx="8.5" ry="6.25" />
      <path d="M12 10.25c2.3 0 3.75.9 3.75 2.5S14.1 15.5 12 15.5s-3-1-3-2.25 1.1-1.75 2.6-1.75" />
    </>
  ),
  skewer: (
    <>
      <path d="M4 20L20 4" />
      <rect x="6.6" y="12.6" width="4.6" height="4.6" rx="1.4" transform="rotate(45 8.9 14.9)" />
      <rect x="10.6" y="8.6" width="4.6" height="4.6" rx="1.4" transform="rotate(45 12.9 10.9)" />
      <rect x="14.1" y="5.1" width="4" height="4" rx="1.3" transform="rotate(45 16.1 7.1)" />
    </>
  ),
  curry: (
    <>
      <path d="M5 10.5h14v3.25a7 6 0 0 1-14 0z" />
      <path d="M3 10.5h18M9 7.5c-.6.8.6 1.6 0 2.4M13 6.5c-.6.8.6 1.6 0 2.4" />
    </>
  ),
};

export function FoodGlyph({ category, size = 44 }: { category: FoodCategory; size?: number }) {
  return (
    <span className={`food-glyph food-glyph--${category}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[category]}
      </svg>
    </span>
  );
}

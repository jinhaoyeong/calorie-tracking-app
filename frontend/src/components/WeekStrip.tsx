import { addDays, formatShortWeekday, fromDateKey, weekDays } from '../lib/date';
import './WeekStrip.css';

interface Props {
  selected: string;
  today: string;
  /** kcal eaten per date, used to draw each day's small progress ring. */
  eatenByDate: Map<string, number>;
  targetKcal: number;
  onSelect: (date: string) => void;
}

const R = 17;
const C = 2 * Math.PI * R;

export function WeekStrip({ selected, today, eatenByDate, targetKcal, onSelect }: Props) {
  return (
    <div className="week" role="tablist" aria-label="Choose a day">
      {weekDays(selected).map((date) => {
        const eaten = eatenByDate.get(date) ?? 0;
        const progress = Math.min(eaten / targetKcal, 1);
        const future = date > today;
        const isSelected = date === selected;
        return (
          <button
            key={date}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`week__day${isSelected ? ' is-selected' : ''}${date === today ? ' is-today' : ''}`}
            onClick={() => onSelect(date)}
            disabled={future}
          >
            <span className="week__name">{formatShortWeekday(date).slice(0, 1)}</span>
            <span className="week__circle">
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r={R} className="week__track" />
                {progress > 0 && (
                  <circle
                    cx="20"
                    cy="20"
                    r={R}
                    className={`week__progress${eaten > targetKcal ? ' week__progress--over' : ''}`}
                    strokeDasharray={`${C * progress} ${C}`}
                    transform="rotate(-90 20 20)"
                  />
                )}
              </svg>
              <span className="week__date num">{fromDateKey(date).getDate()}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function weekLabel(selected: string, today: string): string {
  if (weekDays(selected).includes(today)) return 'This week';
  if (weekDays(addDays(selected, 7)).includes(today)) return 'Last week';
  return fromDateKey(weekDays(selected)[0]).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

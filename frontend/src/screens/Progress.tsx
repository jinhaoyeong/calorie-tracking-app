import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MacroDot, MACRO_LABEL, type Macro } from '../components/MacroMeter';
import {
  addDays,
  formatDayMonth,
  formatShortWeekday,
  formatWeekRange,
  startOfWeek,
  todayKey,
  weekDays,
} from '../lib/date';
import { entriesOn, sumNutrients } from '../lib/diary';
import { formatCompact, formatGrams, formatKcal, formatSigned } from '../lib/format';
import type { DiaryEntry, Nutrients } from '../lib/types';
import { useProfile } from '../state/AppState';
import './Progress.css';

interface Day {
  date: string;
  totals: Nutrients;
  logged: boolean;
}

export function Progress() {
  const { entries, target } = useProfile();
  const today = todayKey();
  const thisWeek = startOfWeek(today);
  const [weekStart, setWeekStart] = useState(thisWeek);

  const days: Day[] = weekDays(weekStart).map((date) => {
    const list = entriesOn(entries, date);
    return { date, totals: sumNutrients(list), logged: list.length > 0 };
  });
  const logged = days.filter((d) => d.logged);
  const weekEntries = entries.filter((e) => e.date >= weekStart && e.date <= addDays(weekStart, 6));
  const average = logged.length
    ? Math.round(logged.reduce((sum, d) => sum + d.totals.energyKcal, 0) / logged.length)
    : 0;
  const pastDays = days.filter((d) => d.date <= today).length;

  return (
    <main className="screen progress">
      <h1 className="page-title">Progress</h1>

      <div className="week-switch">
        <button type="button" className="icon-button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
          <Icon name="chevronLeft" />
        </button>
        <div className="week-switch__label">
          <strong>{weekStart === thisWeek ? 'This week' : weekStart === addDays(thisWeek, -7) ? 'Last week' : 'Week of'}</strong>
          <span>{formatWeekRange(weekStart)}</span>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          disabled={weekStart >= thisWeek}
          aria-label="Next week"
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat__label">Daily average</span>
          <span className="stat__value">{logged.length ? formatKcal(average) : '–'}</span>
          <span className="stat__unit">kcal on logged days</span>
        </div>
        <div className="stat">
          <span className="stat__label">Vs target</span>
          <span className="stat__value">{logged.length ? formatSigned(average - target.targetKcal) : '–'}</span>
          <span className="stat__unit">kcal per day</span>
        </div>
        <div className="stat">
          <span className="stat__label">Days logged</span>
          <span className="stat__value">{logged.length}</span>
          <span className="stat__unit">of {pastDays}</span>
        </div>
      </div>

      <section className="card card__pad" aria-labelledby="daily-title">
        <h2 id="daily-title" className="progress__card-title">
          Daily calories
        </h2>
        {logged.length ? (
          <WeekChart days={days} targetKcal={target.targetKcal} today={today} />
        ) : (
          <div className="progress__empty">
            <p>No meals logged this week.</p>
            <Link className="text-button" to="/scan">
              <Icon name="camera" size={18} /> Scan your next meal
            </Link>
          </div>
        )}
      </section>

      {logged.length > 0 && (
        <>
          <MacroSplit days={logged} />
          <TopDishes entries={weekEntries} />
        </>
      )}
    </main>
  );
}

const CHART = { width: 340, height: 196, left: 38, right: 10, top: 16, bottom: 26 };

function niceScale(max: number): { top: number; step: number } {
  const step = max <= 2400 ? 500 : 1000;
  return { top: Math.max(step, Math.ceil((max * 1.08) / step) * step), step };
}

function columnPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(4, height, width / 2);
  const base = y + height;
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${base}Z`;
}

function WeekChart({ days, targetKcal, today }: { days: Day[]; targetKcal: number; today: string }) {
  const [active, setActive] = useState<number | null>(null);
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const band = plotWidth / days.length;
  const barWidth = Math.min(24, band * 0.56);
  const { top, step } = niceScale(Math.max(targetKcal, ...days.map((d) => d.totals.energyKcal)));
  const y = (kcal: number) => CHART.top + plotHeight - (kcal / top) * plotHeight;
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);
  const activeDay = active === null ? null : days[active];

  return (
    <>
      <ul className="chart-legend">
        <li>
          <span className="chart-legend__swatch" /> Within target
        </li>
        <li>
          <span className="chart-legend__swatch chart-legend__swatch--over" /> Over target
        </li>
        <li>
          <span className="chart-legend__line" /> Target {formatKcal(targetKcal)}
        </li>
      </ul>
      <div className="chart" onPointerLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} role="img" aria-label="Calories eaten each day this week compared with your target">
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="chart__grid" x1={CHART.left} x2={CHART.width - CHART.right} y1={y(tick)} y2={y(tick)} />
              <text className="chart__tick" x={CHART.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {formatCompact(tick)}
              </text>
            </g>
          ))}
          {days.map((day, i) => {
            const cx = CHART.left + band * i + band / 2;
            const kcal = day.totals.energyKcal;
            const over = kcal > targetKcal;
            return (
              <g key={day.date}>
                {day.logged && kcal > 0 && (
                  <path
                    className={`chart__bar${over ? ' chart__bar--over' : ''}${active !== null && active !== i ? ' chart__bar--muted' : ''}`}
                    d={columnPath(cx - barWidth / 2, y(kcal), barWidth, y(0) - y(kcal))}
                  />
                )}
                <text
                  className={`chart__day${day.date === today ? ' chart__day--today' : ''}`}
                  x={cx}
                  y={CHART.height - 6}
                  textAnchor="middle"
                >
                  {formatShortWeekday(day.date)}
                </text>
                <rect
                  className="chart__hit"
                  x={cx - band / 2}
                  y={CHART.top}
                  width={band}
                  height={plotHeight}
                  tabIndex={0}
                  aria-label={`${formatShortWeekday(day.date)} ${formatDayMonth(day.date)}: ${
                    day.logged ? `${formatKcal(kcal)} kcal` : 'nothing logged'
                  }`}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => setActive(active === i ? null : i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
          <line className="chart__target" x1={CHART.left} x2={CHART.width - CHART.right} y1={y(targetKcal)} y2={y(targetKcal)} />
          <line className="chart__baseline" x1={CHART.left} x2={CHART.width - CHART.right} y1={y(0)} y2={y(0)} />
        </svg>
        {activeDay && active !== null && (
          <div
            className="chart__tooltip"
            style={{
              left: `${((CHART.left + band * active + band / 2) / CHART.width) * 100}%`,
              top: `${(y(Math.max(activeDay.totals.energyKcal, targetKcal)) / CHART.height) * 100}%`,
              transform: `translate(${active === 0 ? '-25%' : active === days.length - 1 ? '-75%' : '-50%'}, calc(-100% - 8px))`,
            }}
          >
            <strong>
              {formatShortWeekday(activeDay.date)} {formatDayMonth(activeDay.date)}
            </strong>
            {activeDay.logged ? (
              <span className="num">
                {formatKcal(activeDay.totals.energyKcal)} kcal ·{' '}
                {Math.round((activeDay.totals.energyKcal / targetKcal) * 100)}% of target
              </span>
            ) : (
              <span>Nothing logged</span>
            )}
          </div>
        )}
      </div>
      <details className="chart-table">
        <summary>View as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Eaten</th>
              <th scope="col">Vs target</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row">
                  {formatShortWeekday(day.date)} {formatDayMonth(day.date)}
                </th>
                <td className="num">{day.logged ? `${formatKcal(day.totals.energyKcal)} kcal` : '–'}</td>
                <td className={`num${day.totals.energyKcal > targetKcal ? ' chart-table__over' : ''}`}>
                  {day.logged ? formatSigned(day.totals.energyKcal - targetKcal) : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

function MacroSplit({ days }: { days: Day[] }) {
  const totals = sumNutrients(days.map((d) => d.totals));
  const kcal: Record<Macro, number> = {
    carbs: totals.carbohydrateG * 4,
    protein: totals.proteinG * 4,
    fat: totals.fatG * 9,
  };
  const grams: Record<Macro, number> = { carbs: totals.carbohydrateG, protein: totals.proteinG, fat: totals.fatG };
  const sum = kcal.carbs + kcal.protein + kcal.fat;
  const macros: Macro[] = ['carbs', 'protein', 'fat'];

  return (
    <section className="card card__pad progress__macros" aria-labelledby="split-title">
      <h2 id="split-title" className="progress__card-title">
        Where your calories came from
      </h2>
      <div className="split" aria-hidden="true">
        {macros.map((macro) => (
          <span key={macro} className={`split__part split__part--${macro}`} style={{ flexGrow: kcal[macro] }} />
        ))}
      </div>
      <ul className="split__legend">
        {macros.map((macro) => (
          <li key={macro}>
            <MacroDot macro={macro} />
            <span className="split__name">{MACRO_LABEL[macro]}</span>
            <strong className="num">{sum ? Math.round((kcal[macro] / sum) * 100) : 0}%</strong>
            <span className="split__grams num">{formatGrams(grams[macro] / days.length)} a day</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TopDishes({ entries }: { entries: DiaryEntry[] }) {
  const byFood = new Map<string, { name: string; count: number; kcal: number }>();
  for (const entry of entries) {
    const item = byFood.get(entry.foodId) ?? { name: entry.foodName, count: 0, kcal: 0 };
    item.count += 1;
    item.kcal += entry.energyKcal;
    byFood.set(entry.foodId, item);
  }
  const top = [...byFood.values()].sort((a, b) => b.count - a.count || b.kcal - a.kcal).slice(0, 3);

  return (
    <section className="card progress__dishes" aria-labelledby="top-title">
      <h2 id="top-title" className="progress__card-title">
        Most logged this week
      </h2>
      <ol className="rows">
        {top.map((item) => (
          <li key={item.name} className="row">
            <span>
              <span className="progress__dish-name">{item.name}</span>
              <span className="progress__dish-count">
                {item.count} {item.count === 1 ? 'time' : 'times'}
              </span>
            </span>
            <span className="row__value num">{formatKcal(item.kcal)} kcal</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

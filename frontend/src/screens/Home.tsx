import {
  Camera,
  CaretLeft,
  CaretRight,
  Coffee,
  Fire,
  Lightning,
  MagnifyingGlass,
  Moon,
  MoonStars,
  Plus,
  Sun,
  SunHorizon,
  Trash,
  type Icon,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { CalorieRing } from '../components/CalorieRing';
import { MealPicker, ServingStepper } from '../components/Controls';
import { FoodThumb } from '../components/FoodThumb';
import { MacroDot, MACROS } from '../components/MacroCharts';
import { MacroMeter } from '../components/MacroMeter';
import { PlateGuide } from '../components/PlateGuide';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { WeekStrip } from '../components/WeekStrip';
import { addDays, fromDateKey, greeting, isDateKey, todayKey, weekDays } from '../lib/date';
import {
  byMeal,
  entriesOn,
  formatServings,
  loggingStreak,
  MEALS,
  suggestedMeal,
  sumNutrients,
  SWEETNESS,
  withServings,
} from '../lib/diary';
import { formatGrams, formatKcal } from '../lib/format';
import type { DiaryEntry, MealType } from '../lib/types';
import { useProfile } from '../state/AppState';
import { useToast } from '../state/Toast';
import './Home.css';

export const MEAL_ICON: Record<MealType, Icon> = {
  breakfast: SunHorizon,
  lunch: Sun,
  teatime: Coffee,
  dinner: Moon,
  supper: MoonStars,
};

export function entryDetail(entry: DiaryEntry): string {
  const parts = [formatServings(entry.servings, entry.servingLabel)];
  if (entry.addons.length) parts.push(`+ ${entry.addons.join(', ')}`);
  if (entry.sweetness && entry.sweetness !== 'normal') parts.push(SWEETNESS[entry.sweetness].label);
  return parts.join(' · ');
}

export function Home() {
  const [params, setParams] = useSearchParams();
  const { profile, entries, target, macros } = useProfile();
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [quickAdd, setQuickAdd] = useState<MealType | null>(null);

  const today = todayKey();
  const requested = params.get('date');
  const date = isDateKey(requested) && requested <= today ? requested : today;
  const goTo = (key: string) => setParams(key >= today ? {} : { date: key }, { replace: true });

  const dayEntries = entriesOn(entries, date);
  const totals = sumNutrients(dayEntries);
  const meals = byMeal(dayEntries);
  const remaining = target.targetKcal - totals.energyKcal;
  const over = remaining < 0;
  const percent = Math.round((totals.energyKcal / target.targetKcal) * 100);
  const streak = loggingStreak(entries, today);
  const suggested = date === today ? suggestedMeal() : 'lunch';
  const dateQuery = date === today ? '' : `&date=${date}`;

  const eatenByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of weekDays(date)) map.set(day, sumNutrients(entriesOn(entries, day)).energyKcal);
    return map;
  }, [entries, date]);

  const dayLabel = fromDateKey(date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <main className="screen home">
      <header className="home__head">
        <div>
          <p className="eyebrow">{date === today ? `Today · ${dayLabel}` : dayLabel}</p>
          <h1 className="home__greet">
            {greeting()}
            {profile.name ? `, ${profile.name}` : ''}
          </h1>
        </div>
        <div className={`streak${streak ? '' : ' streak--zero'}`} aria-label={`${streak}-day logging streak`}>
          <Fire size={18} weight="fill" />
          <span className="display">{streak}</span>
          <small>day streak</small>
        </div>
      </header>

      <div className="home__week">
        <button type="button" className="icon-button icon-button--ghost" onClick={() => goTo(addDays(date, -7))} aria-label="Previous week">
          <CaretLeft size={16} weight="bold" />
        </button>
        <WeekStrip selected={date} today={today} eatenByDate={eatenByDate} targetKcal={target.targetKcal} onSelect={goTo} />
        <button
          type="button"
          className="icon-button icon-button--ghost"
          onClick={() => goTo(addDays(date, 7) > today ? today : addDays(date, 7))}
          disabled={weekDays(date).includes(today)}
          aria-label="Next week"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      <section className={`card hero${over ? ' hero--over' : ''}`} aria-label="Calories">
        <div className="hero__top">
          <div className="hero__main">
            <p className="eyebrow">{over ? 'Over target' : 'Remaining'}</p>
            <p className="hero__value display">{formatKcal(Math.abs(remaining))}</p>
            <p className="hero__unit">kcal</p>
          </div>
          <CalorieRing
            progress={totals.energyKcal / target.targetKcal}
            size={112}
            stroke={9}
            label={over ? `${formatKcal(-remaining)} kcal over target` : `${formatKcal(remaining)} kcal remaining`}
          >
            <span className="hero__pct display">{percent}%</span>
            <span className="hero__pct-label">of target</span>
          </CalorieRing>
        </div>
        <dl className="hero__stats">
          <div>
            <dt>Target</dt>
            <dd className="display">{formatKcal(target.targetKcal)}</dd>
          </div>
          <div>
            <dt>Eaten</dt>
            <dd className="display">{formatKcal(totals.energyKcal)}</dd>
          </div>
          <div>
            <dt>Meals</dt>
            <dd className="display">{dayEntries.length}</dd>
          </div>
        </dl>
        <div className="hero__macros">
          <MacroMeter macro="protein" grams={totals.proteinG} targetGrams={macros.proteinG} />
          <MacroMeter macro="carbs" grams={totals.carbohydrateG} targetGrams={macros.carbohydrateG} />
          <MacroMeter macro="fat" grams={totals.fatG} targetGrams={macros.fatG} />
        </div>
      </section>

      <div className="actions">
        <Link to={`/scan?meal=${suggested}${dateQuery}`} className="action action--primary">
          <Camera size={20} weight="bold" />
          Scan
        </Link>
        <Link to={`/foods?meal=${suggested}${dateQuery}`} className="action">
          <MagnifyingGlass size={20} weight="bold" />
          Search
        </Link>
        <button type="button" className="action" onClick={() => setQuickAdd(suggested)}>
          <Lightning size={20} weight="bold" />
          Quick add
        </button>
      </div>

      <div className="section-head">
        <h2 className="section-title">Food log</h2>
        <span className="home__total num">{formatKcal(totals.energyKcal)} kcal</span>
      </div>

      <div className="stack">
        {MEALS.map((meal) => {
          const list = meals[meal.id];
          const mealTotals = sumNutrients(list);
          const MealIcon = MEAL_ICON[meal.id];
          return (
            <section key={meal.id} className="card meal" aria-labelledby={`meal-${meal.id}`}>
              <header className="meal__head">
                <span className="meal__icon">
                  <MealIcon size={18} weight="bold" />
                </span>
                <div className="meal__titles">
                  <h3 id={`meal-${meal.id}`}>{meal.label}</h3>
                  <p>{meal.localLabel}</p>
                </div>
                {list.length > 0 && <span className="meal__kcal display">{formatKcal(mealTotals.energyKcal)}</span>}
                <Link className="icon-button meal__add" to={`/foods?meal=${meal.id}${dateQuery}`} aria-label={`Add food to ${meal.label.toLowerCase()}`}>
                  <Plus size={16} weight="bold" />
                </Link>
              </header>
              {list.length > 0 && (
                <ul className="list meal__list">
                  {list.map((entry) => (
                    <li key={entry.id}>
                      <button type="button" className="meal-entry" onClick={() => setEditing(entry)}>
                        <FoodThumb category={entry.category} photo={entry.photo} size={40} />
                        <span className="meal-entry__text">
                          <span className="meal-entry__name">
                            {entry.foodName}
                            {entry.source === 'scan' && <Camera size={12} weight="fill" aria-label="Scanned" />}
                          </span>
                          <span className="meal-entry__meta">{entryDetail(entry)}</span>
                        </span>
                        <span className="meal-entry__right">
                          <span className="meal-entry__kcal display">{formatKcal(entry.energyKcal)}</span>
                          {entry.source !== 'quick' && (
                            <span className="meal-entry__macros num">
                              P{Math.round(entry.proteinG)} C{Math.round(entry.carbohydrateG)} F{Math.round(entry.fatG)}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="home__guide">
        <PlateGuide />
      </div>

      <p className="home__foot">Estimates for standard servings, not measured portions. Not medical advice.</p>

      {editing && <EntrySheet entry={editing} onClose={() => setEditing(null)} />}
      {quickAdd && <QuickAddSheet date={date} initialMeal={quickAdd} onClose={() => setQuickAdd(null)} />}
    </main>
  );
}

function EntrySheet({ entry, onClose }: { entry: DiaryEntry; onClose: () => void }) {
  const { updateEntry, removeEntry, addEntry } = useProfile();
  const toast = useToast();
  const [draft, setDraft] = useState(entry);
  const quick = entry.source === 'quick';

  const save = () => {
    updateEntry(draft);
    onClose();
  };

  const remove = () => {
    removeEntry(entry.id);
    onClose();
    toast({ message: `${entry.foodName} removed`, action: { label: 'Undo', onClick: () => addEntry(entry) } });
  };

  const grams = { protein: draft.proteinG, carbs: draft.carbohydrateG, fat: draft.fatG };

  return (
    <BottomSheet
      title={entry.foodName}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--danger" onClick={remove}>
            <Trash size={18} weight="bold" /> Remove
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="entry-sheet__head">
        <FoodThumb category={entry.category} photo={entry.photo} size={56} />
        <div>
          <p className="entry-sheet__serving">{quick ? 'Calories only' : entryDetail({ ...entry, servings: 1 })}</p>
          <p className="entry-sheet__per num">{formatKcal(entry.perServing.energyKcal)} kcal per serving</p>
        </div>
      </div>
      {!quick && (
        <div className="entry-sheet__row">
          <span className="eyebrow">Servings</span>
          <ServingStepper value={draft.servings} onChange={(servings) => setDraft((d) => withServings(d, servings))} label="Number of servings" />
        </div>
      )}
      <div className="entry-sheet__totals">
        <div>
          <strong className="display">{formatKcal(draft.energyKcal)}</strong>
          <span>kcal</span>
        </div>
        {!quick && (
          <ul>
            {MACROS.map((m) => (
              <li key={m}>
                <MacroDot macro={m} /> {formatGrams(grams[m])}
              </li>
            ))}
          </ul>
        )}
      </div>
      <h3 className="sheet-label">Meal</h3>
      <MealPicker value={draft.meal} onChange={(meal) => setDraft((d) => ({ ...d, meal }))} />
      {entry.source === 'scan' && entry.confidence !== undefined && (
        <p className="entry-sheet__source">
          <Camera size={14} weight="fill" /> From a scan · model confidence {Math.round(entry.confidence * 100)}%
        </p>
      )}
    </BottomSheet>
  );
}

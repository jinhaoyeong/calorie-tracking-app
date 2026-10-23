import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { CalorieRing } from '../components/CalorieRing';
import { MealPicker, ServingStepper } from '../components/Controls';
import { Icon } from '../components/Icon';
import { MacroDot, MacroMeter } from '../components/MacroMeter';
import { addDays, formatDayTitle, formatLongDate, isDateKey, todayKey } from '../lib/date';
import { byMeal, entriesOn, formatServings, MEALS, sumNutrients, withServings } from '../lib/diary';
import { formatGrams, formatKcal, formatPercent } from '../lib/format';
import type { DiaryEntry } from '../lib/types';
import { useProfile } from '../state/AppState';
import { useToast } from '../state/Toast';
import './Diary.css';

export function Diary() {
  const [params, setParams] = useSearchParams();
  const { entries, target, macros } = useProfile();
  const [editing, setEditing] = useState<DiaryEntry | null>(null);

  const today = todayKey();
  const requested = params.get('date');
  const date = isDateKey(requested) && requested <= today ? requested : today;
  const goTo = (key: string) => setParams(key === today ? {} : { date: key }, { replace: true });

  const dayEntries = entriesOn(entries, date);
  const totals = sumNutrients(dayEntries);
  const meals = byMeal(dayEntries);
  const addQuery = (meal: string) => `meal=${meal}${date === today ? '' : `&date=${date}`}`;

  return (
    <main className="screen diary">
      <header className="diary__header">
        <button type="button" className="icon-button" onClick={() => goTo(addDays(date, -1))} aria-label="Previous day">
          <Icon name="chevronLeft" />
        </button>
        <div className="diary__date">
          <h1>{formatDayTitle(date, today)}</h1>
          <p>{formatLongDate(date)}</p>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => goTo(addDays(date, 1))}
          disabled={date >= today}
          aria-label="Next day"
        >
          <Icon name="chevronRight" />
        </button>
      </header>

      <section className="card summary" aria-label="Calories">
        <div className="summary__top">
          <CalorieRing targetKcal={target.targetKcal} eatenKcal={totals.energyKcal} size={140} />
          <dl className="summary__figures">
            <div>
              <dt>Daily target</dt>
              <dd className="num">{formatKcal(target.targetKcal)}</dd>
            </div>
            <div>
              <dt>Eaten</dt>
              <dd className="num">{formatKcal(totals.energyKcal)}</dd>
            </div>
            <div>
              <dt>Of target</dt>
              <dd className="num">{formatPercent(totals.energyKcal / target.targetKcal)}</dd>
            </div>
          </dl>
        </div>
        <div className="summary__macros">
          <MacroMeter macro="carbs" grams={totals.carbohydrateG} targetGrams={macros.carbohydrateG} />
          <MacroMeter macro="protein" grams={totals.proteinG} targetGrams={macros.proteinG} />
          <MacroMeter macro="fat" grams={totals.fatG} targetGrams={macros.fatG} />
        </div>
      </section>

      {MEALS.map((meal) => {
        const list = meals[meal.id];
        const mealKcal = sumNutrients(list).energyKcal;
        return (
          <section key={meal.id} className="card meal" aria-labelledby={`meal-${meal.id}`}>
            <header className="meal__header">
              <h2 id={`meal-${meal.id}`}>{meal.label}</h2>
              {list.length > 0 && <span className="meal__kcal num">{formatKcal(mealKcal)} kcal</span>}
            </header>
            {list.length > 0 && (
              <ul className="meal__entries">
                {list.map((entry) => (
                  <li key={entry.id}>
                    <button type="button" className="entry" onClick={() => setEditing(entry)}>
                      <span className="entry__text">
                        <span className="entry__name">{entry.foodName}</span>
                        <span className="entry__meta">
                          {formatServings(entry.servings)} · {entry.servingLabel}
                          {entry.source === 'scan' && (
                            <span className="entry__scanned">
                              <Icon name="camera" size={13} strokeWidth={2} /> Scanned
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="entry__kcal num">{formatKcal(entry.energyKcal)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="meal__footer">
              <Link className="text-button" to={`/dishes?${addQuery(meal.id)}`}>
                <Icon name="plus" size={18} strokeWidth={2} /> Add food
              </Link>
              <Link className="meal__scan" to={`/scan?${addQuery(meal.id)}`} aria-label={`Scan a dish for ${meal.label.toLowerCase()}`}>
                <Icon name="camera" size={20} />
              </Link>
            </div>
          </section>
        );
      })}

      <p className="diary__footnote">
        Calories are estimates for standard servings, not measured portions. For general guidance only.
      </p>

      {editing && <EntrySheet entry={editing} onClose={() => setEditing(null)} />}
    </main>
  );
}

function EntrySheet({ entry, onClose }: { entry: DiaryEntry; onClose: () => void }) {
  const { updateEntry, removeEntry, addEntry } = useProfile();
  const toast = useToast();
  const [draft, setDraft] = useState(entry);

  const save = () => {
    updateEntry(draft);
    onClose();
  };

  const remove = () => {
    removeEntry(entry.id);
    onClose();
    toast({ message: `${entry.foodName} removed`, action: { label: 'Undo', onClick: () => addEntry(entry) } });
  };

  return (
    <BottomSheet
      title={entry.foodName}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--danger" onClick={remove}>
            <Icon name="trash" size={20} /> Remove
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <p className="entry-sheet__serving">
        {entry.servingLabel} per serving · {formatKcal(entry.perServing.energyKcal)} kcal
      </p>
      <div className="entry-sheet__row">
        <span>Servings</span>
        <ServingStepper
          value={draft.servings}
          onChange={(servings) => setDraft((d) => withServings(d, servings))}
          label="Number of servings"
        />
      </div>
      <div className="entry-sheet__totals">
        <div>
          <strong className="num">{formatKcal(draft.energyKcal)}</strong> kcal
        </div>
        <ul>
          <li>
            <MacroDot macro="carbs" /> {formatGrams(draft.carbohydrateG)}
          </li>
          <li>
            <MacroDot macro="protein" /> {formatGrams(draft.proteinG)}
          </li>
          <li>
            <MacroDot macro="fat" /> {formatGrams(draft.fatG)}
          </li>
        </ul>
      </div>
      <h3 className="section-label">Meal</h3>
      <MealPicker value={draft.meal} onChange={(meal) => setDraft((d) => ({ ...d, meal }))} />
      {entry.source === 'scan' && entry.confidence !== undefined && (
        <p className="entry-sheet__source">
          <Icon name="camera" size={16} /> Added from a scan · model confidence {formatPercent(entry.confidence)}
        </p>
      )}
    </BottomSheet>
  );
}

import { Check, Info, Plus, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addonsFor } from '../lib/foods';
import {
  createEntry,
  entriesOn,
  MEAL_LABEL,
  nutrientsFor,
  servingNutrients,
  shareOfTarget,
  sumNutrients,
  SWEETNESS,
} from '../lib/diary';
import { formatGrams, formatKcal } from '../lib/format';
import { makeThumbnail } from '../lib/image';
import type { Addon, Food, MealType, Sweetness } from '../lib/types';
import { useProfile } from '../state/AppState';
import { useToast } from '../state/Toast';
import { MealPicker, Segmented, ServingStepper, Switch } from './Controls';
import { MacroDot } from './MacroMeter';
import './LogFood.css';

interface Props {
  food: Food;
  date: string;
  initialMeal: MealType;
  source: 'scan' | 'manual';
  confidence?: number;
  /** The scanned photo; when present the user can choose to keep a thumbnail. */
  photo?: Blob;
}

const SWEETNESS_OPTIONS = (Object.keys(SWEETNESS) as Sweetness[]).map((value) => ({ value, label: SWEETNESS[value].label }));

export function LogFood({ food, date, initialMeal, source, confidence, photo }: Props) {
  const { entries, target, preferences, setPreferences, addEntry, removeEntry } = useProfile();
  const navigate = useNavigate();
  const toast = useToast();
  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [sweetness, setSweetness] = useState<Sweetness>('normal');
  const [saving, setSaving] = useState(false);

  const availableAddons = addonsFor(food);
  const chosen: Addon[] = availableAddons.filter((a) => selectedAddons.includes(a.id));
  const perServing = servingNutrients(food, chosen, sweetness);
  const portion = nutrientsFor(perServing, servings);

  const eatenKcal = sumNutrients(entriesOn(entries, date)).energyKcal;
  const afterKcal = eatenKcal + portion.energyKcal;
  const remainingAfter = target.targetKcal - afterKcal;
  const scale = Math.max(target.targetKcal, afterKcal);

  const toggleAddon = (id: string) =>
    setSelectedAddons((current) => (current.includes(id) ? current.filter((a) => a !== id) : [...current, id]));

  const add = async () => {
    setSaving(true);
    const thumbnail = photo && preferences.savePhotos ? await makeThumbnail(photo) : undefined;
    const entry = createEntry({
      food,
      servings,
      meal,
      date,
      source,
      addons: chosen,
      sweetness: food.sugarG ? sweetness : undefined,
      confidence,
      photo: thumbnail,
    });
    addEntry(entry);
    toast({
      message: `${food.name} added to ${MEAL_LABEL[meal].toLowerCase()}`,
      action: { label: 'Undo', onClick: () => removeEntry(entry.id) },
    });
    navigate(`/?date=${date}`);
  };

  return (
    <div className="log">
      <section className="card log__block" aria-labelledby="portion-title">
        <div className="log__row">
          <div>
            <h2 id="portion-title" className="log__title">
              Portion
            </h2>
            <p className="log__sub">
              {food.serving.localLabel}
              {food.serving.grams > 0 && food.category !== 'drinks' && ` · about ${food.serving.grams} g`}
            </p>
          </div>
          <ServingStepper value={servings} onChange={setServings} label="Number of servings" />
        </div>

        {availableAddons.length > 0 && (
          <div className="log__group">
            <h3 className="log__label">Tambah</h3>
            <div className="chips">
              {availableAddons.map((addon) => {
                const on = selectedAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    className="chip"
                    aria-pressed={on}
                    onClick={() => toggleAddon(addon.id)}
                    title={addon.description}
                  >
                    {on ? <Check size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
                    {addon.name}
                    <span className="chip__meta num">{formatKcal(addon.energyKcal)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {food.sugarG ? (
          <div className="log__group">
            <h3 className="log__label">Sweetness</h3>
            <Segmented options={SWEETNESS_OPTIONS} value={sweetness} onChange={setSweetness} label="Sweetness" />
            <p className="log__hint">{SWEETNESS[sweetness].detail}</p>
          </div>
        ) : null}

        <div className="log__totals">
          <div className="log__kcal">
            <strong className="num">{formatKcal(portion.energyKcal)}</strong>
            <span>kcal</span>
          </div>
          <dl className="log__macros">
            <div>
              <dt>
                <MacroDot macro="carbs" /> Carbs
              </dt>
              <dd className="num">{formatGrams(portion.carbohydrateG)}</dd>
            </div>
            <div>
              <dt>
                <MacroDot macro="protein" /> Protein
              </dt>
              <dd className="num">{formatGrams(portion.proteinG)}</dd>
            </div>
            <div>
              <dt>
                <MacroDot macro="fat" /> Fat
              </dt>
              <dd className="num">{formatGrams(portion.fatG)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="card log__block" aria-labelledby="impact-title">
        <h2 id="impact-title" className="log__title">
          Your day after this
        </h2>
        <div className="log__bar" aria-hidden="true">
          {eatenKcal > 0 && <span className="log__bar-eaten" style={{ width: `${(eatenKcal / scale) * 100}%` }} />}
          <span
            className={`log__bar-meal${remainingAfter < 0 ? ' is-over' : ''}`}
            style={{ width: `${(portion.energyKcal / scale) * 100}%` }}
          />
        </div>
        <ul className="log__legend">
          <li>
            <span className="log__swatch log__swatch--eaten" /> Eaten <strong className="num">{formatKcal(eatenKcal)}</strong>
          </li>
          <li>
            <span className={`log__swatch${remainingAfter < 0 ? ' is-over' : ''}`} /> This meal{' '}
            <strong className="num">{formatKcal(portion.energyKcal)}</strong>
          </li>
          <li className="log__legend-target num">of {formatKcal(target.targetKcal)}</li>
        </ul>
        <div className="log__stats">
          <div>
            <span>Share of daily target</span>
            <strong className="num">{shareOfTarget(portion.energyKcal, target.targetKcal)}%</strong>
          </div>
          <div>
            <span>{remainingAfter < 0 ? 'Over target' : 'Left after'}</span>
            <strong className={`num${remainingAfter < 0 ? ' log__over' : ''}`}>
              {remainingAfter < 0 && <Warning size={16} weight="bold" />}
              {formatKcal(Math.abs(remainingAfter))} kcal
            </strong>
          </div>
        </div>
      </section>

      <section className="log__meal" aria-labelledby="meal-title">
        <h2 id="meal-title" className="log__label">
          Add to
        </h2>
        <MealPicker value={meal} onChange={setMeal} />
      </section>

      {photo && (
        <div className="card log__photo">
          <div>
            <strong>Keep photo in diary</strong>
            <span>Saved on this phone only, never uploaded</span>
          </div>
          <Switch
            checked={preferences.savePhotos}
            onChange={(savePhotos) => setPreferences({ ...preferences, savePhotos })}
            label="Keep photo in diary"
          />
        </div>
      )}

      <p className="log__disclaimer">
        <Info size={16} weight="bold" />
        Calories are for the standard serving shown. The photo identifies the dish only and doesn’t measure your portion.
        Not medical advice.
      </p>

      <div className="cta-bar">
        <button type="button" className="btn btn--primary" onClick={add} disabled={saving}>
          Add to {MEAL_LABEL[meal].toLowerCase()} · {formatKcal(portion.energyKcal)} kcal
        </button>
      </div>
    </div>
  );
}

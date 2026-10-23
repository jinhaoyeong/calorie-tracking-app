import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createEntry,
  entriesOn,
  formatServings,
  MEAL_LABEL,
  nutrientsFor,
  shareOfTarget,
  sumNutrients,
} from '../lib/diary';
import { formatGrams, formatKcal } from '../lib/format';
import type { DiaryEntry, Food, MealType } from '../lib/types';
import { useProfile } from '../state/AppState';
import { useToast } from '../state/Toast';
import { MealPicker, ServingStepper } from './Controls';
import { Icon } from './Icon';
import { MacroDot } from './MacroMeter';
import './LogFoodForm.css';

interface Props {
  food: Food;
  date: string;
  initialMeal: MealType;
  source: DiaryEntry['source'];
  confidence?: number;
}

export function LogFoodForm({ food, date, initialMeal, source, confidence }: Props) {
  const { entries, target, addEntry, removeEntry } = useProfile();
  const navigate = useNavigate();
  const toast = useToast();
  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<MealType>(initialMeal);

  const portion = nutrientsFor(food, servings);
  const eatenKcal = sumNutrients(entriesOn(entries, date)).energyKcal;
  const afterKcal = eatenKcal + portion.energyKcal;
  const remainingAfter = target.targetKcal - afterKcal;
  const scale = Math.max(target.targetKcal, afterKcal);

  const add = () => {
    const entry = createEntry({ food, servings, meal, date, source, confidence });
    addEntry(entry);
    toast({
      message: `${food.name} added to ${MEAL_LABEL[meal].toLowerCase()}`,
      action: { label: 'Undo', onClick: () => removeEntry(entry.id) },
    });
    navigate(`/?date=${date}`);
  };

  return (
    <>
      <section className="card card__pad log-serving" aria-labelledby="serving-heading">
        <div className="log-serving__head">
          <div>
            <h2 id="serving-heading" className="log-serving__title">
              Standard serving
            </h2>
            <p className="log-serving__portion">
              {food.serving.label} · about {food.serving.grams} g
            </p>
          </div>
          <ServingStepper value={servings} onChange={setServings} label="Number of servings" />
        </div>

        <div className="log-serving__energy">
          <span className="log-serving__kcal">{formatKcal(portion.energyKcal)}</span>
          <span className="log-serving__unit">kcal</span>
          <span className="log-serving__count">{formatServings(servings)}</span>
        </div>

        <dl className="log-serving__macros">
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
      </section>

      <section className="card card__pad log-impact" aria-labelledby="impact-heading">
        <h2 id="impact-heading" className="log-impact__title">
          Your day with this meal
        </h2>
        <div className="log-impact__bar" aria-hidden="true">
          {eatenKcal > 0 && <span className="log-impact__eaten" style={{ width: `${(eatenKcal / scale) * 100}%` }} />}
          <span
            className={`log-impact__meal${remainingAfter < 0 ? ' log-impact__meal--over' : ''}`}
            style={{ width: `${(portion.energyKcal / scale) * 100}%` }}
          />
          {afterKcal > target.targetKcal && (
            <span className="log-impact__target" style={{ left: `${(target.targetKcal / scale) * 100}%` }} />
          )}
        </div>
        <ul className="log-impact__legend">
          <li>
            <span className="swatch swatch--eaten" /> Already eaten <strong className="num">{formatKcal(eatenKcal)}</strong>
          </li>
          <li>
            <span className="swatch swatch--meal" /> This meal <strong className="num">{formatKcal(portion.energyKcal)}</strong>
          </li>
        </ul>
        <dl className="log-impact__stats">
          <div>
            <dt>Share of daily target</dt>
            <dd className="num">{shareOfTarget(portion.energyKcal, target.targetKcal)}%</dd>
          </div>
          <div>
            <dt>{remainingAfter < 0 ? 'Over target after' : 'Remaining after'}</dt>
            <dd className={`num${remainingAfter < 0 ? ' log-impact__over' : ''}`}>
              {remainingAfter < 0 && <Icon name="alert" size={16} />}
              {formatKcal(Math.abs(remainingAfter))} kcal
            </dd>
          </div>
        </dl>
        <p className="log-impact__target-note num">Daily target {formatKcal(target.targetKcal)} kcal</p>
      </section>

      <div className="log-meal">
        <h2 className="section-label">Add to</h2>
        <MealPicker value={meal} onChange={setMeal} />
      </div>

      <p className="note log-disclaimer">
        <Icon name="info" size={18} />
        <span>
          Calories are for a <strong>standard serving</strong>. The photo identifies the dish only; it does not measure the
          portion in front of you. Not medical or dietary advice.
        </span>
      </p>

      <div className="cta-bar">
        <button type="button" className="btn btn--primary" onClick={add}>
          Add to {MEAL_LABEL[meal].toLowerCase()} · {formatKcal(portion.energyKcal)} kcal
        </button>
      </div>
    </>
  );
}

import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { DishRowContent } from '../components/DishRow';
import { FoodGlyph } from '../components/FoodGlyph';
import { Icon } from '../components/Icon';
import { LogFoodForm } from '../components/LogFoodForm';
import type { PredictResult } from '../lib/api';
import { FOODS, findFood } from '../lib/foods';
import { formatPercent } from '../lib/format';
import type { MealType } from '../lib/types';
import './ScanResult.css';

interface Props {
  photoUrl: string;
  result: PredictResult;
  date: string;
  meal: MealType;
  onRetake: () => void;
}

export function ScanResult({ photoUrl, result, date, meal, onRetake }: Props) {
  const top = result.predictions[0];
  const [selectedId, setSelectedId] = useState(top.foodId);
  const [picking, setPicking] = useState(false);

  const food = findFood(selectedId);
  const prediction = result.predictions.find((p) => p.foodId === selectedId);
  const name = food?.name ?? prediction?.name ?? selectedId;
  const isTop = selectedId === top.foodId;
  const demo = result.model.mode === 'demo';
  const alternatives = result.predictions.filter((p) => p.foodId !== selectedId);
  const lowConfidence = prediction !== undefined && prediction.confidence < result.confidenceThreshold;

  return (
    <main className={`screen ${food ? 'screen--cta' : 'screen--plain'} result`}>
      <div className="topbar">
        <button type="button" className="icon-button" onClick={onRetake} aria-label="Retake photo">
          <Icon name="chevronLeft" />
        </button>
        <span className="topbar__title">Scan result</span>
        <button type="button" className="icon-button" onClick={onRetake} aria-label="Scan another photo">
          <Icon name="retake" size={21} />
        </button>
      </div>

      <figure className="result__photo">
        <img src={photoUrl} alt="Your photo" />
        <figcaption className="result__model">
          <Icon name="chip" size={14} />
          {demo ? 'Demo classifier' : result.model.name} · {Math.round(result.inferenceMs)} ms
        </figcaption>
      </figure>

      {demo && (
        <p className="note note--warning result__demo">
          <Icon name="info" size={18} />
          <span>
            <strong>Demo mode.</strong> No trained model is connected yet, so this suggestion is a placeholder. Check the
            dish yourself before adding it.
          </span>
        </p>
      )}

      <section className="card card__pad result__match" aria-labelledby="match-name">
        <p className="result__eyebrow">{isTop ? 'Best match' : 'Your choice'}</p>
        <div className="result__dish">
          {food && <FoodGlyph category={food.category} size={48} />}
          <div>
            <h1 id="match-name" className="result__name">
              {name}
            </h1>
            {food && <p className="result__local">{food.localName}</p>}
          </div>
        </div>
        {food && <p className="result__description">{food.description}</p>}

        {prediction ? (
          <div className={`confidence${lowConfidence ? ' confidence--low' : ''}`}>
            <div className="confidence__label">
              <span>Model confidence</span>
              <strong className="num">{formatPercent(prediction.confidence)}</strong>
            </div>
            <div
              className="confidence__track"
              role="meter"
              aria-label="Model confidence"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(prediction.confidence * 100)}
            >
              <span className="confidence__fill" style={{ width: `${prediction.confidence * 100}%` }} />
              <span
                className="confidence__threshold"
                style={{ left: `${result.confidenceThreshold * 100}%` }}
                title={`Low-confidence threshold ${formatPercent(result.confidenceThreshold)}`}
              />
            </div>
          </div>
        ) : (
          <p className="result__manual">Chosen by you from the dish list</p>
        )}

        {lowConfidence && (
          <p className="note note--warning result__low">
            <Icon name="alert" size={18} />
            <span>
              <strong>Low confidence.</strong> The photo may show a different dish, or one the app doesn’t recognise yet.
              Check it before adding.
            </span>
          </p>
        )}

        <div className="result__alternatives">
          <p>Not right? Choose another</p>
          <ul>
            {alternatives.map((alt) => (
              <li key={alt.foodId}>
                <button type="button" className="chip" onClick={() => setSelectedId(alt.foodId)}>
                  {alt.name} <span className="num">{formatPercent(alt.confidence)}</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="chip chip--outline" onClick={() => setPicking(true)}>
                All dishes
              </button>
            </li>
          </ul>
        </div>
      </section>

      {food ? (
        <LogFoodForm food={food} date={date} initialMeal={meal} source="scan" confidence={prediction?.confidence} />
      ) : (
        <div className="note note--danger result__missing" role="alert">
          <Icon name="alert" size={20} />
          <span>
            <strong>No nutrition data for {name}.</strong> This dish isn’t in the nutrition table yet, so it can’t be
            added. Choose the dish from the list instead.
          </span>
        </div>
      )}

      {picking && (
        <BottomSheet title="Choose the dish" onClose={() => setPicking(false)}>
          <ul className="dish-list">
            {FOODS.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="dish-row"
                  onClick={() => {
                    setSelectedId(option.id);
                    setPicking(false);
                  }}
                >
                  <DishRowContent
                    food={option}
                    trailing={
                      option.id === selectedId ? (
                        <Icon name="check" size={20} className="dish-row__selected" />
                      ) : (
                        <span className="dish-row__spacer" />
                      )
                    }
                  />
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </main>
  );
}

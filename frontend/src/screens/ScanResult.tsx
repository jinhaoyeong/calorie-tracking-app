import { ArrowsClockwise, CaretLeft, Check, Cpu, Info, MagnifyingGlass, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { FoodRowContent } from '../components/FoodRow';
import { LogFood } from '../components/LogFood';
import type { PredictResult } from '../lib/api';
import { findFood, isVisible, searchFoods } from '../lib/foods';
import { formatConfidence } from '../lib/format';
import type { MealType } from '../lib/types';
import { useApp } from '../state/AppState';
import './ScanResult.css';

interface Props {
  photoUrl: string;
  photo: Blob;
  result: PredictResult;
  date: string;
  meal: MealType;
  onRetake: () => void;
}

export function ScanResult({ photoUrl, photo, result, date, meal, onRetake }: Props) {
  const { allFoods, customFoods, preferences } = useApp();
  const top = result.predictions[0];
  const [selectedId, setSelectedId] = useState(top.foodId);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');

  const food = findFood(selectedId, customFoods);
  const prediction = result.predictions.find((p) => p.foodId === selectedId);
  const name = food?.name ?? prediction?.name ?? selectedId;
  const isTop = selectedId === top.foodId;
  const demo = result.model.mode === 'demo';
  const alternatives = result.predictions.filter((p) => p.foodId !== selectedId);
  const lowConfidence = prediction !== undefined && prediction.confidence < result.confidenceThreshold;
  const percent = prediction ? Math.round(prediction.confidence * 100) : 0;
  const pickable = searchFoods(query, allFoods.filter((f) => isVisible(f, preferences.halalOnly)));

  return (
    <main className={`screen ${food ? 'screen--cta' : 'screen--plain'} result`}>
      <div className="result__hero">
        <img src={photoUrl} alt="Your photo" />
        <div className="result__bar">
          <button type="button" className="result__round" onClick={onRetake} aria-label="Back to camera">
            <CaretLeft size={20} weight="bold" />
          </button>
          <button type="button" className="result__round" onClick={onRetake} aria-label="Scan another photo">
            <ArrowsClockwise size={20} weight="bold" />
          </button>
        </div>
        <span className="result__model">
          <Cpu size={14} weight="bold" />
          {demo ? 'Demo classifier' : result.model.name} · {Math.round(result.inferenceMs)} ms
        </span>
      </div>

      <div className="result__sheet">
        {demo && (
          <p className="notice notice--warning result__demo">
            <Info size={18} weight="fill" />
            <span>
              <strong>Demo mode.</strong> No trained model is connected yet, so this suggestion is a placeholder. Check the
              dish before adding it.
            </span>
          </p>
        )}

        <div className="result__match">
          <div className="result__titles">
            <p className="result__eyebrow">{isTop ? 'Best match' : 'Your choice'}</p>
            <h1 className="result__name">{name}</h1>
            {food?.localName && food.localName !== food.name && <p className="result__local">{food.localName}</p>}
          </div>
        </div>

        {prediction ? (
          <div className={`confidence${lowConfidence ? ' confidence--low' : ''}`}>
            <div className="confidence__head">
              <span className="confidence__pill num">
                {lowConfidence ? <Warning size={14} weight="fill" /> : <Check size={14} weight="bold" />}
                {percent}% match
              </span>
              <span className="confidence__note">
                {lowConfidence ? 'Low confidence, please check' : 'Model confidence'}
              </span>
            </div>
            <div
              className="confidence__track"
              role="meter"
              aria-label="Model confidence"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <span className="confidence__fill" style={{ width: `${percent}%` }} />
              <span className="confidence__threshold" style={{ left: `${result.confidenceThreshold * 100}%` }} />
            </div>
            {lowConfidence && (
              <p className="confidence__help">
                The photo may show a different dish, or one the camera doesn’t know yet. Pick the right one below if needed.
              </p>
            )}
          </div>
        ) : (
          <p className="result__manual">Chosen by you</p>
        )}

        <div className="result__alts">
          <p className="result__alts-title">Not right? Choose another</p>
          <div className="chips chips--scroll">
            {alternatives.map((alt) => {
              return (
                <button key={alt.foodId} type="button" className="chip" onClick={() => setSelectedId(alt.foodId)}>
                  {alt.name}
                  <span className="chip__meta num">{formatConfidence(alt.confidence)}</span>
                </button>
              );
            })}
            <button type="button" className="chip" onClick={() => setPicking(true)}>
              <MagnifyingGlass size={16} weight="bold" /> Other food
            </button>
          </div>
        </div>

        {food ? (
          <div className="result__log">
            <LogFood
              key={food.id}
              food={food}
              date={date}
              initialMeal={meal}
              source="scan"
              confidence={prediction?.confidence}
              photo={photo}
              initialAddons={prediction?.addons}
            />
          </div>
        ) : (
          <div className="notice notice--danger result__missing" role="alert">
            <Warning size={20} weight="fill" />
            <span>
              <strong>No nutrition data for {name}.</strong> This dish isn’t in the nutrition table yet, so it can’t be added.
              Choose another food instead.
            </span>
          </div>
        )}
      </div>

      {picking && (
        <BottomSheet title="Choose the food" onClose={() => setPicking(false)}>
          <label className="search result__search">
            <MagnifyingGlass size={20} weight="bold" />
            <span className="visually-hidden">Search foods</span>
            <input type="search" placeholder="Search foods" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="list">
            {pickable.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="food-row"
                  onClick={() => {
                    setSelectedId(option.id);
                    setPicking(false);
                  }}
                >
                  <FoodRowContent
                    food={option}
                    trailing={option.id === selectedId ? <Check size={20} weight="bold" className="result__picked" /> : <span className="result__spacer" />}
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

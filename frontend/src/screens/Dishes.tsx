import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DishRowContent } from '../components/DishRow';
import { Icon } from '../components/Icon';
import { isDateKey } from '../lib/date';
import { isMealType, MEAL_LABEL } from '../lib/diary';
import { NUTRITION_BASIS, NUTRITION_SOURCE_URL, searchFoods } from '../lib/foods';
import './Dishes.css';

export function Dishes() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const meal = params.get('meal');
  const date = params.get('date');
  const picking = isMealType(meal);

  const forward = new URLSearchParams();
  if (picking) forward.set('meal', meal);
  if (isDateKey(date)) forward.set('date', date);
  const suffix = forward.toString() ? `?${forward.toString()}` : '';
  const results = searchFoods(query);

  return (
    <main className="screen dishes">
      {picking ? (
        <div className="topbar">
          <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="chevronLeft" />
          </button>
          <h1 className="topbar__title">Add to {MEAL_LABEL[meal].toLowerCase()}</h1>
          <span />
        </div>
      ) : (
        <>
          <h1 className="page-title">Dishes</h1>
          <p className="page-subtitle">Standard-serving nutrition for the 10 supported dishes</p>
        </>
      )}

      <label className="search">
        <Icon name="search" size={20} />
        <span className="visually-hidden">Search dishes</span>
        <input
          type="search"
          placeholder="Search, e.g. nasi ayam"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          enterKeyHint="search"
        />
      </label>

      {picking && (
        <Link className="card dishes__scan" to={`/scan${suffix}`}>
          <span className="dishes__scan-icon">
            <Icon name="camera" size={22} />
          </span>
          <span className="dishes__scan-text">
            <strong>Scan a photo instead</strong>
            <span>Let the camera suggest the dish</span>
          </span>
          <Icon name="chevronRight" size={18} />
        </Link>
      )}

      {results.length > 0 ? (
        <ul className="card dish-list dishes__list">
          {results.map((food) => (
            <li key={food.id}>
              <Link className="dish-row" to={`/dishes/${food.id}${suffix}`}>
                <DishRowContent food={food} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="dishes__empty">
          <p>
            <strong>No dishes match “{query.trim()}”.</strong>
          </p>
          <p>Pinggan currently covers 10 Malaysian dishes. More will be added as the model grows.</p>
        </div>
      )}

      <p className="dishes__source">
        {NUTRITION_BASIS}{' '}
        <a href={NUTRITION_SOURCE_URL} target="_blank" rel="noreferrer">
          MyFCD
        </a>
      </p>
    </main>
  );
}

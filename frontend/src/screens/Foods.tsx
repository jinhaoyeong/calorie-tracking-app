import { Camera, CaretLeft, Lightning, MagnifyingGlass, NotePencil, SealCheck, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FoodArt } from '../art/FoodArt';
import { FoodRowContent } from '../components/FoodRow';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { isDateKey, todayKey } from '../lib/date';
import { isMealType, MEAL_LABEL, recentFoodIds, suggestedMeal } from '../lib/diary';
import { CATEGORIES, findFood, isVisible, NUTRITION_BASIS, searchFoods } from '../lib/foods';
import { formatKcal } from '../lib/format';
import type { Food, FoodCategory } from '../lib/types';
import { useApp } from '../state/AppState';
import './Foods.css';

type Filter = 'all' | 'mine' | FoodCategory;

export function Foods() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { allFoods, customFoods, preferences, entries } = useApp();
  const [query, setQuery] = useState('');
  const [quickAdd, setQuickAdd] = useState(false);

  const meal = params.get('meal');
  const date = params.get('date');
  const picking = isMealType(meal);
  const filterParam = params.get('category');
  const filter: Filter =
    filterParam === 'mine' || CATEGORIES.some((c) => c.id === filterParam) ? (filterParam as Filter) : 'all';
  const setFilter = (next: Filter) => {
    const updated = new URLSearchParams(params);
    if (next === 'all') updated.delete('category');
    else updated.set('category', next);
    setParams(updated, { replace: true });
  };

  const forward = new URLSearchParams();
  if (picking) forward.set('meal', meal);
  if (isDateKey(date)) forward.set('date', date);
  const suffix = forward.toString() ? `?${forward.toString()}` : '';

  const visible = allFoods.filter((food) => isVisible(food, preferences.halalOnly));
  const hiddenCount = allFoods.length - visible.length;
  const recents = recentFoodIds(entries)
    .map((id) => findFood(id, customFoods))
    .filter((food): food is Food => Boolean(food) && isVisible(food as Food, preferences.halalOnly));
  const scanReady = visible.filter((food) => food.scan);

  const searching = query.trim().length > 0;
  const filtered = searching
    ? searchFoods(query, visible)
    : filter === 'mine'
      ? visible.filter((food) => food.custom)
      : filter === 'all'
        ? visible
        : visible.filter((food) => food.category === filter);

  const row = (food: Food) => (
    <li key={food.id}>
      <Link className="food-row" to={`/foods/${food.id}${suffix}`}>
        <FoodRowContent food={food} />
      </Link>
    </li>
  );

  return (
    <main className="screen foods">
      {picking ? (
        <div className="topbar">
          <button type="button" className="round-button" onClick={() => navigate(-1)} aria-label="Back">
            <CaretLeft size={20} weight="bold" />
          </button>
          <h1 className="topbar__title">Add to {MEAL_LABEL[meal].toLowerCase()}</h1>
          <span />
        </div>
      ) : (
        <div className="page-head">
          <div>
            <h1 className="page-title">Foods</h1>
            <p className="page-sub">{visible.length} Malaysian foods and drinks</p>
          </div>
          <Link to={`/foods/new${suffix}`} className="round-button" aria-label="Create your own food">
            <NotePencil size={20} weight="bold" />
          </Link>
        </div>
      )}

      <label className="search">
        <MagnifyingGlass size={20} weight="bold" />
        <span className="visually-hidden">Search foods</span>
        <input
          type="search"
          placeholder="Cari makanan… nasi lemak, teh tarik"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="search__clear" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={14} weight="bold" />
          </button>
        )}
      </label>

      {!searching && (
        <div className="chips chips--scroll foods__filters" role="radiogroup" aria-label="Category">
          {(['all', ...CATEGORIES.map((c) => c.id), 'mine'] as Filter[]).map((id) => (
            <button key={id} type="button" role="radio" aria-checked={filter === id} className="chip" onClick={() => setFilter(id)}>
              {id === 'all' ? 'All' : id === 'mine' ? 'My foods' : CATEGORIES.find((c) => c.id === id)?.name}
            </button>
          ))}
        </div>
      )}

      {picking && !searching && filter === 'all' && (
        <div className="foods__shortcuts">
          <Link to={`/scan${suffix}`} className="shortcut shortcut--scan">
            <Camera size={22} weight="fill" />
            <span>Scan</span>
          </Link>
          <button type="button" className="shortcut" onClick={() => setQuickAdd(true)}>
            <Lightning size={22} weight="fill" />
            <span>Quick add</span>
          </button>
          <Link to={`/foods/new${suffix}`} className="shortcut">
            <NotePencil size={22} weight="fill" />
            <span>Create</span>
          </Link>
        </div>
      )}

      {preferences.halalOnly && hiddenCount > 0 && (
        <p className="foods__halal">
          <SealCheck size={16} weight="fill" /> Halal-friendly only · {hiddenCount} foods with pork hidden
        </p>
      )}

      {!searching && filter === 'all' ? (
        <>
          {recents.length > 0 && (
            <>
              <div className="section-head">
                <h2 className="section-title">Recent</h2>
              </div>
              <div className="carousel">
                {recents.map((food) => (
                  <Link key={food.id} to={`/foods/${food.id}${suffix}`} className="tile">
                    <FoodArt foodId={food.id} category={food.category} size={96} />
                    <span className="tile__name">{food.name}</span>
                    <span className="tile__kcal num">{formatKcal(food.energyKcal)} kcal</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="section-head">
            <h2 className="section-title">Camera recognises</h2>
            <Link to={`/scan${suffix}`} className="section-link">
              Scan
            </Link>
          </div>
          <div className="carousel">
            {scanReady.map((food) => (
              <Link key={food.id} to={`/foods/${food.id}${suffix}`} className="tile">
                <FoodArt foodId={food.id} category={food.category} size={96} />
                <span className="tile__name">{food.name}</span>
                <span className="tile__kcal num">{formatKcal(food.energyKcal)} kcal</span>
              </Link>
            ))}
          </div>

          {CATEGORIES.map((category) => {
            const list = visible.filter((food) => food.category === category.id);
            if (!list.length) return null;
            return (
              <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                <div className="section-head">
                  <h2 id={`cat-${category.id}`} className="section-title">
                    {category.name} <span className="foods__local">{category.localName}</span>
                  </h2>
                  <button type="button" className="section-link" onClick={() => setFilter(category.id)}>
                    See all
                  </button>
                </div>
                <ul className="card list">{list.slice(0, 4).map(row)}</ul>
              </section>
            );
          })}
        </>
      ) : filtered.length > 0 ? (
        <ul className="card list foods__results">{filtered.map(row)}</ul>
      ) : (
        <div className="foods__empty">
          <p className="foods__empty-title">
            {searching ? `No match for “${query.trim()}”` : filter === 'mine' ? 'No foods of your own yet' : 'Nothing here yet'}
          </p>
          <p>Add home cooking or a stall favourite with your own calories.</p>
          <Link
            to={`/foods/new?${new URLSearchParams({ ...Object.fromEntries(forward), ...(searching ? { name: query.trim() } : {}) })}`}
            className="btn btn--primary"
          >
            <NotePencil size={20} weight="bold" /> Create {searching ? `“${query.trim()}”` : 'a food'}
          </Link>
        </div>
      )}

      <p className="foods__source">{NUTRITION_BASIS}</p>

      {quickAdd && (
        <QuickAddSheet
          date={isDateKey(date) ? date : todayKey()}
          initialMeal={picking ? meal : suggestedMeal()}
          onClose={() => setQuickAdd(false)}
          onAdded={() => navigate(`/${isDateKey(date) ? `?date=${date}` : ''}`)}
        />
      )}
    </main>
  );
}

import { Camera, CaretLeft, NotePencil, Trash, Warning } from '@phosphor-icons/react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LogFood } from '../components/LogFood';
import { energyShares, gramsOf, MACRO_LABEL, MacroDonut, MacroDot, MACROS } from '../components/MacroCharts';
import { isDateKey, todayKey } from '../lib/date';
import { isMealType, suggestedMeal } from '../lib/diary';
import { CATEGORIES, findFood, NUTRITION_SOURCE_URL } from '../lib/foods';
import { formatGrams, formatKcal } from '../lib/format';
import { useApp } from '../state/AppState';
import { useToast } from '../state/Toast';
import './FoodDetail.css';

export function FoodDetail() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { customFoods, removeCustomFood } = useApp();
  const food = findFood(id, customFoods);
  const requestedDate = params.get('date');
  const requestedMeal = params.get('meal');
  const date = isDateKey(requestedDate) ? requestedDate : todayKey();
  const meal = isMealType(requestedMeal) ? requestedMeal : suggestedMeal();
  const back = () => navigate(-1);

  const topbar = (
    <div className="topbar">
      <button type="button" className="icon-button" onClick={back} aria-label="Back">
        <CaretLeft size={18} weight="bold" />
      </button>
      <span className="topbar__title">{food ? 'Food' : ''}</span>
      <span />
    </div>
  );

  if (!food) {
    return (
      <main className="screen screen--plain">
        {topbar}
        <div className="notice notice--danger food__missing" role="alert">
          <Warning size={18} weight="fill" />
          <span>
            <strong>Food not found.</strong> There’s no nutrition entry for “{id}”. <Link to="/foods">See all foods</Link>
          </span>
        </div>
      </main>
    );
  }

  const shares = energyShares(food);
  const category = CATEGORIES.find((c) => c.id === food.category);
  const servingText = `${food.serving.localLabel}${food.serving.label !== food.serving.localLabel ? ` (${food.serving.label})` : ''}${
    food.serving.grams > 0 && food.category !== 'drinks' ? ` · ${food.serving.grams} g` : ''
  }`;

  const deleteFood = () => {
    removeCustomFood(food.id);
    toast({ message: `${food.name} deleted from your foods` });
    navigate('/foods?category=mine', { replace: true });
  };

  return (
    <main className="screen screen--cta food">
      {topbar}

      <header className="food__head">
        <div className="food__badges">
          {category && <span className="badge">{category.localName}</span>}
          {food.scan && (
            <span className="badge badge--accent">
              <Camera size={12} weight="fill" /> Camera recognises
            </span>
          )}
          {food.pork && (
            <span className="badge badge--warning">
              <Warning size={12} weight="fill" /> Usually contains pork
            </span>
          )}
          {food.custom && (
            <span className="badge">
              <NotePencil size={12} weight="fill" /> Your food
            </span>
          )}
        </div>
        <h1 className="food__name">{food.name}</h1>
        {food.localName && food.localName !== food.name && <p className="food__local">{food.localName}</p>}
        <p className="food__description">{food.description}</p>
      </header>

      <section className="card food__macros" aria-label="Macronutrients per standard serving">
        <p className="eyebrow food__per">Per {servingText}</p>
        <div className="food__macro-body">
          <MacroDonut nutrients={food} size={128} label={`${formatKcal(food.energyKcal)} kcal by macronutrient`} />
          <dl className="food__legend">
            {MACROS.map((m) => (
              <div key={m}>
                <dt>
                  <MacroDot macro={m} /> {MACRO_LABEL[m]}
                </dt>
                <dd>
                  <span className="display">{formatGrams(gramsOf(food, m))}</span>
                  <small className="num">{Math.round(shares[m] * 100)}%</small>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="food__log">
        <LogFood food={food} date={date} initialMeal={meal} source="manual" />
      </div>

      <section className="card facts" aria-labelledby="facts-title">
        <h2 id="facts-title" className="facts__title">
          Nutrition facts
        </h2>
        <p className="facts__serving">Per {servingText}</p>
        <div className="facts__energy">
          <span>Energy</span>
          <strong className="display">{formatKcal(food.energyKcal)} kcal</strong>
        </div>
        <table className="facts__table">
          <thead>
            <tr>
              <th scope="col">Nutrient</th>
              <th scope="col">Amount</th>
              <th scope="col">Energy</th>
            </tr>
          </thead>
          <tbody>
            {MACROS.map((m) => (
              <tr key={m}>
                <th scope="row">
                  <MacroDot macro={m} /> {m === 'carbs' ? 'Carbohydrate' : MACRO_LABEL[m]}
                </th>
                <td className="num">{formatGrams(gramsOf(food, m))}</td>
                <td className="num">{Math.round(shares[m] * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="facts__source">
          {food.custom ? (
            'Values you entered.'
          ) : (
            <>
              Reference values for a typical serving, to be verified against{' '}
              <a href={NUTRITION_SOURCE_URL} target="_blank" rel="noreferrer">
                MyFCD
              </a>
              . Stall portions and recipes vary.
            </>
          )}
        </p>
      </section>

      {food.custom && (
        <button type="button" className="btn btn--danger btn--block food__delete" onClick={deleteFood}>
          <Trash size={18} weight="bold" /> Delete this food
        </button>
      )}
    </main>
  );
}

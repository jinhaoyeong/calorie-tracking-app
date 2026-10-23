import { Camera, CaretLeft, NotePencil, Trash, Warning } from '@phosphor-icons/react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FoodArt } from '../art/FoodArt';
import { LogFood } from '../components/LogFood';
import { MacroDot } from '../components/MacroMeter';
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

  if (!food) {
    return (
      <main className="screen screen--plain">
        <div className="topbar">
          <button type="button" className="round-button" onClick={back} aria-label="Back">
            <CaretLeft size={20} weight="bold" />
          </button>
          <span />
          <span />
        </div>
        <div className="notice notice--danger food__missing" role="alert">
          <Warning size={20} weight="fill" />
          <span>
            <strong>Food not found.</strong> There’s no nutrition entry for “{id}”. <Link to="/foods">See all foods</Link>
          </span>
        </div>
      </main>
    );
  }

  // Share of energy from each macronutrient, using Atwater factors (4/4/9 kcal per gram).
  const energyFrom = { carbs: food.carbohydrateG * 4, protein: food.proteinG * 4, fat: food.fatG * 9 };
  const energyTotal = energyFrom.carbs + energyFrom.protein + energyFrom.fat;
  const share = (kcal: number) => (energyTotal ? `${Math.round((kcal / energyTotal) * 100)}%` : '–');
  const category = CATEGORIES.find((c) => c.id === food.category);

  const deleteFood = () => {
    removeCustomFood(food.id);
    toast({ message: `${food.name} deleted from your foods` });
    navigate('/foods?category=mine', { replace: true });
  };

  return (
    <main className="screen screen--cta food">
      <div className={`food__hero food__hero--${food.category}`}>
        <button type="button" className="round-button food__back" onClick={back} aria-label="Back">
          <CaretLeft size={20} weight="bold" />
        </button>
        <FoodArt foodId={food.id} category={food.category} size={190} tile={false} />
      </div>

      <div className="food__sheet">
        <div className="food__badges">
          {category && <span className="badge">{category.localName}</span>}
          {food.scan && (
            <span className="badge badge--accent">
              <Camera size={13} weight="fill" /> Camera recognises
            </span>
          )}
          {food.pork && (
            <span className="badge badge--warning">
              <Warning size={13} weight="fill" /> Usually contains pork
            </span>
          )}
          {food.custom && (
            <span className="badge">
              <NotePencil size={13} weight="fill" /> Your food
            </span>
          )}
        </div>
        <h1 className="food__name">{food.name}</h1>
        {food.localName && food.localName !== food.name && <p className="food__local">{food.localName}</p>}
        <p className="food__description">{food.description}</p>

        <div className="food__log">
          <LogFood food={food} date={date} initialMeal={meal} source="manual" />
        </div>

        <section className="card facts" aria-labelledby="facts-title">
          <h2 id="facts-title" className="facts__title">
            Nutrition facts
          </h2>
          <p className="facts__serving">
            Per {food.serving.localLabel}
            {food.serving.label !== food.serving.localLabel && ` (${food.serving.label})`}
            {food.serving.grams > 0 && food.category !== 'drinks' && `, about ${food.serving.grams} g`}
          </p>
          <div className="facts__energy">
            <span>Energy</span>
            <strong className="num">{formatKcal(food.energyKcal)} kcal</strong>
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
              <tr>
                <th scope="row">
                  <MacroDot macro="carbs" /> Carbohydrate
                </th>
                <td className="num">{formatGrams(food.carbohydrateG)}</td>
                <td className="num">{share(energyFrom.carbs)}</td>
              </tr>
              <tr>
                <th scope="row">
                  <MacroDot macro="protein" /> Protein
                </th>
                <td className="num">{formatGrams(food.proteinG)}</td>
                <td className="num">{share(energyFrom.protein)}</td>
              </tr>
              <tr>
                <th scope="row">
                  <MacroDot macro="fat" /> Fat
                </th>
                <td className="num">{formatGrams(food.fatG)}</td>
                <td className="num">{share(energyFrom.fat)}</td>
              </tr>
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
            <Trash size={20} weight="bold" /> Delete this food
          </button>
        )}
      </div>
    </main>
  );
}

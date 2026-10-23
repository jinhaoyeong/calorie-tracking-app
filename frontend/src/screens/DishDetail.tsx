import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FoodGlyph } from '../components/FoodGlyph';
import { Icon } from '../components/Icon';
import { LogFoodForm } from '../components/LogFoodForm';
import { MacroDot } from '../components/MacroMeter';
import { isDateKey, todayKey } from '../lib/date';
import { isMealType, suggestedMeal } from '../lib/diary';
import { findFood, NUTRITION_SOURCE_URL } from '../lib/foods';
import { formatGrams, formatKcal } from '../lib/format';
import './DishDetail.css';

export function DishDetail() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const food = findFood(id);
  const requestedDate = params.get('date');
  const requestedMeal = params.get('meal');
  const date = isDateKey(requestedDate) ? requestedDate : todayKey();
  const meal = isMealType(requestedMeal) ? requestedMeal : suggestedMeal();

  const back = (
    <div className="topbar">
      <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
        <Icon name="chevronLeft" />
      </button>
      <span className="topbar__title">{food?.name ?? ''}</span>
      <span />
    </div>
  );

  if (!food) {
    return (
      <main className="screen screen--plain">
        {back}
        <div className="note note--danger dish__missing" role="alert">
          <Icon name="alert" size={20} />
          <span>
            <strong>Dish not found.</strong> There’s no nutrition entry for “{id}”.{' '}
            <Link to="/dishes">See all dishes</Link>
          </span>
        </div>
      </main>
    );
  }

  // Share of energy from each macronutrient, using Atwater factors (4/4/9 kcal per gram).
  const energyFrom = {
    carbs: food.carbohydrateG * 4,
    protein: food.proteinG * 4,
    fat: food.fatG * 9,
  };
  const energyTotal = energyFrom.carbs + energyFrom.protein + energyFrom.fat;
  const share = (kcal: number) => `${Math.round((kcal / energyTotal) * 100)}%`;

  return (
    <main className="screen screen--cta dish">
      {back}
      <header className="dish__header">
        <FoodGlyph category={food.category} size={56} />
        <div>
          <h1 className="dish__name">{food.name}</h1>
          <p className="dish__local">{food.localName}</p>
        </div>
      </header>
      <p className="dish__description">{food.description}</p>

      <section className="card facts" aria-labelledby="facts-title">
        <h2 id="facts-title" className="facts__title">
          Nutrition facts
        </h2>
        <p className="facts__serving">
          Per standard serving: {food.serving.label} (about {food.serving.grams} g)
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
          Reference values for a typical serving, to be verified against{' '}
          <a href={NUTRITION_SOURCE_URL} target="_blank" rel="noreferrer">
            MyFCD
          </a>
          . Restaurant portions and recipes vary.
        </p>
      </section>

      <h2 className="section-label">Log this dish</h2>
      <LogFoodForm food={food} date={date} initialMeal={meal} source="manual" />
    </main>
  );
}

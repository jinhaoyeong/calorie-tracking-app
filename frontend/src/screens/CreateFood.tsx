import { CaretLeft } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FoodThumb } from '../components/FoodThumb';
import { Field } from '../components/ProfileFields';
import { isDateKey } from '../lib/date';
import { createCustomFood, isMealType, validateCustomFood, type CustomFoodErrors, type CustomFoodInput } from '../lib/diary';
import { CATEGORIES } from '../lib/foods';
import type { FoodCategory } from '../lib/types';
import { useApp } from '../state/AppState';
import { useToast } from '../state/Toast';
import './CreateFood.css';

const parseOptional = (value: string) => (value.trim() === '' ? undefined : Number(value.replace(',', '.')));

export function CreateFood() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const { addCustomFood } = useApp();
  const [name, setName] = useState(params.get('name') ?? '');
  const [serving, setServing] = useState('1 pinggan');
  const [category, setCategory] = useState<FoodCategory>('mains');
  const [kcal, setKcal] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [errors, setErrors] = useState<CustomFoodErrors>({});

  const save = () => {
    const input: Partial<CustomFoodInput> = {
      name,
      servingLabel: serving,
      category,
      energyKcal: parseOptional(kcal),
      carbohydrateG: parseOptional(carbs),
      proteinG: parseOptional(protein),
      fatG: parseOptional(fat),
    };
    const found = validateCustomFood(input);
    setErrors(found);
    if (Object.keys(found).length) return;
    const food = createCustomFood(input as CustomFoodInput);
    addCustomFood(food);
    toast({ message: `${food.name} saved to My foods` });
    const forward = new URLSearchParams();
    const meal = params.get('meal');
    const date = params.get('date');
    if (isMealType(meal)) forward.set('meal', meal);
    if (isDateKey(date)) forward.set('date', date);
    navigate(`/foods/${food.id}${forward.toString() ? `?${forward}` : ''}`, { replace: true });
  };

  return (
    <main className="screen screen--cta create">
      <div className="topbar">
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="topbar__title">Create food</h1>
        <span />
      </div>

      <p className="create__lede">
        Add home cooking or a stall dish that isn’t listed, then log it any time. Use the label or a trusted nutrition
        source for the numbers.
      </p>

      <div className="card card--pad create__card">
        <Field id="food-name" label="Name" value={name} onChange={setName} error={errors.name} text placeholder="e.g. Masak lemak cili api" />
        <Field
          id="food-serving"
          label="One serving"
          value={serving}
          onChange={setServing}
          error={errors.servingLabel}
          text
          placeholder="e.g. 1 mangkuk"
          hint="Use the unit you’d say: 1 pinggan, 1 mangkuk, 3 biji"
        />
        <Field id="food-kcal" label="Calories per serving" unit="kcal" value={kcal} onChange={setKcal} error={errors.energyKcal} />
      </div>

      <h2 className="section-label create__label">Category</h2>
      <div className="create__types" role="radiogroup" aria-label="Type of food">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={category === c.id} className="create__type" onClick={() => setCategory(c.id)}>
            <FoodThumb category={c.id} size={36} />
            <span>{c.localName}</span>
          </button>
        ))}
      </div>

      <h2 className="section-label create__label">Macros per serving (optional)</h2>
      <div className="card card--pad create__macros">
        <Field id="food-protein" label="Protein" unit="g" value={protein} onChange={setProtein} error={errors.proteinG} decimal />
        <Field id="food-carbs" label="Carbs" unit="g" value={carbs} onChange={setCarbs} error={errors.carbohydrateG} decimal />
        <Field id="food-fat" label="Fat" unit="g" value={fat} onChange={setFat} error={errors.fatG} decimal />
      </div>

      <div className="cta-bar">
        <button type="button" className="btn btn--primary" onClick={save}>
          Save food
        </button>
      </div>
    </main>
  );
}

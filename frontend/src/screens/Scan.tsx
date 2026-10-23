import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { ApiError, predictDish, type PredictResult } from '../lib/api';
import { isDateKey, todayKey } from '../lib/date';
import { isMealType, suggestedMeal } from '../lib/diary';
import { FOODS } from '../lib/foods';
import { prepareUpload, validateImageFile } from '../lib/image';
import { ScanResult } from './ScanResult';
import './Scan.css';

type Phase =
  | { kind: 'idle' }
  | { kind: 'analysing'; photoUrl: string }
  | { kind: 'result'; photoUrl: string; result: PredictResult }
  | { kind: 'error'; photoUrl?: string; message: string };

const TIPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'single', title: 'One dish per photo', text: 'Mixed plates are matched to a single dish.' },
  { icon: 'sun', title: 'Good, even light', text: 'Avoid strong shadows and dim corners.' },
  { icon: 'frame', title: 'Fill the frame', text: 'Shoot from above, close enough to see the food.' },
];

const ACCEPT = 'image/jpeg,image/png';

export function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const requestedDate = params.get('date');
  const requestedMeal = params.get('meal');
  const date = isDateKey(requestedDate) ? requestedDate : todayKey();
  const meal = isMealType(requestedMeal) ? requestedMeal : suggestedMeal();

  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController>();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const photoUrl = phase.kind === 'idle' ? undefined : phase.photoUrl;
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);
  useEffect(() => () => request.current?.abort(), []);

  const close = () => (location.key === 'default' ? navigate('/') : navigate(-1));

  const reset = () => {
    request.current?.abort();
    setPhase({ kind: 'idle' });
  };

  const analyse = async (file: File | undefined) => {
    if (!file) return;
    const check = await validateImageFile(file);
    if (!check.ok) {
      setPhase({ kind: 'error', message: check.message });
      return;
    }
    const url = URL.createObjectURL(file);
    setPhase({ kind: 'analysing', photoUrl: url });
    const controller = new AbortController();
    request.current = controller;
    try {
      const result = await predictDish(await prepareUpload(file), controller.signal);
      if (!controller.signal.aborted) setPhase({ kind: 'result', photoUrl: url, result });
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof ApiError ? error.message : 'Something went wrong while analysing the photo.';
      setPhase({ kind: 'error', photoUrl: url, message });
    }
  };

  const fileInputs = (
    <>
      <input
        ref={cameraInput}
        type="file"
        accept={ACCEPT}
        capture="environment"
        hidden
        onChange={(event) => {
          void analyse(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <input
        ref={galleryInput}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(event) => {
          void analyse(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </>
  );

  if (phase.kind === 'result') {
    return <ScanResult photoUrl={phase.photoUrl} result={phase.result} date={date} meal={meal} onRetake={reset} />;
  }

  return (
    <main className="screen screen--plain scan">
      <div className="topbar">
        <button type="button" className="icon-button" onClick={phase.kind === 'idle' ? close : reset} aria-label={phase.kind === 'idle' ? 'Close' : 'Back'}>
          <Icon name={phase.kind === 'idle' ? 'close' : 'chevronLeft'} />
        </button>
        <span className="topbar__title">Scan a dish</span>
        <span />
      </div>

      {phase.kind === 'idle' && (
        <>
          <button type="button" className="viewfinder" onClick={() => cameraInput.current?.click()}>
            <span className="viewfinder__corner viewfinder__corner--tl" />
            <span className="viewfinder__corner viewfinder__corner--tr" />
            <span className="viewfinder__corner viewfinder__corner--bl" />
            <span className="viewfinder__corner viewfinder__corner--br" />
            <span className="viewfinder__prompt">
              <Icon name="camera" size={34} strokeWidth={1.5} />
              <span className="viewfinder__title">Take a photo of your dish</span>
              <span className="viewfinder__hint">JPG or PNG, up to 10 MB</span>
            </span>
          </button>

          <div className="scan__actions">
            <button type="button" className="btn btn--primary" onClick={() => cameraInput.current?.click()}>
              <Icon name="camera" size={20} /> Take photo
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => galleryInput.current?.click()}>
              <Icon name="image" size={20} /> Gallery
            </button>
          </div>

          <h2 className="section-label">For a better match</h2>
          <ul className="card scan__tips">
            {TIPS.map((tip) => (
              <li key={tip.title}>
                <Icon name={tip.icon} size={20} />
                <div>
                  <strong>{tip.title}</strong>
                  <span>{tip.text}</span>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="section-label">Recognises these 10 dishes</h2>
          <ul className="scan__dishes">
            {FOODS.map((food) => (
              <li key={food.id}>{food.name}</li>
            ))}
          </ul>

          <p className="scan__privacy">
            <Icon name="shield" size={16} />
            Photos are analysed and then discarded. They are never saved.
          </p>
        </>
      )}

      {phase.kind === 'analysing' && (
        <>
          <div className="viewfinder viewfinder--photo">
            <img src={phase.photoUrl} alt="Your photo" />
            <div className="viewfinder__busy" role="status">
              <span className="spinner" />
              <span>Identifying dish…</span>
            </div>
          </div>
          <div className="scan__actions">
            <button type="button" className="btn btn--secondary" onClick={reset}>
              Cancel
            </button>
          </div>
        </>
      )}

      {phase.kind === 'error' && (
        <>
          {phase.photoUrl && (
            <div className="viewfinder viewfinder--photo viewfinder--dim">
              <img src={phase.photoUrl} alt="Your photo" />
            </div>
          )}
          <div className="note note--danger scan__error" role="alert">
            <Icon name="alert" size={20} />
            <div>
              <strong>Couldn’t analyse this photo</strong>
              <span>{phase.message}</span>
            </div>
          </div>
          <div className="scan__actions scan__actions--stack">
            <button type="button" className="btn btn--primary" onClick={reset}>
              Try another photo
            </button>
            <Link className="btn btn--secondary" to={`/dishes?meal=${meal}&date=${date}`} replace>
              Pick the dish from the list
            </Link>
          </div>
        </>
      )}

      {fileInputs}
    </main>
  );
}

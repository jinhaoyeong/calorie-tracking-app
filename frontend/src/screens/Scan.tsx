import { CameraSlash, Images, MagnifyingGlass, Warning, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FoodThumb } from '../components/FoodThumb';
import { BottomSheet } from '../components/BottomSheet';
import { ApiError, predictDish, type PredictResult } from '../lib/api';
import { isDateKey, todayKey } from '../lib/date';
import { isMealType, suggestedMeal } from '../lib/diary';
import { FOODS, SCAN_FOODS } from '../lib/foods';
import { prepareUpload, validateImageFile } from '../lib/image';
import { ScanResult } from './ScanResult';
import './Scan.css';

type Phase =
  | { kind: 'camera' }
  | { kind: 'analysing'; photo: Blob; photoUrl: string }
  | { kind: 'result'; photo: Blob; photoUrl: string; result: PredictResult }
  | { kind: 'error'; photoUrl?: string; message: string };

type CameraState = { status: 'starting' } | { status: 'live' } | { status: 'unavailable'; reason: string };

const ACCEPT = 'image/jpeg,image/png';

/** Live preview via getUserMedia where the browser allows it (HTTPS or localhost). */
function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>({ status: 'starting' });

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | undefined;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ status: 'unavailable', reason: 'Live preview needs a secure (HTTPS) connection.' });
      return;
    }
    setState({ status: 'starting' });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = media;
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          void videoRef.current.play().catch(() => undefined);
        }
        setState({ status: 'live' });
      })
      .catch((error: DOMException) => {
        if (cancelled) return;
        setState({
          status: 'unavailable',
          reason: error.name === 'NotAllowedError' ? 'Camera access was not allowed.' : 'No camera preview is available.',
        });
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  }, []);

  return { videoRef, state, capture };
}

export function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const requestedDate = params.get('date');
  const requestedMeal = params.get('meal');
  const date = isDateKey(requestedDate) ? requestedDate : todayKey();
  const meal = isMealType(requestedMeal) ? requestedMeal : suggestedMeal();
  const query = `?meal=${meal}${date === todayKey() ? '' : `&date=${date}`}`;

  const [phase, setPhase] = useState<Phase>({ kind: 'camera' });
  const [showList, setShowList] = useState(false);
  const { videoRef, state: camera, capture } = useCamera(phase.kind === 'camera');
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController>();

  const photoUrl = phase.kind === 'camera' ? undefined : phase.photoUrl;
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);
  useEffect(() => () => request.current?.abort(), []);

  const close = () => (location.key === 'default' ? navigate('/') : navigate(-1));

  const reset = () => {
    request.current?.abort();
    setPhase({ kind: 'camera' });
  };

  const analyse = async (photo: Blob) => {
    const url = URL.createObjectURL(photo);
    setPhase({ kind: 'analysing', photo, photoUrl: url });
    const controller = new AbortController();
    request.current = controller;
    try {
      const result = await predictDish(await prepareUpload(photo), controller.signal);
      if (!controller.signal.aborted) setPhase({ kind: 'result', photo, photoUrl: url, result });
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof ApiError ? error.message : 'Something went wrong while analysing the photo.';
      setPhase({ kind: 'error', photoUrl: url, message });
    }
  };

  const fromFile = async (file: File | undefined) => {
    if (!file) return;
    const check = await validateImageFile(file);
    if (!check.ok) {
      setPhase({ kind: 'error', message: check.message });
      return;
    }
    await analyse(file);
  };

  const shoot = async () => {
    if (camera.status !== 'live') {
      cameraInput.current?.click();
      return;
    }
    const photo = await capture();
    if (photo) await analyse(photo);
  };

  if (phase.kind === 'result') {
    return <ScanResult photoUrl={phase.photoUrl} photo={phase.photo} result={phase.result} date={date} meal={meal} onRetake={reset} />;
  }

  const fileInput = (ref: React.RefObject<HTMLInputElement>, useCapture: boolean) => (
    <input
      ref={ref}
      type="file"
      accept={ACCEPT}
      {...(useCapture ? { capture: 'environment' as const } : {})}
      hidden
      onChange={(event) => {
        void fromFile(event.target.files?.[0]);
        event.target.value = '';
      }}
    />
  );

  return (
    <main className="camera">
      <div className="camera__stage">
        {phase.kind === 'camera' && (
          <>
            <video ref={videoRef} className={`camera__video${camera.status === 'live' ? ' is-live' : ''}`} playsInline muted />
            {camera.status === 'unavailable' && (
              <div className="camera__fallback">
                <CameraSlash size={40} weight="light" />
                <p className="camera__fallback-title">{camera.reason}</p>
                <p>Tap the shutter to open your phone’s camera, or pick a photo from your gallery.</p>
              </div>
            )}
          </>
        )}
        {phase.kind !== 'camera' && phase.photoUrl && <img className="camera__still" src={phase.photoUrl} alt="Your photo" />}

        <div className="camera__frame" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          {phase.kind === 'analysing' && <i className="camera__scanline" />}
        </div>

        <div className="camera__top">
          <button type="button" className="camera__round" onClick={phase.kind === 'camera' ? close : reset} aria-label={phase.kind === 'camera' ? 'Close' : 'Back to camera'}>
            <X size={20} weight="bold" />
          </button>
          <span className="camera__title">Scan meal</span>
          <span className="camera__spacer" />
        </div>

        <div className="camera__hint" role="status">
          {phase.kind === 'analysing' ? (
            <>
              <span className="spinner" /> Identifying dish…
            </>
          ) : phase.kind === 'error' ? (
            'Couldn’t analyse that photo'
          ) : (
            'Fit one dish inside the frame'
          )}
        </div>
      </div>

      {phase.kind === 'error' ? (
        <div className="camera__panel">
          <div className="notice notice--danger camera__error" role="alert">
            <Warning size={20} weight="fill" />
            <span>{phase.message}</span>
          </div>
          <div className="camera__error-actions">
            <button type="button" className="btn btn--primary" onClick={reset}>
              Try again
            </button>
            <Link className="btn camera__ghost" to={`/foods${query}`} replace>
              Pick from list
            </Link>
          </div>
        </div>
      ) : (
        <div className="camera__panel">
          <div className="camera__controls">
            <button
              type="button"
              className="camera__side"
              onClick={() => galleryInput.current?.click()}
              disabled={phase.kind === 'analysing'}
              aria-label="Choose from gallery"
            >
              <Images size={26} weight="fill" />
              <span>Gallery</span>
            </button>
            <button
              type="button"
              className="camera__shutter"
              onClick={phase.kind === 'analysing' ? reset : shoot}
              aria-label={phase.kind === 'analysing' ? 'Cancel' : 'Take photo'}
            >
              <span />
            </button>
            <Link className="camera__side" to={`/foods${query}`} replace aria-label="Search foods instead">
              <MagnifyingGlass size={26} weight="bold" />
              <span>Search</span>
            </Link>
          </div>
          <button type="button" className="camera__supported" onClick={() => setShowList(true)}>
            Recognises {SCAN_FOODS.length} Malaysian dishes · View list
          </button>
          <p className="camera__privacy">Photos are analysed and then discarded by the server.</p>
        </div>
      )}

      {fileInput(cameraInput, true)}
      {fileInput(galleryInput, false)}

      {showList && (
        <BottomSheet title="Dishes the camera knows" onClose={() => setShowList(false)}>
          <p className="sheet-lede">For anything else, search all {FOODS.length} foods or use quick add.</p>
          <ul className="card list">
            {SCAN_FOODS.map((food) => (
              <li key={food.id} className="list-row">
                <FoodThumb category={food.category} size={36} />
                <span className="list-row__text">
                  <span className="list-row__title">{food.name}</span>
                  <span className="list-row__sub">{food.localName}</span>
                </span>
                <span className="list-row__value">{food.energyKcal} kcal</span>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </main>
  );
}

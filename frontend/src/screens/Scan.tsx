import { CameraSlash, Images, Lightning, LightningSlash, MagnifyingGlass, Warning, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FoodThumb } from '../components/FoodThumb';
import { BottomSheet } from '../components/BottomSheet';
import { ApiError, predictDish, type PredictResult } from '../lib/api';
import { CAMERA_FAILURE_MESSAGE, cameraFailure, frameArea, type Rect, visibleRegion } from '../lib/camera';
import { isDateKey, todayKey } from '../lib/date';
import { isMealType, suggestedMeal } from '../lib/diary';
import { FOODS, recognisableFoods } from '../lib/foods';
import { prepareUpload, validateImageFile } from '../lib/image';
import { useHealth } from '../state/useHealth';
import { ScanResult } from './ScanResult';
import './Scan.css';

type Phase =
  | { kind: 'camera' }
  | { kind: 'analysing'; photo: Blob; photoUrl: string }
  | { kind: 'result'; photo: Blob; photoUrl: string; result: PredictResult }
  | { kind: 'error'; photoUrl?: string; message: string };

type CameraState =
  | { status: 'starting' }
  | { status: 'live'; hasTorch: boolean }
  | { status: 'unavailable'; reason: string };

/** A shot of exactly what the preview showed, and where the guide frame sat in it. */
interface Capture {
  photo: Blob;
  area?: Rect;
}

// Not yet in TypeScript's DOM types, but supported by Chrome on Android.
type CameraCapabilities = MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] };
type CameraConstraints = MediaTrackConstraintSet & { torch?: boolean; focusMode?: string };

const ACCEPT = 'image/jpeg,image/png';
// The back camera at up to 1080p, so the crop to the guide frame stays sharp.
const VIDEO: MediaTrackConstraints = { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } };

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}

/** Live preview via getUserMedia where the browser allows it (HTTPS or localhost). */
function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<MediaStreamTrack>();
  const [state, setState] = useState<CameraState>({ status: 'starting' });
  const [torchOn, setTorchOn] = useState(false);
  // The camera is released while the app is in the background and reopened on return.
  const running = usePageVisible() && active;

  useEffect(() => {
    if (!running) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState({ status: 'unavailable', reason: CAMERA_FAILURE_MESSAGE.insecure });
      return;
    }
    let stream: MediaStream | undefined;
    let cancelled = false;
    setState({ status: 'starting' });
    setTorchOn(false);
    navigator.mediaDevices
      .getUserMedia({ video: VIDEO, audio: false })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = media;
        const [track] = media.getVideoTracks();
        trackRef.current = track;
        const capabilities: CameraCapabilities = track.getCapabilities?.() ?? {};
        if (capabilities.focusMode?.includes('continuous')) {
          const focus: CameraConstraints = { focusMode: 'continuous' };
          void track.applyConstraints({ advanced: [focus] }).catch(() => undefined);
        }
        track.addEventListener('ended', () => {
          if (!cancelled) setState({ status: 'unavailable', reason: 'The camera stopped.' });
        });
        const video = videoRef.current;
        if (!video) return;
        // Only offer the live shutter once frames are arriving, so a capture is never blank.
        video.addEventListener(
          'loadeddata',
          () => !cancelled && setState({ status: 'live', hasTorch: capabilities.torch === true }),
          { once: true },
        );
        video.srcObject = media;
        void video.play().catch(() => undefined);
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'unavailable', reason: CAMERA_FAILURE_MESSAGE[cameraFailure(error)] });
      });
    return () => {
      cancelled = true;
      trackRef.current = undefined;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [running]);

  const setTorch = useCallback((on: boolean) => {
    const light: CameraConstraints = { torch: on };
    trackRef.current
      ?.applyConstraints({ advanced: [light] })
      .then(() => setTorchOn(on))
      .catch(() => undefined);
  }, []);

  const capture = useCallback(async (): Promise<Capture | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const view = video.getBoundingClientRect();
    const region = visibleRegion({ width: video.videoWidth, height: video.videoHeight }, view);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(region.width);
    canvas.height = Math.round(region.height);
    canvas.getContext('2d')?.drawImage(video, region.x, region.y, region.width, region.height, 0, 0, canvas.width, canvas.height);
    const photo = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!photo) return null;
    const frame = frameRef.current?.getBoundingClientRect();
    return { photo, area: frame && frameArea(view, frame) };
  }, []);

  return { videoRef, frameRef, state, capture, torchOn, setTorch };
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
  const { videoRef, frameRef, state: camera, capture, torchOn, setTorch } = useCamera(phase.kind === 'camera');
  const health = useHealth();
  const known = recognisableFoods(health.status === 'online' ? health.health.model.labels : undefined);
  const viaClaude = health.status === 'online' && health.health.model.mode === 'claude';
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

  /** `area` limits what is sent to the dish inside the guide frame; the full photo is kept for display. */
  const analyse = async (photo: Blob, area?: Rect) => {
    const url = URL.createObjectURL(photo);
    setPhase({ kind: 'analysing', photo, photoUrl: url });
    const controller = new AbortController();
    request.current = controller;
    try {
      const result = await predictDish(await prepareUpload(photo, area), controller.signal);
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
    const shot = await capture();
    if (shot) await analyse(shot.photo, shot.area);
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
            <video ref={videoRef} className={`camera__video${camera.status === 'live' ? ' is-live' : ''}`} autoPlay playsInline muted />
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

        <div className="camera__frame" ref={frameRef} aria-hidden="true">
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
          {phase.kind === 'camera' && camera.status === 'live' && camera.hasTorch ? (
            <button
              type="button"
              className="camera__round"
              onClick={() => setTorch(!torchOn)}
              aria-pressed={torchOn}
              aria-label="Torch"
            >
              {torchOn ? <Lightning size={20} weight="fill" /> : <LightningSlash size={20} weight="bold" />}
            </button>
          ) : (
            <span className="camera__spacer" />
          )}
        </div>

        <div className="camera__hint" role="status">
          {phase.kind === 'analysing' ? (
            <>
              <span className="spinner" /> Identifying dish…
            </>
          ) : phase.kind === 'error' ? (
            'Couldn’t analyse that photo'
          ) : camera.status === 'starting' ? (
            'Starting camera…'
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
            Recognises {known.length} Malaysian foods · View list
          </button>
          <p className="camera__privacy">
            {viaClaude
              ? 'Photos are sent to Claude (Anthropic) to identify the dish. Pinggan doesn’t keep them.'
              : 'Photos are analysed and then discarded by the server.'}
          </p>
        </div>
      )}

      {fileInput(cameraInput, true)}
      {fileInput(galleryInput, false)}

      {showList && (
        <BottomSheet title="Foods the camera knows" onClose={() => setShowList(false)}>
          <p className="sheet-lede">
            {known.length < FOODS.length
              ? `For anything else, search all ${FOODS.length} foods or use quick add.`
              : 'For your own foods, use search or quick add.'}
          </p>
          <ul className="card list">
            {known.map((food) => (
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

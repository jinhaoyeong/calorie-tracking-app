export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

/** Share of the guide frame's size added on each side, so a dish slightly over the corners isn't cut off. */
export const FRAME_MARGIN = 0.08;

/** The part of the camera image that an `object-fit: cover` preview of `view` size shows, in camera pixels. */
export function visibleRegion(video: Size, view: Size): Rect {
  const scale = Math.max(view.width / video.width, view.height / video.height);
  const width = Math.min(video.width, view.width / scale);
  const height = Math.min(video.height, view.height / scale);
  return { x: (video.width - width) / 2, y: (video.height - height) / 2, width, height };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Where the on-screen guide frame sits within the preview, grown by `margin`, as fractions
 * (0–1) of the preview. Because a capture is exactly what the preview shows, the same
 * fractions locate the frame in the captured photo at any resolution.
 */
export function frameArea(view: Rect, frame: Rect, margin = FRAME_MARGIN): Rect {
  const left = clamp((frame.x - frame.width * margin - view.x) / view.width);
  const top = clamp((frame.y - frame.height * margin - view.y) / view.height);
  const right = clamp((frame.x + frame.width * (1 + margin) - view.x) / view.width);
  const bottom = clamp((frame.y + frame.height * (1 + margin) - view.y) / view.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Converts fractional `area` to whole pixels of an image of `size`. */
export function pixelsOf(size: Size, area: Rect): Rect {
  const x = Math.round(area.x * size.width);
  const y = Math.round(area.y * size.height);
  return {
    x,
    y,
    width: Math.max(1, Math.min(size.width - x, Math.round(area.width * size.width))),
    height: Math.max(1, Math.min(size.height - y, Math.round(area.height * size.height))),
  };
}

export type CameraFailure = 'insecure' | 'denied' | 'missing' | 'busy' | 'unknown';

/** Groups getUserMedia errors into the cases the camera screen explains differently. */
export function cameraFailure(error: unknown): CameraFailure {
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'missing';
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy';
  return 'unknown';
}

export const CAMERA_FAILURE_MESSAGE: Record<CameraFailure, string> = {
  insecure: 'Live preview needs a secure (HTTPS) connection.',
  denied: 'Camera access was not allowed.',
  missing: 'No camera was found.',
  busy: 'The camera is being used by another app.',
  unknown: 'No camera preview is available.',
};

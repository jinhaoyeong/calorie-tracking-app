import { describe, expect, it } from 'vitest';
import { cameraFailure, frameArea, pixelsOf, visibleRegion } from './camera';

describe('visibleRegion', () => {
  it('crops the sides of a landscape camera image shown in a portrait preview', () => {
    // 1920x1080 sensor in a 390x600 preview: scaled by 600/1080, 1067 px wide, so the sides are hidden.
    const region = visibleRegion({ width: 1920, height: 1080 }, { width: 390, height: 600 });
    expect(region.height).toBe(1080);
    expect(region.width).toBeCloseTo(702, 0);
    expect(region.x).toBeCloseTo((1920 - 702) / 2, 0);
    expect(region.y).toBe(0);
  });

  it('crops the top and bottom when the preview is wider than the camera image', () => {
    const region = visibleRegion({ width: 1080, height: 1920 }, { width: 400, height: 500 });
    expect(region.width).toBe(1080);
    expect(region.height).toBeCloseTo(1350, 0);
    expect(region.y).toBeCloseTo(285, 0);
  });

  it('keeps the whole image when the shapes match', () => {
    expect(visibleRegion({ width: 1280, height: 720 }, { width: 640, height: 360 })).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    });
  });
});

describe('frameArea', () => {
  const view = { x: 0, y: 50, width: 400, height: 600 };
  // The guide frame is inset 22% top and bottom, 11% left and right.
  const frame = { x: 44, y: 50 + 132, width: 312, height: 336 };

  it('returns the frame plus its margin as fractions of the preview', () => {
    const area = frameArea(view, frame, 0.1);
    expect(area.x).toBeCloseTo((44 - 31.2) / 400);
    expect(area.y).toBeCloseTo((132 - 33.6) / 600);
    expect(area.width).toBeCloseTo((312 * 1.2) / 400);
    expect(area.height).toBeCloseTo((336 * 1.2) / 600);
  });

  it('never reaches outside the preview', () => {
    const area = frameArea(view, { x: -10, y: 40, width: 420, height: 620 });
    expect(area).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});

describe('pixelsOf', () => {
  it('maps fractions onto whole pixels inside the image', () => {
    expect(pixelsOf({ width: 702, height: 1080 }, { x: 0.1, y: 0.2, width: 0.8, height: 0.6 })).toEqual({
      x: 70,
      y: 216,
      width: 562,
      height: 648,
    });
    const edge = pixelsOf({ width: 101, height: 101 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
    expect(edge.x + edge.width).toBeLessThanOrEqual(101);
    expect(edge.y + edge.height).toBeLessThanOrEqual(101);
  });
});

describe('cameraFailure', () => {
  const error = (name: string) => Object.assign(new Error(name), { name });

  it('explains the common getUserMedia errors', () => {
    expect(cameraFailure(error('NotAllowedError'))).toBe('denied');
    expect(cameraFailure(error('NotFoundError'))).toBe('missing');
    expect(cameraFailure(error('NotReadableError'))).toBe('busy');
    expect(cameraFailure(error('TypeError'))).toBe('unknown');
    expect(cameraFailure('nope')).toBe('unknown');
  });
});

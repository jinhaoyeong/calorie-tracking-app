const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';

export interface PredictionScore {
  foodId: string;
  name: string;
  confidence: number;
}

export interface ModelSummary {
  name: string;
  architecture: string;
  mode: 'onnx' | 'demo';
}

export interface PredictResult {
  predictions: PredictionScore[];
  lowConfidence: boolean;
  confidenceThreshold: number;
  model: ModelSummary;
  inferenceMs: number;
  disclaimer: string;
}

export interface Health {
  model: ModelSummary & { inputSize: number; labels: string[] };
  confidenceThreshold: number;
  nutritionVersion: string;
}

interface RawPredict {
  predictions: { food_id: string; name: string; confidence: number }[];
  low_confidence: boolean;
  confidence_threshold: number;
  model: ModelSummary;
  inference_ms: number;
  disclaimer: string;
}

interface RawHealth {
  model: ModelSummary & { input_size: number; labels: string[] };
  confidence_threshold: number;
  nutrition_version: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }

  get offline(): boolean {
    return this.status === 0;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'offline', 'Can’t reach the recognition service. Check your connection and try again.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message =
      typeof detail?.message === 'string' ? detail.message : 'Something went wrong while analysing the photo.';
    throw new ApiError(response.status, typeof detail?.code === 'string' ? detail.code : 'error', message);
  }
  return body as T;
}

export async function predictDish(image: Blob, signal?: AbortSignal): Promise<PredictResult> {
  const form = new FormData();
  form.append('image', image, image instanceof File ? image.name : 'meal.jpg');
  const body = await request<RawPredict>('/api/predict', { method: 'POST', body: form, signal });
  return {
    predictions: body.predictions.map((p) => ({
      foodId: p.food_id,
      name: p.name,
      confidence: p.confidence,
    })),
    lowConfidence: body.low_confidence,
    confidenceThreshold: body.confidence_threshold,
    model: body.model,
    inferenceMs: body.inference_ms,
    disclaimer: body.disclaimer,
  };
}

export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  const body = await request<RawHealth>('/api/health', { signal });
  return {
    model: {
      name: body.model.name,
      architecture: body.model.architecture,
      mode: body.model.mode,
      inputSize: body.model.input_size,
      labels: body.model.labels,
    },
    confidenceThreshold: body.confidence_threshold,
    nutritionVersion: body.nutrition_version,
  };
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Longest side sent to the server. Classifiers use 224 px inputs, so this keeps uploads small on mobile data. */
export const UPLOAD_MAX_SIDE = 1024;

export type ImageKind = 'jpeg' | 'png';

/** Identifies JPG/PNG from the first bytes of the file rather than its name or reported type. */
export function sniffImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= png.length && png.every((value, i) => bytes[i] === value)) return 'png';
  return null;
}

export type FileCheck = { ok: true; kind: ImageKind } | { ok: false; message: string };

export function checkImage(header: Uint8Array, size: number): FileCheck {
  if (size === 0) return { ok: false, message: 'That file is empty. Try another photo.' };
  if (size > MAX_UPLOAD_BYTES) return { ok: false, message: 'That photo is larger than 10 MB. Try a smaller one.' };
  const kind = sniffImageKind(header);
  if (!kind) return { ok: false, message: 'Only JPG or PNG photos can be scanned.' };
  return { ok: true, kind };
}

export async function validateImageFile(file: File): Promise<FileCheck> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return checkImage(header, file.size);
}

/**
 * Re-encodes large photos to at most UPLOAD_MAX_SIDE px as JPEG. Browsers apply EXIF
 * rotation when decoding, and re-encoding drops the remaining metadata such as location.
 */
export async function prepareUpload(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, UPLOAD_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return blob ?? file;
}

/** Square, centre-cropped JPEG thumbnail for the diary. Small enough to keep many on the device. */
export async function makeThumbnail(file: Blob, size = 160): Promise<string | undefined> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return undefined;
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return undefined;
  }
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.72);
}

/**
 * Image template system for body-part brushes.
 *
 * Supports both built-in templates (loaded from public/) and
 * user-uploaded images (stored as data URLs in the brush definition).
 */

export interface ImageTemplateDef {
  id: string;
  name: string;
  /** URL to load the image from (served from public/) */
  url: string;
}

// --------------- registry ---------------

export const IMAGE_TEMPLATES: ImageTemplateDef[] = [
  { id: 'leg', name: 'Leg', url: '/brush-templates/leg.png' },
];

export function getTemplateDef(id: string): ImageTemplateDef | undefined {
  return IMAGE_TEMPLATES.find((t) => t.id === id);
}

// --------------- image loading & caching ---------------

/** Cached loaded images (key → loaded HTMLImageElement) */
const imageCache = new Map<string, HTMLImageElement>();
/** Currently loading */
const loadingSet = new Set<string>();

/**
 * Get a loaded image for the given template id (built-in).
 * Returns null if the image hasn't been loaded yet (triggers async load).
 */
export function getTemplateImage(templateId: string): HTMLImageElement | null {
  const cached = imageCache.get(`tpl:${templateId}`);
  if (cached) return cached;

  if (!loadingSet.has(templateId)) {
    const def = getTemplateDef(templateId);
    if (!def) return null;

    loadingSet.add(templateId);
    const img = new Image();
    img.onload = () => {
      imageCache.set(`tpl:${templateId}`, img);
      loadingSet.delete(templateId);
    };
    img.onerror = () => {
      loadingSet.delete(templateId);
      console.warn(`Failed to load brush template: ${def.url}`);
    };
    img.src = def.url;
  }

  return null;
}

/**
 * Get a loaded image from a data URL (user-uploaded).
 * Caches by a hash of the data URL prefix to avoid re-creating.
 */
export function getDataUrlImage(dataUrl: string): HTMLImageElement | null {
  if (!dataUrl) return null;

  // Use first 64 chars as cache key (sufficient for uniqueness)
  const key = `data:${dataUrl.length}:${dataUrl.substring(0, 64)}`;
  const cached = imageCache.get(key);
  if (cached) return cached;

  if (!loadingSet.has(key)) {
    loadingSet.add(key);
    const img = new Image();
    img.onload = () => {
      imageCache.set(key, img);
      loadingSet.delete(key);
    };
    img.onerror = () => {
      loadingSet.delete(key);
    };
    img.src = dataUrl;
  }

  return null;
}

/**
 * Get the image for a brush — checks user-uploaded dataUrl first,
 * then falls back to built-in template by id.
 */
export function getBrushImage(imageStampId: string, imageDataUrl: string): HTMLImageElement | null {
  if (imageDataUrl) {
    return getDataUrlImage(imageDataUrl);
  }
  if (imageStampId) {
    return getTemplateImage(imageStampId);
  }
  return null;
}

/**
 * Preload all registered templates so they're ready when needed.
 */
export function preloadAllTemplates(): void {
  for (const def of IMAGE_TEMPLATES) {
    getTemplateImage(def.id);
  }
}

/**
 * Image template system for body-part brushes.
 *
 * Templates are VERTICAL images:
 *   Y-axis = along the body part (top → bottom, e.g. hip → foot)
 *   X-axis = width / thickness of the body part
 *
 * When rendered, the template is progressively "unrolled" along the
 * stroke path. The image bends to follow curves and stops once
 * the full template has been revealed (no repeating).
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

/** Cached loaded images (template id → loaded HTMLImageElement) */
const imageCache = new Map<string, HTMLImageElement>();
/** Templates currently being loaded */
const loadingSet = new Set<string>();

/**
 * Get a loaded image for the given template id.
 * Returns null if the image hasn't been loaded yet (triggers async load).
 */
export function getTemplateImage(templateId: string): HTMLImageElement | null {
  const cached = imageCache.get(templateId);
  if (cached) return cached;

  // Start loading if not already in progress
  if (!loadingSet.has(templateId)) {
    const def = getTemplateDef(templateId);
    if (!def) return null;

    loadingSet.add(templateId);
    const img = new Image();
    img.onload = () => {
      imageCache.set(templateId, img);
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
 * Preload all registered templates so they're ready when needed.
 */
export function preloadAllTemplates(): void {
  for (const def of IMAGE_TEMPLATES) {
    getTemplateImage(def.id);
  }
}

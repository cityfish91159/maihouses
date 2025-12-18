export interface KeyCapsuleInput {
  advantage1?: string | null | undefined;
  advantage2?: string | null | undefined;
  features?: Array<string | null | undefined> | null | undefined;
  size?: number | null | undefined;
  rooms?: number | null | undefined;
  halls?: number | null | undefined;
  floorCurrent?: string | null | undefined;
  floorTotal?: number | null | undefined;
}

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function inferFloorTag(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;
  if (/高樓層|高樓/.test(text)) return '高樓層';
  if (/低樓層|低樓/.test(text)) return '低樓層';
  return null;
}

function pushUnique(target: string[], value: string | null) {
  if (!value) return;
  const normalized = normalize(value);
  if (!normalized) return;
  if (target.includes(normalized)) return;
  target.push(normalized);
}

function formatArea(size: number | null | undefined): string | null {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null;
  return `${Number(size).toFixed(1)} 坪`;
}

function formatLayout(rooms: number | null | undefined, halls: number | null | undefined): string | null {
  const r = typeof rooms === 'number' && Number.isFinite(rooms) && rooms > 0 ? rooms : null;
  const h = typeof halls === 'number' && Number.isFinite(halls) && halls > 0 ? halls : null;
  if (!r) return null;
  return `${r}房${h ? `${h}廳` : ''}`;
}

/**
 * 產出 tags[]，遵守 index 語意：
 * - tags[0..1]：Highlights（賣點）
 * - tags[2..3]：Specs（規格）
 */
export function buildKeyCapsuleTags(input: KeyCapsuleInput): string[] {
  const tags: string[] = [];

  const highlightCandidates: string[] = [];
  if (isNonEmpty(input.advantage1)) highlightCandidates.push(input.advantage1);
  if (isNonEmpty(input.advantage2)) highlightCandidates.push(input.advantage2);
  if (Array.isArray(input.features)) {
    for (const feature of input.features) {
      if (isNonEmpty(feature)) highlightCandidates.push(feature);
    }
  }
  highlightCandidates.push(inferFloorTag(input.floorCurrent) ?? '');

  for (const candidate of highlightCandidates) {
    if (tags.length >= 2) break;
    if (!isNonEmpty(candidate)) continue;
    pushUnique(tags, candidate);
  }

  pushUnique(tags, formatArea(input.size));
  pushUnique(tags, formatLayout(input.rooms, input.halls));

  return tags.slice(0, 4);
}

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

function inferFloorTag(current: string | null | undefined, total: number | null | undefined): string | null {
  const text = current?.trim() || '';
  if (text) {
    if (/高樓層|高樓/.test(text)) return '高樓層';
    if (/低樓層|低樓/.test(text)) return '低樓層';
  }

  // 數字推斷邏輯 (P2 缺失修正)
  const curNum = parseInt(text, 10);
  if (!isNaN(curNum) && typeof total === 'number' && total > 0) {
    const ratio = curNum / total;
    if (ratio >= 0.7) return '高樓層';
    if (ratio <= 0.3 && total >= 4) return '低樓層';
  }
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
  // 修正格式 (P2 缺失修正)：統一為 "X 房 Y 廳"
  return `${r} 房${h ? ` ${h} 廳` : ''}`;
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
  // 傳入 floorTotal 進行推斷 (P0 缺失修正)
  highlightCandidates.push(inferFloorTag(input.floorCurrent, input.floorTotal) ?? '');

  for (const candidate of highlightCandidates) {
    if (tags.length >= 2) break;
    if (!isNonEmpty(candidate)) continue;
    pushUnique(tags, candidate);
  }

  pushUnique(tags, formatArea(input.size));
  pushUnique(tags, formatLayout(input.rooms, input.halls));

  return tags.slice(0, 4);
}

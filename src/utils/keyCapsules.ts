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

function pushUnique(target: string[], value: string | null) {
  if (!value) return;
  const normalized = normalize(value);
  if (!normalized) return;
  if (target.includes(normalized)) return;
  target.push(normalized);
}

export function formatArea(size: number | null | undefined): string | null {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null;
  return `${Number(size).toFixed(1)} 坪`;
}

export function formatLayout(rooms: number | null | undefined, halls: number | null | undefined): string | null {
  const r = typeof rooms === 'number' && Number.isFinite(rooms) && rooms > 0 ? rooms : null;
  const h = typeof halls === 'number' && Number.isFinite(halls) && halls > 0 ? halls : null;
  if (!r) return null;
  // 修正格式 (P2 缺失修正)：統一為 "X 房 Y 廳"
  return `${r} 房${h ? ` ${h} 廳` : ''}`;
}

export function formatFloor(current: string | null | undefined, total: number | null | undefined): string | null {
  const curRaw = current?.trim() || '';
  if (!curRaw) return null;

  // 常見輸入正規化：將「12F / 12 f」視為「12」以便繁中化輸出
  const cur = curRaw.replace(/^(\d+)\s*[Ff]$/, '$1');

  // 統一繁中單位：若只有數字則補「樓」，否則保留原樣（如「頂樓」）
  const displayCur = /^\d+$/.test(cur) ? `${cur} 樓` : cur;
  const displayTotal = total && total > 0 ? `${total} 層` : null;

  return displayTotal ? `${displayCur} / ${displayTotal}` : displayCur;
}

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

  for (const candidate of highlightCandidates) {
    if (tags.length >= 2) break;
    if (!isNonEmpty(candidate)) continue;
    pushUnique(tags, candidate);
  }

  return tags.slice(0, 4);
}

/**
 * ChatMessage 標記解析器
 *
 * 負責解析訊息中的特殊標記：
 * - 社區牆標記 [[社區牆:...]]
 * - 物件標記 [[物件:...]]
 * - 情境標記 [[情境:...]]
 */

export type CommunityWallTag = {
  communityId?: string;
  name: string;
  topic: string;
};

export type ScenarioTag = {
  key: string;
  description: string;
};

function isLikelyCommunityId(value: string): boolean {
  return /^(?=.*[-0-9])[a-z0-9-]{8,}$/i.test(value);
}

/**
 * 解析訊息中的社區牆標記
 * 格式：
 * - 舊版：[[社區牆:社區名稱:討論話題]]
 * - 新版：[[社區牆:communityId:社區名稱:討論話題]]
 */
export function parseCommunityWallTags(content: string): CommunityWallTag[] {
  const regex = /\[\[社區牆:([^\]]+)\]\]/g;
  const cards: CommunityWallTag[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const rawPayload = match[1];
    if (!rawPayload) {
      continue;
    }

    const segments = rawPayload
      .split(':')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    if (segments.length < 2) {
      continue;
    }

    const first = segments[0];
    const second = segments[1];
    const rest = segments.slice(2);
    if (!first || !second) {
      continue;
    }

    const useNewFormat = rest.length > 0 && isLikelyCommunityId(first);
    const communityId = useNewFormat ? first : undefined;
    const name = useNewFormat ? second : first;
    const topic = useNewFormat ? rest.join(':').trim() : [second, ...rest].join(':').trim();

    if (name && topic) {
      if (communityId) {
        cards.push({ communityId, name, topic });
      } else {
        cards.push({ name, topic });
      }
    }
  }

  return cards;
}

/**
 * 解析訊息中的物件標記
 * 格式：[[物件:社區名稱:物件ID]]
 */
export function parsePropertyTags(content: string): { community: string; propertyId: string }[] {
  const regex = /\[\[物件:([^:]+):([^\]]+)\]\]/g;
  const properties: { community: string; propertyId: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const community = match[1];
    const propertyId = match[2];
    if (community && propertyId) {
      properties.push({
        community: community.trim(),
        propertyId: propertyId.trim(),
      });
    }
  }

  return properties;
}

/**
 * 解析情境描述標記
 * 格式：[[情境:描述內容]]
 */
export function parseScenarioTags(content: string): ScenarioTag[] {
  const regex = /\[\[情境:([^\]]+)\]\]/g;
  const scenarios: ScenarioTag[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const description = match[1]?.trim();
    if (description) {
      scenarios.push({
        key: `scenario-${match.index}`,
        description,
      });
    }
  }

  return scenarios;
}

/**
 * 移除所有標記，保留純文字
 */
export function stripAllTags(content: string): string {
  return content
    .replace(/\[\[社區牆:[^\]]+\]\]/g, '')
    .replace(/\[\[物件:[^:]+:[^\]]+\]\]/g, '')
    .replace(/\[\[情境:[^\]]+\]\]/g, '')
    .trim();
}

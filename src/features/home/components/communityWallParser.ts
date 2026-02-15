/**
 * 社區牆標記解析器
 *
 * 解析訊息中的 [[社區牆:...]] 標記
 * - 舊版：[[社區牆:社區名稱:討論話題]]
 * - 新版：[[社區牆:communityId:社區名稱:討論話題]]
 */

export type CommunityWallTag = {
  communityId?: string;
  name: string;
  topic: string;
};

function isLikelyCommunityId(value: string): boolean {
  return /^(?=.*[-0-9])[a-z0-9-]{8,}$/i.test(value);
}

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

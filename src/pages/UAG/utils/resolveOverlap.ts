/**
 * 泡泡碰撞偵測與位置解析工具
 *
 * 使用迭代推擠演算法（O(n²)）解決泡泡重疊問題
 * 確保所有泡泡在容器範圍內且不重疊
 */

interface Bubble {
  x: number;
  y: number;
  size: number;
}

interface Position {
  x: number;
  y: number;
}

const MAX_OVERLAP_ITERATIONS = 10;
const ZERO_DISTANCE_NUDGE_PX = 0.5;

function getDeterministicAngle(i: number, j: number): number {
  const hash = (((i + 1) * 73856093) ^ ((j + 1) * 19349663)) >>> 0;
  return ((hash % 360) * Math.PI) / 180;
}

/**
 * 解決泡泡重疊問題
 *
 * @param bubbles - 泡泡陣列（包含初始位置和尺寸）
 * @param containerW - 容器寬度（px）
 * @param containerH - 容器高度（px）
 * @param padding - 泡泡之間的最小間距（px）
 * @returns 解析後的位置陣列
 */
export function resolveOverlap(
  bubbles: Bubble[],
  containerW: number,
  containerH: number,
  padding: number = 4
): Position[] {
  if (bubbles.length === 0) return [];
  const safePadding = Math.max(0, padding);

  // 初始化位置陣列（深拷貝避免修改原始資料）
  const positions: Position[] = bubbles.map(b => ({ x: b.x, y: b.y }));

  // Iteratively separate overlaps while keeping runtime predictable.
  for (let iter = 0; iter < MAX_OVERLAP_ITERATIONS; iter++) {
    let hasAdjustment = false;

    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const bubbleA = bubbles[i];
        const bubbleB = bubbles[j];
        const posA = positions[i];
        const posB = positions[j];

        if (!bubbleA || !bubbleB || !posA || !posB) continue;

        // 計算兩個泡泡中心點距離
        let dx = posB.x - posA.x;
        let dy = posB.y - posA.y;
        let distance = Math.hypot(dx, dy);

        // 計算最小安全距離（半徑和 + padding）
        const radiusA = bubbleA.size / 2;
        const radiusB = bubbleB.size / 2;
        const minDist = radiusA + radiusB + safePadding;

        // Exact same center needs a deterministic nudge to avoid a deadlock.
        if (distance === 0) {
          const angle = getDeterministicAngle(i, j);
          const nudgeX = Math.cos(angle) * ZERO_DISTANCE_NUDGE_PX;
          const nudgeY = Math.sin(angle) * ZERO_DISTANCE_NUDGE_PX;
          posA.x -= nudgeX;
          posA.y -= nudgeY;
          posB.x += nudgeX;
          posB.y += nudgeY;
          hasAdjustment = true;

          dx = posB.x - posA.x;
          dy = posB.y - posA.y;
          distance = Math.hypot(dx, dy);
        }

        // 如果重疊，推開它們
        if (distance < minDist && distance > 0) {
          const overlap = minDist - distance;
          // pushRatio = (overlap / distance) / 2
          // overlap/distance 得出單位向量上的推擠量，/2 讓雙方各承擔一半
          const pushRatio = overlap / distance / 2;

          posA.x -= dx * pushRatio;
          posA.y -= dy * pushRatio;
          posB.x += dx * pushRatio;
          posB.y += dy * pushRatio;
          hasAdjustment = true;
        }
      }
    }

    if (!hasAdjustment) {
      break;
    }
  }

  // 邊界約束：確保泡泡不超出容器範圍
  for (let i = 0; i < bubbles.length; i++) {
    const bubble = bubbles[i];
    const pos = positions[i];
    if (!bubble || !pos) continue;

    const radius = bubble.size / 2;
    pos.x = Math.max(radius, Math.min(containerW - radius, pos.x));
    pos.y = Math.max(radius, Math.min(containerH - radius, pos.y));
  }

  return positions;
}
